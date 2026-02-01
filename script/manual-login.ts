/**
 * Manual Instagram Login Script
 * 
 * This script launches a visible browser window where you can log in to Instagram manually.
 * Once you're logged in, press Enter in the terminal to save the session cookies.
 * The scraper will then use these saved cookies for future requests.
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

puppeteer.use(StealthPlugin());

const SESSION_FILE = path.join(process.cwd(), ".instagram-session.json");

async function waitForEnter(message: string): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

async function manualLogin() {
    console.log("🚀 Launching browser for manual Instagram login...\n");
    
    const browser = await puppeteer.launch({
        headless: false, // VISIBLE browser
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--window-size=1366,768",
        ],
        defaultViewport: { width: 1366, height: 768 },
    });

    const page = await browser.newPage();
    
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("📱 Navigating to Instagram...\n");
    await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
    });

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    MANUAL LOGIN REQUIRED");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");
    console.log("  1. Log in to Instagram in the browser window that just opened");
    console.log("  2. Complete any verification challenges if prompted");
    console.log("  3. Once you see your Instagram feed, come back here");
    console.log("  4. Press ENTER to save your session");
    console.log("");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");

    await waitForEnter("Press ENTER after you're logged in to Instagram... ");

    // Verify we're logged in by checking the URL
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes("/accounts/login")) {
        console.log("\n❌ It looks like you're still on the login page.");
        console.log("   Please log in first, then run this script again.");
        await browser.close();
        process.exit(1);
    }

    // Get all cookies
    const cookies = await page.cookies();
    console.log(`\n🍪 Found ${cookies.length} cookies`);

    // Save session
    const session = {
        cookies,
        username: process.env.INSTAGRAM_USERNAME || "manual_login",
        savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
    console.log(`\n✅ Session saved to ${SESSION_FILE}`);
    
    console.log("\n🎉 Success! The scraper will now use your saved session.");
    console.log("   You can close this window and restart your server.\n");

    await browser.close();
    process.exit(0);
}

manualLogin().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
