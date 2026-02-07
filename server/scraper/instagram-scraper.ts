import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import { log } from "../log";
import { ProxyManager, ProxyConfig } from "./proxy-manager";
import { SessionManager } from "./session-manager";
import { InstagramComment, FetchCommentsResult } from "../instagram";

// Add stealth plugin to evade detection
puppeteer.use(StealthPlugin());

export class InstagramScraper {
    private browser: Browser | null = null;
    private proxyManager: ProxyManager;
    private sessionManager: SessionManager;

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

        log(`Launching browser (headless: ${this.config.isHeadless})...`, "scraper");
        const browser = await puppeteer.launch({
            headless: this.config.isHeadless,
            args,
            defaultViewport: { width: 1366, height: 768 },
            // Disable loading of unnecessary resources for speed
            ignoreHTTPSErrors: true,
        });

        return browser;
    }

    /**
     * Ensure we're logged in (restore session or login)
     */
    private async ensureLoggedIn(page: Page): Promise<boolean> {
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

        return await this.sessionManager.login(this.browser!, username, password);
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
        targetCommentCount: number = 2000
    ): Promise<void> {
        let noProgressCount = 0;
        let lastCommentCount = capturedComments.size;
        let consecutiveZeroScrolls = 0;
        let currentDelayMode = 'fast'; // 'fast', 'normal', 'stuck', 'bottom'
        const maxNoProgress = this.config.maxNoProgress;
        const maxZeroScrolls = 15; // Reduced from 50
        
        log(`Starting scroll loop: target=${targetCommentCount}, maxScrolls=${maxScrolls}`, "scraper");

        for (let i = 0; i < maxScrolls; i++) {
            // Click load more buttons periodically (less frequently - every 20 iterations)
            if (i % 20 === 0 && i > 0) {
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
                    
                    // Check if this element contains comments
                    const hasProfileLinks = htmlEl.querySelectorAll('a[href^="/"][href$="/"]').length > 3;
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
                if (capturedComments.size > 0 && noProgressCount >= 5) {
                    log(`Bottom confirmed with no progress. Stopping at ${currentCount} comments.`, "scraper");
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

            // SAFE: Generate unique key function (no __name variable)
            const generateKey = (username: string, text: string): string => {
                return `${username.toLowerCase()}:${text.substring(0, 50).toLowerCase()}`;
            };

            const usernamePattern = /^[a-zA-Z0-9._]{1,30}$/;
            const timestampPattern = /^(Edited\s*•?\s*)?\d+\s*[hdwm]$/i;

            // Strategy 1: DOM-based extraction from comment items
            const commentItems = document.querySelectorAll('ul li, article div');
            
            for (const item of commentItems) {
                // Look for username link
                const usernameLink = item.querySelector('a[href^="/"]');
                if (!usernameLink) continue;

                const href = usernameLink.getAttribute('href') || '';
                // Must be a profile link
                if (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/')) continue;

                let username = href.replace(/^\//, '').replace(/\/$/, '').split('/')[0];
                if (!username || username.length > 30 || !usernamePattern.test(username)) continue;

                // Look for comment text near the username
                let text = '';
                const nearbyElements = Array.from(item.querySelectorAll('span, div'));
                
                for (const el of nearbyElements) {
                    const elText = (el.textContent || '').trim();
                    if (elText.length < 3) continue;
                    if (usernamePattern.test(elText)) continue;
                    if (timestampPattern.test(elText)) continue;
                    if (/^\d+\s*likes?$/i.test(elText)) continue;
                    if (/^(Reply|View|Load|Like|Save|Share|More)$/i.test(elText)) continue;
                    
                    text = elText;
                    break;
                }

                if (!text) continue;

                const key = generateKey(username, text);
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

                const comment = {
                    id: `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    username,
                    text,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    avatar,
                };

                seenKeys.add(key);
                results.set(username, comment);
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
                            const key = generateKey(currentUsername, text);
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                results.set(currentUsername, {
                                    id: `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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
                            const key = generateKey(currentUsername, text);
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                results.set(currentUsername, {
                                    id: `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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
                const key = generateKey(currentUsername, text);
                if (!seenKeys.has(key)) {
                    results.set(currentUsername, {
                        id: `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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
     * FIXED: enhanced API response extraction with more patterns
     */
    private extractCommentsFromApiResponse(data: any): InstagramComment[] {
        const comments: InstagramComment[] = [];
        
        const findComments = (obj: any, path: string = ''): void => {
            if (!obj || typeof obj !== 'object') return;
            
            // Array - recurse
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    findComments(item, path);
                }
                return;
            }
            
            // Pattern 1: Direct comment object with owner and text
            if (obj.owner && obj.text && typeof obj.owner === 'object') {
                const username = obj.owner.username || obj.user?.username;
                if (username && obj.text) {
                    comments.push({
                        id: obj.id || obj.pk || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        username: username,
                        text: obj.text,
                        timestamp: obj.created_at || obj.timestamp || new Date().toISOString(),
                        likes: obj.like_count || obj.likes_count || 0,
                        avatar: obj.owner?.profile_pic_url || obj.user?.profile_pic_url || undefined,
                    });
                }
            }
            
            // Pattern 2: GraphQL edge_media_to_comment structure
            if (obj.edge_media_to_comment?.edges) {
                for (const edge of obj.edge_media_to_comment.edges) {
                    if (edge.node) {
                        const node = edge.node;
                        const username = node.owner?.username || node.user?.username;
                        if (username && node.text) {
                            comments.push({
                                id: node.id || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                username: username,
                                text: node.text,
                                timestamp: node.created_at || node.timestamp || new Date().toISOString(),
                                likes: node.edge_liked_by?.count || node.like_count || 0,
                                avatar: node.owner?.profile_pic_url || node.user?.profile_pic_url || undefined,
                            });
                        }
                        
                        if (node.edge_threaded_comments?.edges) {
                            findComments(node, path + '.edge_threaded_comments');
                        }
                    }
                }
            }
            
            // Pattern 3-6: Common API structures
            if (obj.comments && Array.isArray(obj.comments)) {
                findComments(obj.comments, path + '.comments');
            }
            if (obj.items && Array.isArray(obj.items)) {
                findComments(obj.items, path + '.items');
            }
            if (obj.data) {
                findComments(obj.data, path + '.data');
            }
            if (obj.page_info?.edges) {
                findComments(obj.page_info.edges, path + '.page_info.edges');
            }

            // Recursively check all properties
            for (const key in obj) {
                if (obj.hasOwnProperty(key) && key !== '__proto__' && key !== 'constructor') {
                    findComments(obj[key], `${path}.${key}`);
                }
            }
        };
        
        findComments(data);
        
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
    async fetchComments(postUrl: string, targetCommentCount: number = 2000): Promise<FetchCommentsResult> {
        log(`Starting comment scraper for: ${postUrl} (target: ${targetCommentCount})`, "scraper");
        const startTime = Date.now();

        try {
            // Launch browser
            this.browser = await this.launchBrowser();
            const page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Enable request interception for performance
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                // Block images and unnecessary resources for speed
                if (req.resourceType() === 'image' || 
                    req.resourceType() === 'font' || 
                    req.resourceType() === 'media') {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Ensure logged in
            const loggedIn = await this.ensureLoggedIn(page);
            if (!loggedIn) {
                throw new Error("Failed to login to Instagram");
            }

            // Set up network interception for API responses
            const capturedComments = new Map<string, InstagramComment>();
            const lastApiResponseTime = { value: Date.now() };
            
            page.on('response', async (response) => {
                const url = response.url();
                const status = response.status();
                
                if (status < 200 || status >= 400) return;

                // Check for Instagram API endpoints
                const isInstagramApi = 
                    url.includes('graphql') || 
                    url.includes('/api/v1/') || 
                    url.includes('/api/graphql/') || 
                    url.includes('query_hash') ||
                    url.includes('comments') || 
                    url.includes('edge_media_to_comment') ||
                    (url.includes('instagram.com') && url.includes('/api/')) ||
                    url.includes('/web/');

                if (!isInstagramApi) return;

                try {
                    const responseText = await response.text();
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
            await this.randomDelay(2000, 3000);

            // Initial button clicking
            log("Looking for 'View all comments' buttons...", "scraper");
            await this.clickLoadMoreButtons(page);
            await this.randomDelay(1000, 1500);
            await this.clickLoadMoreButtons(page);

            // Phase 1: Scroll to capture API responses (optimized)
            log("Phase 1: Scrolling to capture API responses...", "scraper");
            await this.scrollCommentsSection(page, capturedComments, lastApiResponseTime, this.config.maxScrolls, targetCommentCount);

            // Phase 2: Check results and extract from DOM if needed
            const apiCommentCount = capturedComments.size;
            log(`API captured ${apiCommentCount} comments`, "scraper");

            let domComments: InstagramComment[] = [];
            if (apiCommentCount < targetCommentCount) {
                log("Phase 2: Extracting comments from DOM...", "scraper");
                await this.randomDelay(1000, 1500);
                domComments = await this.extractComments(page);
                log(`DOM extracted ${domComments.length} comments`, "scraper");
            }

            // Merge comments
            const allComments = Array.from(capturedComments.values());
            const domOnly = new Set<string>(Array.from(capturedComments.keys()));

            for (const domComment of domComments) {
                const key = `${domComment.username}:${domComment.text.substring(0, 50)}`;
                if (!domOnly.has(key)) {
                    allComments.push(domComment);
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

            log(`✓ Extraction complete in ${elapsed}s. Total comments: ${comments.length} (API: ${apiCommentCount}, DOM: ${domComments.length})`, "scraper");

            return {
                comments,
                total: comments.length,
                postInfo: postInfo.id ? { id: postInfo.id } : undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Scraping error: ${errorMessage}`, "scraper");
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }
    }

    /**
     * Cleanup resources
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
