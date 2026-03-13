import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import fs from "fs";
import { log } from "../log";
import { ProxyManager, ProxyConfig } from "./proxy-manager";
import { SessionManager } from "./session-manager";
import { InstagramComment, FetchCommentsResult } from "../instagram";
import { InstagramApiClient } from "./instagram-api-client";

// Add stealth plugin to evade detection
puppeteer.use(StealthPlugin());

// ── Browser pool entry ──────────────────────────────────────────────
interface PooledBrowser {
    browser: Browser;
    loggedIn: boolean;
    busy: boolean;
    /** Permanent browsers stay alive between scrapes; overflow browsers close after use */
    permanent: boolean;
    id: number;
}

export class InstagramScraper {
    private proxyManager: ProxyManager;
    private sessionManager: SessionManager;

    // Browser pool: always keep WARM_POOL_SIZE browsers ready.
    // If all are busy, spin up overflow browsers that close after use.
    private static readonly WARM_POOL_SIZE = 2;
    private pool: PooledBrowser[] = [];
    private nextBrowserId = 1;
    private poolInitialized = false;
    private poolInitPromise: Promise<void> | null = null;

    // Configuration
    private config = {
        // Development mode: use headless but with faster settings
        isHeadless: process.env.SCRAPER_HEADLESS === "true", // Default to visible browser for debugging
        // Scroll delays (optimized for speed while maintaining reliability)
        scrollDelayFast: parseInt(process.env.SCRAPER_SCROLL_DELAY_FAST || "300"),
        scrollDelayNormal: parseInt(process.env.SCRAPER_SCROLL_DELAY_NORMAL || "600"),
        scrollDelayStuck: parseInt(process.env.SCRAPER_SCROLL_DELAY_STUCK || "1500"),
        scrollDelayBottom: parseInt(process.env.SCRAPER_SCROLL_DELAY_BOTTOM || "2000"),

        // Scroll limits
        maxScrolls: parseInt(process.env.SCRAPER_MAX_SCROLLS || "500"),
        maxNoProgress: parseInt(process.env.SCRAPER_MAX_NO_PROGRESS || "15"),

        // Enable parallel processing
        enableParallel: process.env.SCRAPER_ENABLE_PARALLEL !== "false",
        parallelExtractionDelay: parseInt(process.env.SCRAPER_PARALLEL_DELAY || "50"),
    };

    constructor() {
        this.proxyManager = new ProxyManager();
        this.sessionManager = new SessionManager();
    }

    // ── Pool Management ─────────────────────────────────────────────────

    /**
     * Ensure the warm pool is initialized with WARM_POOL_SIZE browsers.
     * Called lazily on first use. Multiple concurrent callers share the same init promise.
     */
    private async ensurePoolReady(): Promise<void> {
        if (this.poolInitialized) {
            // Check that warm browsers are still alive, replace any dead ones
            await this.replenishPool();
            return;
        }

        if (this.poolInitPromise) {
            await this.poolInitPromise;
            return;
        }

        this.poolInitPromise = this.initPool();
        await this.poolInitPromise;
    }

    private async initPool(): Promise<void> {
        log(`Initializing browser pool (warm size: ${InstagramScraper.WARM_POOL_SIZE})...`, "scraper");
        const launches: Promise<void>[] = [];

        for (let i = 0; i < InstagramScraper.WARM_POOL_SIZE; i++) {
            launches.push(this.addPermanentBrowser());
        }

        await Promise.all(launches);
        this.poolInitialized = true;
        log(`Browser pool ready: ${this.pool.length} browsers warm`, "scraper");
    }

    private async addPermanentBrowser(): Promise<PooledBrowser> {
        const browser = await this.launchBrowser();
        const entry: PooledBrowser = {
            browser,
            loggedIn: false,
            busy: false,
            permanent: true,
            id: this.nextBrowserId++,
        };
        this.pool.push(entry);
        log(`Browser #${entry.id} launched (permanent)`, "scraper");
        return entry;
    }

    /**
     * Replace any dead permanent browsers so the warm pool stays at full size.
     */
    private async replenishPool(): Promise<void> {
        // Remove dead browsers from pool
        const deadEntries = this.pool.filter(e => e.permanent && !this.isBrowserAlive(e));
        for (const dead of deadEntries) {
            log(`Browser #${dead.id} found dead — removing from pool`, "scraper");
            try { await dead.browser.close(); } catch { /* already dead */ }
            this.pool = this.pool.filter(e => e !== dead);
        }

        // Launch replacements
        const permanentCount = this.pool.filter(e => e.permanent).length;
        const needed = InstagramScraper.WARM_POOL_SIZE - permanentCount;
        if (needed > 0) {
            log(`Replenishing pool: launching ${needed} replacement browser(s)`, "scraper");
            const launches: Promise<void>[] = [];
            for (let i = 0; i < needed; i++) {
                launches.push(this.addPermanentBrowser().then(() => {}));
            }
            await Promise.all(launches);
        }
    }

    private isBrowserAlive(entry: PooledBrowser): boolean {
        try {
            return entry.browser.connected;
        } catch {
            return false;
        }
    }

    /**
     * Acquire a browser from the pool.
     * - First tries to grab a free permanent browser (warm start)
     * - If all permanent browsers are busy, spins up an overflow browser (cold start)
     * - Overflow browsers are automatically closed when released
     */
    private async acquireBrowser(): Promise<PooledBrowser> {
        await this.ensurePoolReady();

        // Try to find a free permanent browser
        const free = this.pool.find(e => !e.busy && e.permanent && this.isBrowserAlive(e));
        if (free) {
            free.busy = true;
            log(`Acquired browser #${free.id} (permanent, warm start)`, "scraper");
            return free;
        }

        // All permanent browsers busy — spin up an overflow browser
        log(`All ${InstagramScraper.WARM_POOL_SIZE} warm browsers busy — launching overflow browser`, "scraper");
        const browser = await this.launchBrowser();
        const overflow: PooledBrowser = {
            browser,
            loggedIn: false,
            busy: true,
            permanent: false,
            id: this.nextBrowserId++,
        };
        this.pool.push(overflow);
        log(`Browser #${overflow.id} launched (overflow — will close after use)`, "scraper");
        return overflow;
    }

