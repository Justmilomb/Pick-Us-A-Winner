import { log } from "./log";
import { ApifyClient } from 'apify-client';

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
 * Fetch comments from an Instagram post using Apify
 */
export async function fetchInstagramComments(
    postCode: string
): Promise<FetchCommentsResult> {
    log(`Fetching comments for post: ${postCode} via Apify`, "instagram");

    try {
        const postUrl = postCode.startsWith("http") ? postCode : `https://www.instagram.com/p/${postCode}/`;

        const input = {
            "directUrls": [postUrl],
            "resultsType": "comments",
            "resultsLimit": 5000,
            "searchType": "hashtag",
            "searchLimit": 1,
            "addParentData": true
        };

        const run = await client.actor("shu8hvrXbJbY3Eb9W").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Transform Apify items into InstagramComment format
        const comments: InstagramComment[] = items
            .map((item: any) => {
                const username = item.ownerUsername || item.user?.username;
                if (!username && !item.text) return null; // Skip metadata items or empty items

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

        log(`Fetched ${comments.length} valid comments via Apify`, "instagram");

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
    } catch (error) {
        log(`Apify Comments Error: ${error}`, "error");
        throw new Error(error instanceof Error ? error.message : "Failed to fetch comments via Apify");
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
