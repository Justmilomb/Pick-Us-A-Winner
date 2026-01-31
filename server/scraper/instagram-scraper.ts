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

    constructor() {
        this.proxyManager = new ProxyManager();
        this.sessionManager = new SessionManager();
    }

    /**
     * Launch browser with proxy if available
     */
    private async launchBrowser(): Promise<Browser> {
        const args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--window-size=1366,768",
        ];

        const proxy = this.proxyManager.getNextProxy();
        if (proxy) {
            args.push(`--proxy-server=${this.proxyManager.getProxyServer(proxy)}`);
            log(`Using proxy: ${proxy.host}:${proxy.port}`, "scraper");
        }

        const browser = await puppeteer.launch({
            headless: true,
            args,
            defaultViewport: { width: 1366, height: 768 },
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
     * Wait for a random amount of time (human-like behavior)
     */
    private async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Scroll page to load more comments (Instagram lazy-loads)
     */
    private async scrollToLoadComments(page: Page, maxScrolls: number = 10): Promise<void> {
        for (let i = 0; i < maxScrolls; i++) {
            // Scroll down
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });

            await this.randomDelay(500, 1500);

            // Check if "Load more comments" button exists
            try {
                const loadMoreButton = await page.$('button:has-text("Load more comments")');
                if (loadMoreButton) {
                    await loadMoreButton.click();
                    await this.randomDelay(1000, 2000);
                }
            } catch (e) {
                // Button might not exist or already clicked
            }

            // Check if we've reached the bottom
            const isAtBottom = await page.evaluate(() => {
                return window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
            });

            if (isAtBottom && i > 2) {
                break;
            }
        }
    }

    /**
     * Extract comments from the page
     */
    private async extractComments(page: Page): Promise<InstagramComment[]> {
        const comments = await page.evaluate(() => {
            const commentElements: InstagramComment[] = [];
            
            // Instagram comment selectors (may need to be updated if Instagram changes their DOM)
            // Try multiple selectors for robustness
            const selectors = [
                'ul[role="list"] > li', // Main comment list
                'div[role="dialog"] ul li', // Comments in modal
                'article ul li', // Comments in post view
            ];

            let commentNodes: Element[] = [];
            for (const selector of selectors) {
                const nodes = Array.from(document.querySelectorAll(selector));
                if (nodes.length > 0) {
                    commentNodes = nodes;
                    break;
                }
            }

            for (const node of commentNodes) {
                try {
                    // Extract username
                    const usernameLink = node.querySelector('a[href^="/"]');
                    const username = usernameLink?.textContent?.trim() || 
                                   usernameLink?.getAttribute('href')?.replace('/', '') || 
                                   'unknown';

                    // Extract comment text
                    const textElement = node.querySelector('span') || node;
                    const text = textElement.textContent?.trim() || '';

                    // Skip if no text or username
                    if (!text || username === 'unknown') {
                        continue;
                    }

                    // Extract avatar
                    const img = node.querySelector('img');
                    const avatar = img?.getAttribute('src') || undefined;

                    // Extract timestamp (if available)
                    const timeElement = node.querySelector('time');
                    const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString();

                    // Generate ID from username + text hash
                    const id = `${username}_${text.substring(0, 20)}`.replace(/[^a-zA-Z0-9_]/g, '_');

                    commentElements.push({
                        id,
                        username,
                        text,
                        timestamp,
                        likes: 0, // Instagram doesn't show comment likes in the main view easily
                        avatar,
                    });
                } catch (e) {
                    // Skip malformed comments
                    continue;
                }
            }

            return commentElements;
        });

        // Remove duplicates based on username + text
        const uniqueComments = new Map<string, InstagramComment>();
        for (const comment of comments) {
            const key = `${comment.username}:${comment.text}`;
            if (!uniqueComments.has(key)) {
                uniqueComments.set(key, comment);
            }
        }

        return Array.from(uniqueComments.values());
    }

    /**
     * Fetch comments from an Instagram post
     */
    async fetchComments(postUrl: string): Promise<FetchCommentsResult> {
        log(`Starting custom scraper for: ${postUrl}`, "scraper");

        try {
            // Launch browser
            this.browser = await this.launchBrowser();
            const page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Ensure logged in
            const loggedIn = await this.ensureLoggedIn(page);
            if (!loggedIn) {
                throw new Error("Failed to login to Instagram");
            }

            // Navigate to post
            log(`Navigating to post: ${postUrl}`, "scraper");
            await page.goto(postUrl, {
                waitUntil: "networkidle2",
                timeout: 30000,
            });

            await this.randomDelay(2000, 4000);

            // Click "View all comments" if it exists
            try {
                const viewAllButton = await page.$('button:has-text("View all"), a:has-text("View all")');
                if (viewAllButton) {
                    await viewAllButton.click();
                    await this.randomDelay(2000, 3000);
                }
            } catch (e) {
                // Button might not exist
            }

            // Scroll to load all comments
            log("Scrolling to load comments...", "scraper");
            await this.scrollToLoadComments(page, 20);

            // Extract comments
            log("Extracting comments...", "scraper");
            const comments = await this.extractComments(page);

            // Get post info
            const postInfo = await page.evaluate(() => {
                // Try to get post ID from URL
                const url = window.location.href;
                const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                const id = match ? match[2] : undefined;

                // Try to get like count
                const likeButton = document.querySelector('button[aria-label*="like"]');
                const likeText = likeButton?.getAttribute('aria-label') || '';
                const likeMatch = likeText.match(/(\d+)/);
                const likeCount = likeMatch ? parseInt(likeMatch[1]) : undefined;

                return {
                    id,
                    likeCount,
                };
            });

            await page.close();

            log(`Extracted ${comments.length} comments`, "scraper");

            return {
                comments,
                total: comments.length,
                postInfo: postInfo.id ? {
                    id: postInfo.id,
                    likeCount: postInfo.likeCount,
                } : undefined,
            };
        } catch (error) {
            log(`Scraping error: ${error}`, "scraper");
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
