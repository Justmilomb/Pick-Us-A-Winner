import { Browser, Page, Cookie, ElementHandle } from "puppeteer";
import { log } from "../log";
import * as fs from "fs";
import * as path from "path";

const SESSION_FILE = path.join(process.cwd(), ".instagram-session.json");

/**
 * Helper function to delay execution (replaces deprecated page.waitForTimeout)
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
     * Handle cookie consent dialog if present
     */
    private async handleCookieConsent(page: Page): Promise<void> {
        try {
            // Wait a bit for the dialog to appear
            await delay(2000);
            
            // Try to find and click cookie consent button using evaluate
            const clicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                for (const button of buttons) {
                    const text = (button.textContent || '').toLowerCase().trim();
                    // Look for "Accept All", "Accept all cookies", etc.
                    if ((text.includes('accept') && text.includes('all')) || 
                        (text.includes('accept') && text.includes('cookies')) ||
                        text === 'accept all') {
                        (button as HTMLElement).click();
                        return true;
                    }
                }
                // Also try Instagram's specific cookie button class
                const instagramCookieButton = document.querySelector('button._a9--._a9_1');
                if (instagramCookieButton) {
                    (instagramCookieButton as HTMLElement).click();
                    return true;
                }
                return false;
            });

            if (clicked) {
                log("Found and clicked cookie consent dialog", "scraper");
                await delay(1500);
            } else {
                log("No cookie consent dialog found or already dismissed", "scraper");
            }
        } catch (e) {
            // No cookie dialog found, that's fine
            log("Error checking for cookie consent dialog (this is usually fine)", "scraper");
        }
    }

    /**
     * Wait for login form with retry logic
     */
    private async waitForLoginForm(page: Page, retries: number = 3): Promise<boolean> {
        const selectors = [
            'input[name="username"]',
            'input[aria-label*="username" i]',
            'input[aria-label*="phone" i]',
            'input[type="text"]',
        ];

        for (let attempt = 0; attempt < retries; attempt++) {
            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000, visible: true });
                    log(`Found login form using selector: ${selector}`, "scraper");
                    return true;
                } catch (e) {
                    // Try next selector
                    continue;
                }
            }
            
            if (attempt < retries - 1) {
                log(`Login form not found, retrying... (attempt ${attempt + 1}/${retries})`, "scraper");
                await delay(2000);
                // Try handling cookie consent again
                await this.handleCookieConsent(page);
            }
        }

        return false;
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
            
            // Set user agent to avoid detection
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );
            
            // Navigate to login page
            log("Navigating to Instagram login page...", "scraper");
            await page.goto("https://www.instagram.com/accounts/login/", {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            // Wait a bit for page to fully load
            await delay(3000);

            // Handle cookie consent dialog first
            await this.handleCookieConsent(page);

            // Wait for login form with retry logic
            const formFound = await this.waitForLoginForm(page);
            if (!formFound) {
                // Take screenshot for debugging
                try {
                    await page.screenshot({ path: 'login-debug.png', fullPage: true });
                    log("Login form not found. Screenshot saved to login-debug.png", "scraper");
                } catch (e) {
                    // Ignore screenshot errors
                }
                throw new Error("Could not find login form after handling cookie consent");
            }
            
            // Find username input using multiple selectors
            let usernameInput = await page.$('input[name="username"]') as ElementHandle<HTMLInputElement> | null;
            if (!usernameInput) {
                usernameInput = await page.$('input[aria-label*="username" i]') as ElementHandle<HTMLInputElement> | null;
            }
            if (!usernameInput) {
                usernameInput = await page.$('input[aria-label*="phone" i]') as ElementHandle<HTMLInputElement> | null;
            }
            if (!usernameInput) {
                throw new Error("Could not find username input field");
            }

            // Find password input
            let passwordInput = await page.$('input[name="password"]') as ElementHandle<HTMLInputElement> | null;
            if (!passwordInput) {
                passwordInput = await page.$('input[type="password"]') as ElementHandle<HTMLInputElement> | null;
            }
            if (!passwordInput) {
                throw new Error("Could not find password input field");
            }

            // Fill in credentials
            log("Filling in credentials...", "scraper");
            await usernameInput.type(username, { delay: 100 });
            await passwordInput.type(password, { delay: 100 });
            
            // Find and click login button
            let loginButton = await page.$('button[type="submit"]') as ElementHandle<HTMLButtonElement> | null;
            if (!loginButton) {
                // Use XPath or evaluate for text content search
                const buttons = await page.$$('button');
                for (const btn of buttons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text && (text.includes('Log in') || text.includes('Log In'))) {
                        loginButton = btn as ElementHandle<HTMLButtonElement>;
                        break;
                    }
                }
            }
            if (!loginButton) {
                throw new Error("Could not find login button");
            }

            log("Clicking login button...", "scraper");
            await loginButton.click();
            
            // Wait for navigation after login
            try {
                await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 });
            } catch (e) {
                // Sometimes navigation doesn't trigger, wait a bit and check URL
                await delay(3000);
            }
            
            // Check if login was successful
            const currentUrl = page.url();
            log(`Current URL after login attempt: ${currentUrl}`, "scraper");
            
            if (currentUrl.includes("/accounts/login") || currentUrl.includes("/challenge")) {
                log("Login failed or challenge required", "scraper");
                await page.close();
                return false;
            }

            // Check for "Save Your Login Info" or "Not Now" buttons
            try {
                const notNowSelectors = [
                    'button:has-text("Not Now")',
                    'button:has-text("Not now")',
                    'button._a9--._a9_1', // Instagram's "Not Now" button class
                ];

                for (const selector of notNowSelectors) {
                    const notNowButton = await page.$(selector);
                    if (notNowButton) {
                        log("Dismissing 'Save Login Info' dialog", "scraper");
                        await notNowButton.click();
                        await delay(1000);
                        break;
                    }
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Login error: ${errorMessage}`, "scraper");
            
            // Take screenshot for debugging
            try {
                await page.screenshot({ path: 'login-error.png', fullPage: true });
                log("Error screenshot saved to login-error.png", "scraper");
            } catch (e) {
                // Ignore screenshot errors
            }
            
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
            const url = page.url();
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
