import { log } from "./log";
import { InstagramScraper } from "./scraper/instagram-scraper";
import { scraperRelay } from "./scraper-relay";

export interface InstagramComment {
    id: string;
    username: string;
    text: string;
    timestamp: string;
    likes: number;
    avatar?: string;
    userId?: string;
    mentionCount?: number;
}

export interface FetchCommentsResult {
    comments: InstagramComment[];
    total: number;
    postInfo?: {
        id: string;
        caption?: string;
        likeCount?: number;
        commentCount?: number;
    };
}

/**
 * Count valid @username mentions in comment text.
 * Instagram usernames allow letters, numbers, underscore, and period.
 */
export function countMentions(text: string | undefined | null): number {
    if (!text) return 0;
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    return (text.match(mentionRegex) || []).length;
}

/**
 * Extract Instagram post ID from various URL formats
 */
export function extractPostId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const patterns = [
            /\/p\/([A-Za-z0-9_-]+)/, // Post
            /\/reel\/([A-Za-z0-9_-]+)/, // Reel
            /\/tv\/([A-Za-z0-9_-]+)/, // IGTV
        ];

        for (const pattern of patterns) {
            const match = urlObj.pathname.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Fetch comments from an Instagram post
 * Prioritizes WebSocket relay, falls back to custom Puppeteer scraper
 */
export async function fetchInstagramComments(
    postCode: string
): Promise<FetchCommentsResult> {
    const useCustomScraper = process.env.USE_CUSTOM_SCRAPER === "true";
    const hasCredentials = !!(process.env.INSTAGRAM_USERNAME?.trim() && process.env.INSTAGRAM_PASSWORD?.trim());
    const workerConnected = scraperRelay.isWorkerConnected();

    const postUrl = postCode.startsWith("http") ? postCode : `https://www.instagram.com/p/${postCode}/`;

    log(`Strategies available: Relay=${workerConnected}, Credentials=${hasCredentials}`, "instagram");

    // Strategy 1: WebSocket Relay to local worker (HIGHEST PRIORITY)
    if (workerConnected) {
        log(`Using relay to local worker for post: ${postCode}`, "instagram");
        try {
            return await scraperRelay.scrape(postUrl);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Relay scrape failed: ${errorMessage}`, "error");
            // Fall through to other strategies
        }
    }

    // Strategy 2: Custom Scraper (local Puppeteer, only works if Chrome is available)
    if (useCustomScraper || hasCredentials) {
        log(`Using custom scraper for post: ${postCode} (Strategy: ${useCustomScraper ? 'Explicit' : 'Credentials'})`, "instagram");

        if (!hasCredentials) {
            throw new Error("Custom scraper requires INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD to be set in environment variables.");
        }

        return await fetchWithCustomScraper(postUrl);
    }

    // No strategies available
    throw new Error(
        "No scraper available. Start the local worker (npm run scraper:worker) or set Instagram credentials."
    );
}

/**
 * Fetch comments using custom Puppeteer scraper
 */
async function fetchWithCustomScraper(postUrl: string): Promise<FetchCommentsResult> {
    if (!InstagramScraper) {
        throw new Error("Custom scraper not available. Puppeteer may not be installed.");
    }

    let scraper: any = null;
    try {
        log("Initializing custom scraper...", "instagram");
        scraper = new InstagramScraper();
        log("Custom scraper initialized, fetching comments...", "instagram");
        const result = await scraper.fetchComments(postUrl);
        log(`Custom scraper successfully fetched ${result.comments.length} comments`, "instagram");
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        log(`Custom scraper error: ${errorMessage}`, "error");
        if (errorStack) {
            log(`Custom scraper stack: ${errorStack}`, "error");
        }
        throw error;
    } finally {
        if (scraper) {
            try {
                await scraper.close();
            } catch (closeError) {
                log(`Error closing scraper: ${closeError}`, "error");
            }
        }
    }
}