    /**
     * Release a browser back to the pool.
     * - Permanent browsers are marked as free and stay alive
     * - Overflow browsers are closed and removed from the pool
     */
    private async releaseBrowser(entry: PooledBrowser): Promise<void> {
        entry.busy = false;

        if (entry.permanent) {
            log(`Released browser #${entry.id} back to pool (permanent)`, "scraper");
            return;
        }

        // Overflow browser — close and remove
        log(`Closing overflow browser #${entry.id}`, "scraper");
        try { await entry.browser.close(); } catch { /* ignore */ }
        this.pool = this.pool.filter(e => e !== entry);
    }

    /**
     * Create a new page on the given browser with standard configuration.
     */
    private async createPageOn(entry: PooledBrowser): Promise<Page> {
        const page = await entry.browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        // Block images/fonts/media for speed
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() === 'image' ||
                req.resourceType() === 'font' ||
                req.resourceType() === 'media') {
                req.abort();
            } else {
                req.continue();
            }
        });

        return page;
    }

    /**
     * Get pool status for logging.
     */
    private poolStatus(): string {
        const permanent = this.pool.filter(e => e.permanent);
        const overflow = this.pool.filter(e => !e.permanent);
        const busy = this.pool.filter(e => e.busy);
        return `pool: ${permanent.length} warm (${busy.length} busy), ${overflow.length} overflow`;
    }

    /**
     * Launch browser with optimized settings
     */
    private async launchBrowser(): Promise<Browser> {
        const args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--window-size=1366,768",
            "--disable-blink-features=AutomationControlled",
            // Performance optimizations
            "--disable-extensions",
            "--disable-default-apps",
            "--disable-sync",
            "--no-first-run",
            "--metrics-recording-only",
            "--mute-audio",
            "--no-zygote",
        ];

        const proxy = this.proxyManager.getNextProxy();
        if (proxy) {
            args.push(`--proxy-server=${this.proxyManager.getProxyServer(proxy)}`);
            log(`Using proxy: ${proxy.host}:${proxy.port}`, "scraper");
        }

        const chromiumCandidates = [
            process.env.SCRAPER_EXECUTABLE_PATH,
            process.env.PUPPETEER_EXECUTABLE_PATH,
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
        ].filter((p): p is string => typeof p === "string" && p.length > 0);

        let executablePath: string | undefined;
        if (process.platform === "linux" && (process.arch === "arm" || process.arch === "arm64")) {
            executablePath = chromiumCandidates.find((p) => fs.existsSync(p));
            if (!executablePath) {
                log(
                    "Raspberry Pi/Linux ARM detected but Chromium path was not found. Set SCRAPER_EXECUTABLE_PATH.",
                    "scraper",
                );
            }
        } else if (process.env.SCRAPER_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH) {
            executablePath = chromiumCandidates.find((p) => fs.existsSync(p));
        }

        log(
            `Launching browser (headless: ${this.config.isHeadless}${executablePath ? `, executable: ${executablePath}` : ""})...`,
            "scraper",
        );
        const browser = await puppeteer.launch({
            headless: this.config.isHeadless,
            args,
            defaultViewport: { width: 1366, height: 768 },
            executablePath,
            // Disable loading of unnecessary resources for speed
            ignoreHTTPSErrors: true,
        });

        return browser;
    }

    /**
     * Ensure we're logged in (restore session or login)
     */
    private async ensureLoggedIn(page: Page, browserInstance: Browser): Promise<boolean> {
        // Try to restore session first
        if (this.sessionManager.hasSession()) {
            await this.sessionManager.restoreSession(page);

            // Verify session is still valid
            const isValid = await this.sessionManager.verifySession(page);
            if (isValid) {
                return true;
            }
        }

        // Need to login
        const username = process.env.INSTAGRAM_USERNAME;
        const password = process.env.INSTAGRAM_PASSWORD;

        if (!username || !password) {
            log("INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD not set. Cannot login.", "scraper");
            return false;
        }

        return await this.sessionManager.login(browserInstance, username, password);
    }

    /**
     * Wait for a random amount of time (human-like behavior) - optimized
     */
    private async randomDelay(min: number = 300, max: number = 800): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * FIXED: Enhanced button clicking for loading comments
     * This handles more variations of Instagram's comment loading buttons
     */
    private async clickLoadMoreButtons(page: Page): Promise<number> {
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('span, button, div, a, svg, article'));
            let clickedCount = 0;
            
            for (const el of elements) {
                try {
                    const text = (el.textContent || '').trim();
                    const ariaLabel = el.getAttribute('aria-label') || '';
                    const className = el.className || '';
                    const tagName = el.tagName.toLowerCase();
                    
                    // Only click interactive elements
                    if (!['button', 'a', 'div', 'span'].includes(tagName)) continue;
                    if (el.getAttribute('role') === 'img') continue;
                    
                    // Pattern 1: "View all X comments" with comma separators
                    if (/^View all\s+[\d,]+\s+comments?$/i.test(text)) {
                        (el as HTMLElement).click();
                        clickedCount++;
                    }
                    
                    // Pattern 2: "View X replies" or "View all X replies"
                    else if (/^View (all\s+)?[\d,]+\s+replies?$/i.test(text)) {
                        (el as HTMLElement).click();
                        clickedCount++;
                    }
                    
                    // Pattern 3: "View replies" without number
                    else if (/^View replies?$/i.test(text)) {
                        (el as HTMLElement).click();
                        clickedCount++;
                    }
                    
                    // Pattern 4: Text starting with "——" (Instagram's visual ellipsis)
                    else if (/^——/i.test(text) && ['button', 'a'].includes(tagName)) {
                        (el as HTMLElement).click();
                        clickedCount++;
                    }
                    
                    // Pattern 5: "Load more" or "Show more" - ONLY in buttons/links
                    else if (/load more/i.test(text) || /show more/i.test(text)) {
                        if (['button', 'a'].includes(tagName)) {
                            (el as HTMLElement).click();
                            clickedCount++;
                        }
                    }
                    
                    // Pattern 6: Plus button with specific aria-label
                    else if ((text === '+' || text.trim() === '+') && tagName === 'button') {
                        if (ariaLabel.includes('Load more') || ariaLabel.includes('more comment') ||
                            ariaLabel.includes('Load more comments')) {
                            (el as HTMLElement).click();
                            clickedCount++;
                        }
                    }
                    
                    // Pattern 7: Instagram's specific class patterns (CAUTIOUS clicking)
                    else if (typeof className === 'string') {
                        // Instagram's comment loading button classes
                        const hasCommentClass = className.includes('_acan') || className.includes('_acao');
                        const hasLoadClass = /_a9\-\-|_a9_0/i.test(className);
                        
                        if ((hasCommentClass || hasLoadClass) && tagName === 'button' && 
                            (ariaLabel.includes('comment') || ariaLabel.includes('reply') ||
                             text.includes('comment') || text.includes('reply'))) {
                            (el as HTMLElement).click();
                            clickedCount++;
                        }
                    }
                } catch (e) {
                    // Ignore click errors - element might not be clickable
                }
            }
            
            return clickedCount;
        });

        if (clicked > 0) {
            log(`✓ Clicked ${clicked} comment loading button(s)`, "scraper");
            // Shorter wait after clicking
            await this.randomDelay(800, 1500);
        }

        return clicked;
    }

    /**
     * Aggressively open the full comments view.
     * Instagram shows ~20-30 comments by default. We need to click
     * "View all X comments" to open the full panel before API extraction.
     * Tries multiple strategies with retries.
     */
    private async openFullCommentsView(page: Page): Promise<void> {
        for (let attempt = 0; attempt < 4; attempt++) {
            const clicked = await page.evaluate(() => {
                let found = false;
                const allElements = Array.from(document.querySelectorAll('span, a, button, div'));

                for (const el of allElements) {
                    const text = (el.textContent || '').trim();

                    // "View all X comments" — the main gate to full comments
                    if (/^View all\s+[\d,]+\s+comments?$/i.test(text)) {
                        (el as HTMLElement).click();
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    // Try clicking comment icon/button (speech bubble) to open comments panel
                    const commentButtons = document.querySelectorAll('[aria-label*="Comment"], [aria-label*="comment"], svg[aria-label*="Comment"]');
                    for (const btn of commentButtons) {
                        const clickTarget = btn.closest('button') || btn.closest('a') || btn as HTMLElement;
                        if (clickTarget) {
                            (clickTarget as HTMLElement).click();
                            found = true;
                            break;
                        }
                    }
                }

                return found;
            });

            if (clicked) {
                log(`Phase 0: Clicked "View all comments" (attempt ${attempt + 1})`, "scraper");
                // Wait for comments panel to load and API responses to come in
                await this.randomDelay(2000, 3500);
            } else {
                if (attempt === 0) {
                    log("Phase 0: No 'View all comments' button found — comments may already be open", "scraper");
                }
                break;
            }

            // Check if we now see a comments scrollable container
            const hasCommentPanel = await page.evaluate(() => {
                const allElements = document.querySelectorAll('div, section, ul');
                for (const el of allElements) {
                    const htmlEl = el as HTMLElement;
                    const style = window.getComputedStyle(htmlEl);
                    const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
                    if (!hasScroll) continue;
                    if (htmlEl.scrollHeight <= htmlEl.clientHeight + 50) continue;
                    const profileLinks = htmlEl.querySelectorAll('a[href^="/"]');
                    const realLinks = Array.from(profileLinks).filter(a => {
                        const h = a.getAttribute('href') || '';
                        return !h.includes('/p/') && !h.includes('/reel/') && !h.includes('/tv/') && h.length > 1;
                    });
                    if (realLinks.length >= 3) return true;
                }
                return false;
            });

            if (hasCommentPanel) {
                log("Phase 0: Comments panel detected — ready for extraction", "scraper");
                break;
            }
        }

        // Also click any "View replies" / "Load more" buttons visible now
        await this.clickLoadMoreButtons(page);
    }

    /**
     * Fallback: navigate to /p/{shortcode}/comments/ URL which sometimes
     * loads a dedicated comments page with more comments accessible.
     */
    private async tryCommentsUrlFallback(
        page: Page,
        postUrl: string,
        capturedComments: Map<string, InstagramComment>,
        lastApiResponseTime: { value: number },
    ): Promise<void> {
        const shortcodeMatch = postUrl.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        if (!shortcodeMatch) return;

        const commentsUrl = `https://www.instagram.com/p/${shortcodeMatch[2]}/comments/`;
        log(`Navigating to comments URL: ${commentsUrl}`, "scraper");

        try {
            await page.goto(commentsUrl, { waitUntil: "networkidle2", timeout: 30000 });
            await this.randomDelay(2000, 3000);

            // Click any load-more buttons on the comments page
            for (let attempt = 0; attempt < 3; attempt++) {
                const clicked = await this.clickLoadMoreButtons(page);
                if (clicked === 0) break;
                await this.randomDelay(800, 1500);
            }

            // Extract any comments from this page via DOM
            const domComments = await this.extractComments(page);
            let newCount = 0;
            for (const comment of domComments) {
                const key = `${comment.username}:${comment.text.substring(0, 50)}`;
                if (!capturedComments.has(key)) {
                    capturedComments.set(key, comment);
                    newCount++;
                }
            }
            if (newCount > 0) {
                lastApiResponseTime.value = Date.now();
            }
            log(`Comments URL fallback: +${newCount} new comments (total: ${capturedComments.size})`, "scraper");

            // Navigate back to original post for further phases
            await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 });
            await this.randomDelay(1000, 2000);
            await this.openFullCommentsView(page);
        } catch (err) {
            log(`Comments URL fallback failed: ${err instanceof Error ? err.message : err}`, "scraper");
            // Navigate back to original post
            try {
                await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 30000 });
                await this.randomDelay(1000, 2000);
            } catch { /* ignore */ }
        }
    }

    /**
     * FIXED: Optimized scroll logic with much faster performance
     * 
     * Key improvements:
     * - Reduced all delays significantly
     * - Parallel DOM extraction during scroll delays
     * - Better early exit conditions
     * - More adaptive scrolling based on progress
     */
    private async scrollCommentsSection(
        page: Page,
        capturedComments: Map<string, InstagramComment>,
        lastApiResponseTime: { value: number },
        maxScrolls: number = this.config.maxScrolls,
        targetCommentCount: number = 100000
    ): Promise<void> {
        let noProgressCount = 0;
        let lastCommentCount = capturedComments.size;
        let consecutiveZeroScrolls = 0;
        let currentDelayMode = 'fast'; // 'fast', 'normal', 'stuck', 'bottom'
        const maxNoProgress = 30; // Increased: give more time for slow-loading comments
        const maxZeroScrolls = 25; // Increased: more tolerance for stuck scrolling

        log(`Starting scroll loop: target=${targetCommentCount}, maxScrolls=${maxScrolls}`, "scraper");

        for (let i = 0; i < maxScrolls; i++) {
            // Click load more buttons frequently — every 5 iterations
            // This is critical: Instagram lazy-loads "View replies" and "Load more" buttons
            if (i % 5 === 0) {
                await this.clickLoadMoreButtons(page);
            }

            // Optimized scroll distance calculation
            const scrollResult = await page.evaluate(() => {
                let bestScrollAmount = 0;
                let bestElement: HTMLElement | null = null;
                let foundScrollable = false;
                let atBottom = false;

                // Strategy 1: Look for the main comments container
                const allElements = Array.from(document.querySelectorAll('div, section, ul, article'));
                
                for (const el of allElements) {
                    const htmlEl = el as HTMLElement;
                    const style = window.getComputedStyle(htmlEl);
                    const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
                    
                    if (!hasScroll) continue;
                    
                    const canScroll = htmlEl.scrollHeight > htmlEl.clientHeight + 50;
                    if (!canScroll) continue;
                    
                    // Check if this element contains comments (use same selector as extraction)
                    const profileLinks = htmlEl.querySelectorAll('a[href^="/"]');
                    const hasProfileLinks = Array.from(profileLinks).filter(a => {
                        const h = a.getAttribute('href') || '';
                        return !h.includes('/p/') && !h.includes('/reel/') && !h.includes('/tv/') && h.length > 1;
                    }).length > 3;
                    const hasUsernamePattern = /@[a-zA-Z0-9._]+/.test(htmlEl.textContent || '');
                    
                    if (hasProfileLinks || hasUsernamePattern) {
                        foundScrollable = true;
                        
                        // Larger scroll amount for speed
                        const scrollAmount = Math.min(
                            Math.max(htmlEl.clientHeight * 0.9, 600),
                            htmlEl.scrollHeight - htmlEl.scrollTop - htmlEl.clientHeight
                        );
                        
                        if (scrollAmount > bestScrollAmount) {
                            bestScrollAmount = scrollAmount;
                            bestElement = htmlEl;
                        }
                    }
                }

                // Strategy 2: Document body scroll fallback
                if (bestScrollAmount === 0) {
                    const htmlEl = document.body;
                    const canScroll = htmlEl.scrollHeight > htmlEl.clientHeight + 100;
                    if (canScroll && htmlEl.textContent && htmlEl.textContent.length > 1000) {
                        foundScrollable = true;
                        bestScrollAmount = Math.min(
                            window.innerHeight * 0.8,
                            htmlEl.scrollHeight - htmlEl.scrollTop - htmlEl.clientHeight
                        );
                        bestElement = htmlEl;
                    }
                }

                // Execute the scroll
                let actuallyScrolled = 0;
                if (bestElement && bestScrollAmount > 10) {
                    const before = bestElement.scrollTop;
                    bestElement.scrollTop += bestScrollAmount;
                    const after = bestElement.scrollTop;
                    actuallyScrolled = after - before;
                    
                    atBottom = (after + bestElement.clientHeight) >= (bestElement.scrollHeight - 20);
                }

                return {
                    scrolled: actuallyScrolled > 0,
                    scrollAmount: actuallyScrolled,
                    atBottom,
                    foundScrollable
                };
            });

            if (!scrollResult.foundScrollable) {
                log("WARNING: No scrollable comments container found!", "scraper");
                // Quick fallback scroll
                await page.evaluate(() => {
                    window.scrollBy(0, 300);
                });
                await this.randomDelay(300, 600);
                continue;
            }

            // Track consecutive zero scrolls
            if (!scrollResult.scrolled || scrollResult.scrollAmount === 0) {
                consecutiveZeroScrolls++;
                currentDelayMode = 'stuck';
            } else {
                consecutiveZeroScrolls = 0;
                currentDelayMode = 'fast';
            }

            // Determine delay based on state
            let delayMin: number, delayMax: number;
            
            if (scrollResult.atBottom || consecutiveZeroScrolls > 5) {
                delayMin = this.config.scrollDelayBottom - 500;
                delayMax = this.config.scrollDelayBottom;
                currentDelayMode = 'bottom';
            } else if (currentDelayMode === 'stuck') {
                delayMin = this.config.scrollDelayStuck - 500;
                delayMax = this.config.scrollDelayStuck;
            } else if (scrollResult.scrolled) {
                // Normal scrolling - use fast delay
                if (capturedComments.size > lastCommentCount) {
                    delayMin = this.config.scrollDelayFast;
                    delayMax = this.config.scrollDelayFast + 200;
                } else {
                    delayMin = this.config.scrollDelayNormal;
                    delayMax = this.config.scrollDelayNormal + 300;
                }
            } else {
                delayMin = 300;
                delayMax = 600;
            }

            // Parallel: Extract DOM comments while waiting for scroll
            const scrollPromise = this.randomDelay(delayMin, delayMax);
            let extractionPromise: Promise<void> | null = null;
            
            if (this.config.enableParallel) {
                extractionPromise = (async () => {
                    try {
                        await new Promise(r => setTimeout(r, this.config.parallelExtractionDelay));
                        const domComments = await this.extractComments(page);
                        let newCount = 0;
                        for (const comment of domComments) {
                            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
                            if (!capturedComments.has(key)) {
                                capturedComments.set(key, comment);
                                newCount++;
                            }
                        }
                        if (newCount > 0) {
                            lastApiResponseTime.value = Date.now();
                        }
                    } catch (e) {
                        // Ignore extraction errors during scroll
                    }
                })();
                await Promise.all([scrollPromise, extractionPromise]);
            } else {
                await scrollPromise;
            }

            // Log progress periodically (less frequently)
            if (i % 25 === 0 || scrollResult.atBottom) {
                log(`Scroll ${i + 1}/${maxScrolls}: +${scrollResult.scrollAmount}px, ` +
                    `${capturedComments.size} comments, mode=${currentDelayMode}`, "scraper");
            }

            // Check if we've reached the target
            const currentCount = capturedComments.size;
            if (currentCount >= targetCommentCount) {
                log(`✓ Reached target comment count: ${currentCount}`, "scraper");
                break;
            }

            // Check for progress
            if (currentCount > lastCommentCount) {
                noProgressCount = 0;
                lastCommentCount = currentCount;
                
                if (currentCount % 250 === 0) {
                    const percentage = ((currentCount / targetCommentCount) * 100).toFixed(1);
                    log(`Progress: ${currentCount} comments (${percentage}%)`, "scraper");
                }
            } else {
                noProgressCount++;
                
                if (noProgressCount >= maxNoProgress) {
                    log(`No progress for ${maxNoProgress} iterations. Stopping at ${currentCount} comments.`, "scraper");
                    break;
                }
            }

            // Check if completely stuck
            if (consecutiveZeroScrolls >= maxZeroScrolls) {
                log(`Completely stuck (${maxZeroScrolls} zero scrolls). Stopping at ${currentCount} comments.`, "scraper");
                break;
            }

            // Check if at bottom for several consecutive iterations
            if (scrollResult.atBottom) {
                log(`At bottom of comments (iteration ${i + 1})`, "scraper");
                // When at bottom, aggressively click load-more buttons to expand replies
                await this.clickLoadMoreButtons(page);
                if (capturedComments.size > 0 && noProgressCount >= 10) {
                    log(`Bottom confirmed with no progress (${noProgressCount} iterations). Stopping at ${currentCount} comments.`, "scraper");
                    break;
                }
            }
        }

        log(`Scroll loop complete. Final comment count: ${capturedComments.size}`, "scraper");
    }

    /**
     * FIXED: Enhanced comment extraction with better error handling
     */
    private async extractComments(page: Page): Promise<InstagramComment[]> {
        const domComments = await page.evaluate(() => {
            const results = new Map<string, any>();
            const seenKeys = new Set<string>();

            const usernamePattern = /^[a-zA-Z0-9._]{1,30}$/;
            const timestampPattern = /^(Edited\s*•?\s*)?\d+\s*[hdwm]$/i;

            // Strategy 1: DOM-based extraction from comment containers
            // Find <ul> elements that contain at least 2 profile links (comment lists)
            const allUls = document.querySelectorAll('ul');
            const commentContainers: Element[] = [];
            for (const ul of allUls) {
                const profileLinks = ul.querySelectorAll('a[href^="/"]');
                const realProfileLinks = Array.from(profileLinks).filter(a => {
                    const h = a.getAttribute('href') || '';
                    return !h.includes('/p/') && !h.includes('/reel/') && !h.includes('/tv/') && h.length > 1;
                });
                if (realProfileLinks.length >= 2) {
                    commentContainers.push(ul);
                }
            }
            // Extract from <li> children of comment containers
            const commentItems: Element[] = [];
            for (const container of commentContainers) {
                const lis = container.querySelectorAll(':scope > li');
                for (const li of lis) commentItems.push(li);
            }
            // Fallback: if no comment containers found, try direct li with profile links
            if (commentItems.length === 0) {
                const allLis = document.querySelectorAll('li');
                for (const li of allLis) {
                    if (li.querySelector('a[href^="/"]')) commentItems.push(li);
                }
            }

            for (const item of commentItems) {
                // Look for username link
                const usernameLink = item.querySelector('a[href^="/"]');
                if (!usernameLink) continue;

                const href = usernameLink.getAttribute('href') || '';
                // Must be a profile link
                if (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/')) continue;

                let username = href.replace(/^\//, '').replace(/\/$/, '').split('/')[0];
                if (!username || username.length > 30 || !usernamePattern.test(username)) continue;

                // Look for comment text near the username — skip UI elements
                let text = '';
                const nearbyElements = Array.from(item.querySelectorAll('span'));

                for (const el of nearbyElements) {
                    // Skip spans inside buttons, time elements, and links (UI chrome)
                    const parent = el.parentElement;
                    if (parent && (parent.tagName === 'BUTTON' || parent.tagName === 'TIME' || parent.tagName === 'A')) continue;
                    if (el.closest('button') || el.closest('time')) continue;

                    const elText = (el.textContent || '').trim();
                    if (elText.length === 0) continue;
                    // Allow short text if it contains emoji, otherwise skip very short strings (UI artifacts)
                    const hasEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(elText);
                    if (elText.length < 3 && !hasEmoji) continue;
                    if (usernamePattern.test(elText)) continue;
                    if (timestampPattern.test(elText)) continue;
                    if (/^\d+\s*likes?$/i.test(elText)) continue;
                    if (/^(Reply|View|Load|Like|Save|Share|More|See translation)$/i.test(elText)) continue;
                    if (/^View (all\s+)?[\d,]+\s+(comments?|replies?)$/i.test(elText)) continue;

                    text = elText;
                    break;
                }

                if (!text) continue;

                const key = `${username.toLowerCase()}:${text.substring(0, 50).toLowerCase()}`;
                if (seenKeys.has(key)) continue;

                // Get avatar if available
                let avatar: string | undefined;
                const parent = usernameLink.parentElement;
                if (parent) {
                    const avatarImg = parent.querySelector('img');
                    if (avatarImg) {
                        const src = avatarImg.getAttribute('src') || '';
                        if (src.includes('instagram') || src.includes('cdninstagram') || src.includes('scontent')) {
                            avatar = src;
                        }
                    }
                }

                // Generate ID safely
                const id = `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

                const comment = {
                    id: id,
                    username,
                    text,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    avatar,
                };

                seenKeys.add(key);
                results.set(key, comment);
            }

            // Strategy 2: Parse from body text
            const bodyText = document.body.innerText || '';
            const lines = bodyText.split('\n');
            
            let currentUsername: string | null = null;
            let currentText: string[] = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                if (usernamePattern.test(line) && i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    
                    if (timestampPattern.test(nextLine)) {
                        // Save previous comment
                        if (currentUsername && currentText.length > 0) {
                            const text = currentText.join(' ').trim();
                            const key = `${currentUsername.toLowerCase()}:${text.substring(0, 50).toLowerCase()}`;
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                const id = `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                                results.set(key, {
                                    id: id,
                                    username: currentUsername,
                                    text,
                                    timestamp: new Date().toISOString(),
                                    likes: 0,
                                });
                            }
                        }

                        currentUsername = line;
                        currentText = [];
                        i++;
                        continue;
                    }
                }
                
                if (currentUsername) {
                    if (timestampPattern.test(line)) continue;
                    if (/^\d+\s*likes?$/i.test(line)) continue;
                    if (/^Reply$/i.test(line)) {
                        if (currentText.length > 0) {
                            const text = currentText.join(' ').trim();
                            const key = `${currentUsername.toLowerCase()}:${text.substring(0, 50).toLowerCase()}`;
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                const id = `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                                results.set(key, {
                                    id: id,
                                    username: currentUsername,
                                    text,
                                    timestamp: new Date().toISOString(),
                                    likes: 0,
                                });
                            }
                        }
                        currentUsername = null;
                        currentText = [];
                        continue;
                    }
                    if (/^View/i.test(line)) continue;
                    if (/^See translation$/i.test(line)) continue;
                    if (!line) continue;
                    
                    currentText.push(line);
                }
            }
            
            // Save last comment
            if (currentUsername && currentText.length > 0) {
                const text = currentText.join(' ').trim();
                const key = `${currentUsername.toLowerCase()}:${text.substring(0, 50).toLowerCase()}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    const id = `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                    results.set(key, {
                        id: id,
                        username: currentUsername,
                        text,
                        timestamp: new Date().toISOString(),
                        likes: 0,
                    });
                }
            }
            
            return Array.from(results.values());
        });

        // Deduplicate by username + text
        const uniqueComments = new Map<string, InstagramComment>();
        for (const comment of domComments as any[]) {
            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
            if (!uniqueComments.has(key)) {
                uniqueComments.set(key, {
                    id: comment.id,
                    username: comment.username,
                    text: comment.text,
                    timestamp: comment.timestamp,
                    likes: comment.likes || 0,
                    avatar: comment.avatar,
                });
            }
        }

        return Array.from(uniqueComments.values());
    }

    /**
     * Extract comments from Instagram API response data.
     * Uses depth limiting, visited-object tracking, and explicit container keys
     * to avoid infinite recursion on circular/deeply nested structures.
     */
    private extractCommentsFromApiResponse(data: any): InstagramComment[] {
        const comments: InstagramComment[] = [];
        const visited = new WeakSet<object>();
        const MAX_DEPTH = 10;

        // Only recurse into these known Instagram API container keys
        const CONTAINER_KEYS = [
            'data', 'shortcode_media', 'xdt_shortcode_media',
            'edge_media_to_comment', 'edge_media_to_parent_comment',
            'edge_threaded_comments', 'edges', 'node',
            'comments', 'items', 'page_info',
        ];

        const extractComment = (obj: any): boolean => {
            // Pattern 1: v1 API — { user: { username }, text }
            if (obj.user && typeof obj.user === 'object' && obj.user.username && obj.text) {
                comments.push({
                    id: String(obj.pk || obj.id || `${obj.user.username}_${Date.now()}_${Math.random().toString(36).substring(7)}`),
                    username: obj.user.username,
                    text: obj.text,
                    timestamp: obj.created_at ? new Date(obj.created_at * 1000).toISOString() : new Date().toISOString(),
                    likes: obj.comment_like_count || obj.like_count || 0,
                    avatar: obj.user.profile_pic_url || undefined,
                });
                return true;
            }
            // Pattern 2: GraphQL — { owner: { username }, text }
            if (obj.owner && typeof obj.owner === 'object' && obj.owner.username && obj.text) {
                comments.push({
                    id: String(obj.id || obj.pk || `${obj.owner.username}_${Date.now()}_${Math.random().toString(36).substring(7)}`),
                    username: obj.owner.username,
                    text: obj.text,
                    timestamp: obj.created_at ? new Date(obj.created_at * 1000).toISOString() : new Date().toISOString(),
                    likes: obj.edge_liked_by?.count || obj.like_count || 0,
                    avatar: obj.owner.profile_pic_url || undefined,
                });
                return true;
            }
            return false;
        };

        const findComments = (obj: any, depth: number): void => {
            if (!obj || typeof obj !== 'object' || depth > MAX_DEPTH) return;
            if (visited.has(obj)) return;
            visited.add(obj);

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    findComments(item, depth + 1);
                }
                return;
            }

            // Try to extract a comment from this object; if successful, only
            // recurse into threaded replies — don't recurse into comment properties
            if (extractComment(obj)) {
                // Still check for threaded replies within this comment
                if (obj.edge_threaded_comments) findComments(obj.edge_threaded_comments, depth + 1);
                if (obj.preview_child_comments) findComments(obj.preview_child_comments, depth + 1);
                if (obj.child_comments) findComments(obj.child_comments, depth + 1);
                return;
            }

            // Not a comment — recurse only into known container keys
            for (const key of CONTAINER_KEYS) {
                if (obj[key] !== undefined) {
                    findComments(obj[key], depth + 1);
                }
            }
        };

        findComments(data, 0);

        // Deduplicate
        const unique = new Map<string, InstagramComment>();
        for (const comment of comments) {
            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
            if (!unique.has(key)) {
                unique.set(key, comment);
            }
        }

        return Array.from(unique.values());
    }

    /**
     * FIXED: Main fetch function with optimized performance
     * 
     * Key improvements:
     * - Parallel DOM extraction during scroll
     * - Faster overall operation
     * - Better error handling
     */
    async fetchComments(postUrl: string, targetCommentCount: number = 100000): Promise<FetchCommentsResult> {
        // Hard 3-minute deadline for the entire scrape operation
        const HARD_DEADLINE_MS = 180_000; // 3 minutes
        const startTime = Date.now();
        const hardDeadline = startTime + HARD_DEADLINE_MS;

        // Acquire a browser from the pool (warm start or overflow)
        const entry = await this.acquireBrowser();
        log(`Starting comment scraper for: ${postUrl} (target: ${targetCommentCount}, deadline: ${HARD_DEADLINE_MS / 1000}s, browser #${entry.id}, ${this.poolStatus()})`, "scraper");

        const page = await this.createPageOn(entry);

        try {
            // Ensure logged in (skips if this browser already authenticated)
            if (!entry.loggedIn) {
                const loggedIn = await this.ensureLoggedIn(page, entry.browser);
                if (!loggedIn) {
                    throw new Error("Failed to login to Instagram");
                }
                entry.loggedIn = true;
            } else {
                // Restore session cookies on the new page
                await this.sessionManager.restoreSession(page);
                log(`Browser #${entry.id}: reusing login session (warm start)`, "scraper");
            }

            // Set up network interception for API responses
            const capturedComments = new Map<string, InstagramComment>();
            const lastApiResponseTime = { value: Date.now() };
            
            page.on('response', async (response) => {
                const url = response.url();
                const status = response.status();

                if (status < 200 || status >= 400) return;

                // Must be from Instagram
                if (!url.includes('instagram.com') && !url.includes('cdninstagram.com')) return;

                // Content-type guard: only parse JSON responses
                const contentType = response.headers()['content-type'] || '';
                if (!contentType.includes('json') && !contentType.includes('text')) return;

                // Check for Instagram API endpoints
                const isInstagramApi =
                    url.includes('/graphql') ||
                    url.includes('/api/v1/') ||
                    url.includes('/api/graphql') ||
                    url.includes('query_hash') ||
                    (url.includes('/api/') && url.includes('comments'));

                if (!isInstagramApi) return;

                try {
                    const responseText = await response.text().catch(() => null);
                    if (!responseText || responseText.length < 50) return;
                    
                    let data: any;
                    try {
                        data = JSON.parse(responseText);
                    } catch {
                        return;
                    }
                    
                    const comments = this.extractCommentsFromApiResponse(data);
                    if (comments.length === 0) return;
                    
                    let newCount = 0;
                    for (const comment of comments) {
                        if (comment.username && comment.text) {
                            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
                            if (!capturedComments.has(key)) {
                                capturedComments.set(key, comment);
                                newCount++;
                            }
                        }
                    }
                    
                    if (newCount > 0) {
                        lastApiResponseTime.value = Date.now();
                        log(`API: +${newCount} comments (total: ${capturedComments.size})`, "scraper");
                    }
                } catch (error) {
                    // Silently ignore parsing errors
                }
            });

            // Navigate to the post
            log(`Navigating to post: ${postUrl}`, "scraper");
            await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 60000 });
            await this.randomDelay(1500, 2500);

            // ── Phase 0: Open full comments view ───────────────────────
            // Instagram initially shows only ~20-30 comments. We MUST click
            // "View all X comments" to open the full comments panel/modal
            // before doing any API extraction.
            log("Phase 0: Opening full comments view...", "scraper");
            await this.openFullCommentsView(page);

            // ── Phase 1: Direct API extraction (fastest path) ─────────────
            const apiClient = new InstagramApiClient();
            let directApiCount = 0;
            try {
                const directResult = await apiClient.fetchComments(page, postUrl, targetCommentCount);
                for (const comment of directResult.comments) {
                    const key = `${comment.username}:${comment.text.substring(0, 50)}`;
                    if (!capturedComments.has(key)) {
                        capturedComments.set(key, comment);
                    }
                }
                directApiCount = directResult.comments.length;
                log(`Phase 1 complete: Direct API got ${directApiCount} comments (map: ${capturedComments.size})`, "scraper");
            } catch (err) {
                log(`Phase 1 direct API failed: ${err instanceof Error ? err.message : err}`, "scraper");
            }

            // If Phase 1 got very few comments, try navigating to /comments/ URL
            if (capturedComments.size < 50 && Date.now() < hardDeadline) {
                log(`Phase 1 only got ${capturedComments.size} comments — trying /comments/ URL fallback...`, "scraper");
                await this.tryCommentsUrlFallback(page, postUrl, capturedComments, lastApiResponseTime);
            }

            // Only skip scroll/DOM if we already have enough comments or time is up
            const timeRemaining = hardDeadline - Date.now();
            const skipScroll = capturedComments.size >= targetCommentCount || timeRemaining < 10_000;
            if (skipScroll) {
                log(`Skipping scroll/DOM phase — have ${capturedComments.size} comments, ${Math.round(timeRemaining / 1000)}s remaining`, "scraper");
            }

            let domComments: InstagramComment[] = [];
            if (!skipScroll && Date.now() < hardDeadline) {
                // ── Phase 2: Scroll + network interception fallback ───────
                // Aggressively click all load-more buttons before scrolling
                log("Phase 2: Clicking all load-more buttons...", "scraper");
                for (let attempt = 0; attempt < 5; attempt++) {
                    const clicked = await this.clickLoadMoreButtons(page);
                    if (clicked === 0) break;
                    await this.randomDelay(800, 1500);
                }

                log("Phase 2: Scrolling to capture API responses...", "scraper");
                await this.scrollCommentsSection(page, capturedComments, lastApiResponseTime, this.config.maxScrolls, targetCommentCount);

                // ── Phase 3: DOM extraction if still short and time remains ──
                if (capturedComments.size < targetCommentCount && Date.now() < hardDeadline) {
                    log("Phase 3: Extracting comments from DOM...", "scraper");
                    await this.randomDelay(300, 600);
                    domComments = await this.extractComments(page);
                    log(`DOM extracted ${domComments.length} comments`, "scraper");
                }
            }

            // Merge all comments
            const allComments = Array.from(capturedComments.values());
            const existingKeys = new Set<string>(Array.from(capturedComments.keys()));

            for (const domComment of domComments) {
                const key = `${domComment.username}:${domComment.text.substring(0, 50)}`;
                if (!existingKeys.has(key)) {
                    allComments.push(domComment);
                    existingKeys.add(key);
                }
            }

            const comments = allComments;

            // Get post info
            const postInfo = await page.evaluate(() => {
                const url = window.location.href;
                const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                const id = match ? match[2] : undefined;
                return { id };
            });

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            await page.close();

            log(`✓ Extraction complete in ${elapsed}s. Total comments: ${comments.length} (DirectAPI: ${directApiCount}, NetworkAPI: ${capturedComments.size - directApiCount}, DOM: ${domComments.length})`, "scraper");

            return {
                comments,
                total: comments.length,
                postInfo: postInfo.id ? { id: postInfo.id } : undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Scraping error on browser #${entry.id}: ${errorMessage}`, "scraper");
            // If browser crashed, mark login as stale
            if (!this.isBrowserAlive(entry)) {
                entry.loggedIn = false;
            }
            throw error;
        } finally {
            // Close the page, release browser back to pool
            try { await page.close(); } catch { /* ignore */ }
            await this.releaseBrowser(entry);
        }
    }

    /**
     * Check if given user IDs follow the currently logged-in account.
     * Reuses persistent browser instance.
     */
    async checkFollowers(userIds: string[]): Promise<Record<string, boolean>> {
        const entry = await this.acquireBrowser();
        log(`Starting follower check for ${userIds.length} users (browser #${entry.id}, ${this.poolStatus()})`, "scraper");
        const page = await this.createPageOn(entry);

        try {
            // Restore session cookies
            const restored = await this.sessionManager.restoreSession(page);
            if (!restored) {
                throw new Error("No saved Instagram session. Run a comment scrape first to establish a session.");
            }

            // Navigate to Instagram to activate cookies
            await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded", timeout: 15000 });
            await new Promise((r) => setTimeout(r, 2000));

            const apiClient = new InstagramApiClient();
            const resultMap = await apiClient.checkFollowStatus(page, userIds);

            const result: Record<string, boolean> = {};
            for (const [userId, follows] of resultMap) {
                result[userId] = follows;
            }
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Follower check error on browser #${entry.id}: ${errorMessage}`, "scraper");
            if (!this.isBrowserAlive(entry)) {
                entry.loggedIn = false;
            }
            throw error;
        } finally {
            try { await page.close(); } catch { /* ignore */ }
            await this.releaseBrowser(entry);
        }
    }

    /**
     * Cleanup resources — closes all browsers in the pool.
     */
    async close(): Promise<void> {
        log(`Closing browser pool (${this.pool.length} browsers)...`, "scraper");
        const closes = this.pool.map(async (entry) => {
            try { await entry.browser.close(); } catch { /* ignore */ }
        });
        await Promise.all(closes);
        this.pool = [];
        this.poolInitialized = false;
        this.poolInitPromise = null;
    }
}
