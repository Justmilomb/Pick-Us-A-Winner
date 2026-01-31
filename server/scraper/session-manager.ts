import { Browser, Page, Cookie } from "puppeteer";
import { log } from "../log";
import * as fs from "fs";
import * as path from "path";

const SESSION_FILE = path.join(process.cwd(), ".instagram-session.json");

export interface InstagramSession {
    cookies: Cookie[];
    username: string;
    savedAt: string;
}

export class SessionManager {
    private session: InstagramSession | null = null;

    constructor() {
        this.loadSession();
    }

    /**
     * Load saved session from disk
     */
    private loadSession(): void {
        try {
            if (fs.existsSync(SESSION_FILE)) {
                const data = fs.readFileSync(SESSION_FILE, "utf-8");
                this.session = JSON.parse(data);
                log(`Loaded saved session for ${this.session?.username}`, "scraper");
            }
        } catch (error) {
            log(`Failed to load session: ${error}`, "scraper");
        }
    }

    /**
     * Save session to disk
     */
    private saveSession(session: InstagramSession): void {
        try {
            fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
            this.session = session;
            log(`Saved session for ${session.username}`, "scraper");
        } catch (error) {
            log(`Failed to save session: ${error}`, "scraper");
        }
    }

    /**
     * Check if we have a valid session
     */
    hasSession(): boolean {
        return this.session !== null && this.session.cookies.length > 0;
    }

    /**
     * Get saved cookies
     */
    getCookies(): Cookie[] {
        return this.session?.cookies || [];
    }

    /**
     * Login to Instagram and save session
     */
    async login(browser: Browser, username: string, password: string): Promise<boolean> {
        const page = await browser.newPage();
        
        try {
            log(`Attempting to login as ${username}`, "scraper");
            
            // Set viewport
            await page.setViewport({ width: 1366, height: 768 });
            
            // Navigate to login page
            await page.goto("https://www.instagram.com/accounts/login/", {
                waitUntil: "networkidle2",
                timeout: 30000,
            });

            // Wait for login form
            await page.waitForSelector('input[name="username"]', { timeout: 10000 });
            
            // Fill in credentials
            await page.type('input[name="username"]', username, { delay: 100 });
            await page.type('input[name="password"]', password, { delay: 100 });
            
            // Click login button
            await page.click('button[type="submit"]');
            
            // Wait for navigation after login
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
            
            // Check if login was successful
            const currentUrl = page.url;
            if (currentUrl.includes("/accounts/login") || currentUrl.includes("/challenge")) {
                log("Login failed or challenge required", "scraper");
                await page.close();
                return false;
            }

            // Check for "Save Your Login Info" or "Not Now" buttons
            try {
                const notNowButton = await page.$('button:has-text("Not Now")');
                if (notNowButton) {
                    await notNowButton.click();
                    await page.waitForTimeout(1000);
                }
            } catch (e) {
                // Ignore if button doesn't exist
            }

            // Get cookies
            const cookies = await page.cookies();
            
            // Save session
            this.saveSession({
                cookies,
                username,
                savedAt: new Date().toISOString(),
            });

            log(`Successfully logged in as ${username}`, "scraper");
            await page.close();
            return true;
        } catch (error) {
            log(`Login error: ${error}`, "scraper");
            await page.close();
            return false;
        }
    }

    /**
     * Restore session cookies to a page
     */
    async restoreSession(page: Page): Promise<boolean> {
        if (!this.hasSession()) {
            return false;
        }

        try {
            await page.setCookie(...this.getCookies());
            log("Restored session cookies", "scraper");
            return true;
        } catch (error) {
            log(`Failed to restore session: ${error}`, "scraper");
            return false;
        }
    }

    /**
     * Verify if session is still valid by checking a page
     */
    async verifySession(page: Page): Promise<boolean> {
        try {
            await page.goto("https://www.instagram.com/", {
                waitUntil: "networkidle2",
                timeout: 15000,
            });

            // Check if we're logged in (not on login page)
            const url = page.url;
            if (url.includes("/accounts/login")) {
                log("Session expired - redirected to login", "scraper");
                this.clearSession();
                return false;
            }

            // Check for username in page (logged in indicator)
            const isLoggedIn = await page.evaluate(() => {
                return document.querySelector('a[href*="/accounts/"]') !== null;
            });

            if (!isLoggedIn) {
                log("Session appears invalid", "scraper");
                this.clearSession();
                return false;
            }

            log("Session is valid", "scraper");
            return true;
        } catch (error) {
            log(`Session verification error: ${error}`, "scraper");
            return false;
        }
    }

    /**
     * Clear saved session
     */
    clearSession(): void {
        try {
            if (fs.existsSync(SESSION_FILE)) {
                fs.unlinkSync(SESSION_FILE);
            }
            this.session = null;
            log("Cleared session", "scraper");
        } catch (error) {
            log(`Failed to clear session: ${error}`, "scraper");
        }
    }

    /**
     * Get username from saved session
     */
    getUsername(): string | null {
        return this.session?.username || null;
    }
}
