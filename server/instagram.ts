import { log } from "./log";
import { ApifyClient } from 'apify-client';
import { InstagramScraper } from "./scraper/instagram-scraper";
import { z } from "zod";

export interface InstagramComment {
    id: string;
    username: string;
    text: string;
    timestamp: string;
    likes: number;
    avatar?: string;
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

// API Configuration
if (!process.env.APIFY_TOKEN) {
    console.warn("APIFY_TOKEN is not set in environment variables. Live data fetching will fail.");
}

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || "",
});

const InstagramCommentSchema = z.object({
    id: z.string(),
    ownerUsername: z.string().optional(),
    user: z.object({ username: z.string().optional(), profile_pic_url: z.string().optional() }).optional(),
    text: z.string().optional(),
    timestamp: z.string().optional(),
    likesCount: z.number().optional(),
    ownerProfilePicUrl: z.string().optional(),
    userProfilePicUrl: z.string().optional(),
});

const ApifyResponseSchema = z.object({
    items: z.array(InstagramCommentSchema),
});

/**
 * Extract Instagram post ID from various URL formats
 */
export function extractPostId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const patterns = [
            /\/p\/([A-Za-z0-9_-]+)/,
            /\/reel\/([A-Za-z0-9_-]+)/,
            /\/tv\/([A-Za-z0-9_-]+)/,
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
 * Prioritizes custom scraper when credentials are available, otherwise falls back to Apify
 */
export async function fetchInstagramComments(
    postCode: string
): Promise<FetchCommentsResult> {
    const useCustomScraper = process.env.USE_CUSTOM_SCRAPER === "true";
    const useApify = process.env.USE_APIFY === "true";
    const hasCredentials = process.env.INSTAGRAM_USERNAME && process.env.INSTAGRAM_PASSWORD;
    const postUrl = postCode.startsWith("http") ? postCode : `https://www.instagram.com/p/${postCode}/`;

    // Explicit override: Use custom scraper if USE_CUSTOM_SCRAPER=true
    if (useCustomScraper) {
        log(`Using custom scraper for post: ${postCode} (explicit override)`, "instagram");
        return await fetchWithCustomScraper(postUrl);
    }

    // Explicit override: Use Apify if USE_APIFY=true
    if (useApify && process.env.APIFY_TOKEN) {
        try {
            log(`Using Apify for post: ${postCode} (explicit override)`, "instagram");
            const result = await fetchWithApify(postCode, postUrl);
            
            // If Apify only returned 15 comments (free tier limit), fallback to custom scraper if credentials exist
            if (result.comments.length <= 15 && hasCredentials) {
                log(`Apify returned only ${result.comments.length} comments (free tier limit). Falling back to custom scraper.`, "instagram");
                return await fetchWithCustomScraper(postUrl);
            }
            
            return result;
        } catch (error) {
            log(`Apify failed: ${error}. Falling back to custom scraper.`, "instagram");
            if (hasCredentials) {
                return await fetchWithCustomScraper(postUrl);
            }
            throw error;
        }
    }

    // Default: If credentials exist, use custom scraper (prioritized)
    if (hasCredentials) {
        log(`Using custom scraper for post: ${postCode} (credentials available)`, "instagram");
        log(`Credentials check: INSTAGRAM_USERNAME=${process.env.INSTAGRAM_USERNAME ? 'SET' : 'NOT SET'}, INSTAGRAM_PASSWORD=${process.env.INSTAGRAM_PASSWORD ? 'SET' : 'NOT SET'}`, "instagram");
        try {
            return await fetchWithCustomScraper(postUrl);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Custom scraper failed: ${errorMessage}. Falling back to Apify.`, "error");
            // Fallback to Apify if custom scraper fails
            if (process.env.APIFY_TOKEN) {
                log("Attempting fallback to Apify...", "instagram");
                return await fetchWithApify(postCode, postUrl);
            }
            throw error;
        }
    } else {
        log(`No credentials found. INSTAGRAM_USERNAME=${process.env.INSTAGRAM_USERNAME ? 'SET' : 'NOT SET'}, INSTAGRAM_PASSWORD=${process.env.INSTAGRAM_PASSWORD ? 'SET' : 'NOT SET'}`, "instagram");
    }

    // No credentials: Try Apify if token is available
    if (process.env.APIFY_TOKEN) {
        log(`Using Apify for post: ${postCode} (no credentials available)`, "instagram");
        return await fetchWithApify(postCode, postUrl);
    }

    throw new Error("Neither APIFY_TOKEN nor INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD are configured");
}

/**
 * Fetch comments using Apify
 */
async function fetchWithApify(
    postCode: string,
    postUrl: string
): Promise<FetchCommentsResult> {
    // Configure Apify to fetch ALL comments
    // Actor: apify/instagram-scraper (shu8hvrXbJbY3Eb9W)
    // IMPORTANT: Free tier Apify has limited compute units
    // If you're only getting ~15 comments, you may need to:
    // 1. Upgrade your Apify plan for more compute units
    // 2. Check if the post actually has more comments
    const input = {
        "directUrls": [postUrl],
        "resultsType": "comments",
        "resultsLimit": 0, // 0 = unlimited (get all available)
        "searchType": "hashtag",
        "searchLimit": 1,
        "addParentData": true,
        // Key parameters for getting more comments:
        "maxItems": 0, // 0 = no limit, get all items
        "maxRequestsPerCrawl": 1000, // Allow many pagination requests
        "maxConcurrency": 5,
        "proxyConfiguration": {
            "useApifyProxy": true,
        },
    };

    log(`Starting Apify run with config: resultsLimit=${input.resultsLimit}, maxItems=${input.maxItems}`, "instagram");
    
    // Try the alternative Instagram Comment Scraper actor
    // Actor ID: apify/instagram-comment-scraper OR the original one
    // Note: The original actor (shu8hvrXbJbY3Eb9W) limits FREE users to 15 comments
    // You need a PAID Apify subscription to get more comments
    const actorId = process.env.APIFY_INSTAGRAM_ACTOR || "shu8hvrXbJbY3Eb9W";
    
    const run = await client.actor(actorId).call(input);
    
    log(`Apify run completed. Run ID: ${run.id}, Status: ${run.status}, Actor: ${actorId}`, "instagram");
    
    const { items: rawItems } = await client.dataset(run.defaultDatasetId).listItems();
    
    log(`Raw items from Apify dataset: ${rawItems.length}`, "instagram");
    
    // Validate with Zod
    const items = rawItems.map((item: any) => {
        const parsed = InstagramCommentSchema.safeParse(item);
        if (!parsed.success) {
            log(`Invalid item from Apify: ${JSON.stringify(parsed.error.format())}`, "instagram");
            return null;
        }
        return parsed.data;
    }).filter(i => i !== null) as z.infer<typeof InstagramCommentSchema>[];

    // IMPORTANT: If you're seeing only 15 comments, you need to upgrade your Apify subscription
    if (items.length <= 15) {
        log(`⚠️ Only ${items.length} items returned. Free tier limit is 15 comments. Upgrade Apify for more.`, "instagram");
    }

    // Transform Apify items into InstagramComment format
    // Debug: Log first few items to understand structure
    if (items.length > 0) {
        log(`Sample item keys: ${Object.keys(items[0]).join(', ')}`, "instagram");
    }
    
    const comments: InstagramComment[] = items
        .map((item): InstagramComment | null => {
            const username = item.ownerUsername || item.user?.username;
            // Only skip if BOTH username and text are missing
            if (!username && !item.text) return null;

            return {
                id: item.id || String(Math.random()),
                username: username || "unknown",
                text: item.text || "",
                timestamp: item.timestamp || new Date().toISOString(),
                likes: item.likesCount || 0,
                avatar: item.ownerProfilePicUrl || item.userProfilePicUrl || item.user?.profile_pic_url,
            };
        })
        .filter((c): c is InstagramComment => c !== null && c.username !== "unknown");

    log(`Fetched ${comments.length} valid comments via Apify (from ${items.length} raw items)`, "instagram");
    
    // If we got significantly fewer comments than expected, log a warning
    if (items.length > 0 && comments.length < items.length * 0.5) {
        log(`Warning: Many items filtered out. Check if Apify returned metadata instead of comments.`, "instagram");
    }

    // Try to get post info from the first item if available (parent data)
    const firstItem = items[0] as any;

    return {
        comments,
        total: comments.length,
        postInfo: firstItem ? {
            id: postCode,
            caption: firstItem.caption,
            likeCount: firstItem.likesCount,
            commentCount: firstItem.commentsCount
        } : undefined,
    };
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
        throw error; // Re-throw so the fallback logic can catch it
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

/**
 * Generate mock comments for testing/demo
 */
export function generateMockComments(count: number = 150): InstagramComment[] {
    const users = [
        "skater_boi_99", "sarah_crafts", "tech_guru_x", "dance_queen", "crypto_king",
        "coffee_lover", "pixel_art", "music_vibes", "travel_bug", "fitness_freak",
        "foodie_life", "gamer_girl", "dev_dude", "artist_anna", "photo_phil",
        "nature_nate", "book_worm", "yoga_yara", "chef_charlie", "run_riley"
    ];

    const comments: InstagramComment[] = [];

    for (let i = 0; i < count; i++) {
        const username = users[Math.floor(Math.random() * users.length)];
        const mentionsCount = Math.floor(Math.random() * 4);
        const hasHashtag = Math.random() > 0.5;

        let text = "Love this giveaway! ";
        if (hasHashtag) text += "#giveaway #win ";
        for (let m = 0; m < mentionsCount; m++) {
            text += `@friend${m + 1} `;
        }

        comments.push({
            id: `mock-${i}`,
            username,
            text: text.trim(),
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
            likes: Math.floor(Math.random() * 50),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        });
    }

    return comments;
}
