/**
 * Local Scraper Worker
 * 
 * Run this on your local computer to connect to the Render-hosted website.
 * When someone requests Instagram comments on the website, this worker
 * runs the Puppeteer scraper locally and sends results back.
 * 
 * Usage:
 *   npm run scraper:worker
 * 
 * Environment variables (from .env):
 *   SCRAPER_RELAY_SECRET  - Must match the server's secret
 *   SCRAPER_SERVER_URL    - WebSocket URL (default: wss://pickusawinner.com)
 *   INSTAGRAM_USERNAME    - Instagram login
 *   INSTAGRAM_PASSWORD    - Instagram password
 */

import "dotenv/config";
import WebSocket from "ws";
import { InstagramScraper } from "../server/scraper/instagram-scraper";

const RELAY_SECRET = process.env.SCRAPER_RELAY_SECRET || "";
const SERVER_URL = process.env.SCRAPER_SERVER_URL || "wss://pickusawinner.com";
const RECONNECT_DELAY_MS = 5000;

if (!RELAY_SECRET) {
    console.error("❌ SCRAPER_RELAY_SECRET is not set in .env");
    console.error("   Add: SCRAPER_RELAY_SECRET=your_secret_here");
    process.exit(1);
}

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isShuttingDown = false;

function connect() {
    const wsUrl = `${SERVER_URL}/ws/scraper?secret=${encodeURIComponent(RELAY_SECRET)}`;
    console.log(`🔌 Connecting to ${SERVER_URL}/ws/scraper ...`);

    ws = new WebSocket(wsUrl);

    ws.on("open", () => {
        console.log("✅ Connected to server! Waiting for scrape requests...\n");
    });

    ws.on("message", async (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message.type === "connected") {
                console.log(`📡 Server says: ${message.message}`);
                return;
            }

            if (message.type === "heartbeat_ack") {
                return;
            }

            if (message.type === "scrape_request") {
                await handleScrapeRequest(message);
            }
        } catch (e) {
            console.error("Failed to handle message:", e);
        }
    });

    ws.on("close", (code, reason) => {
        console.log(`\n🔌 Disconnected from server (code: ${code}, reason: ${reason})`);
        ws = null;
        scheduleReconnect();
    });

    ws.on("error", (err) => {
        console.error(`❌ WebSocket error: ${err.message}`);
        // close event will fire after this, which triggers reconnect
    });
}

function scheduleReconnect() {
    if (isShuttingDown) return;
    if (reconnectTimer) return;

    console.log(`⏳ Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, RECONNECT_DELAY_MS);
}

async function handleScrapeRequest(message: { requestId: string; postUrl: string }) {
    const { requestId, postUrl } = message;
    console.log(`\n🔍 Scrape request received: ${requestId}`);
    console.log(`   URL: ${postUrl}`);
    console.log(`   Starting scraper...`);

    const startTime = Date.now();

    try {
        const scraper = new InstagramScraper();
        const result = await scraper.fetchComments(postUrl);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Scraped ${result.comments.length} comments in ${duration}s`);

        sendResult(requestId, result, null);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`❌ Scrape failed after ${duration}s: ${errorMessage}`);

        sendResult(requestId, null, errorMessage);
    }
}

function sendResult(requestId: string, result: any, error: string | null) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("Cannot send result — not connected");
        return;
    }

    ws.send(JSON.stringify({
        type: "scrape_result",
        requestId,
        result,
        error,
    }));
}

// Heartbeat every 30s to keep connection alive
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "heartbeat" }));
    }
}, 30000);

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n👋 Shutting down worker...");
    isShuttingDown = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close(1000, "Worker shutting down");
    process.exit(0);
});

// Start
console.log("═══════════════════════════════════════════════");
console.log("  🚀 Instagram Scraper Worker");
console.log("═══════════════════════════════════════════════");
console.log(`  Server: ${SERVER_URL}`);
console.log(`  Secret: ${RELAY_SECRET.substring(0, 4)}${"*".repeat(Math.max(0, RELAY_SECRET.length - 4))}`);
console.log("═══════════════════════════════════════════════\n");

connect();
