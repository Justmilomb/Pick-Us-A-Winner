
import { storage } from "./storage";
import { fetchInstagramComments, extractPostId } from "./instagram";
import { sendEmail } from "./email";
import { getResultsEmailHTML, getResultsEmailText } from "./email-templates";

async function processGiveaway(giveaway: any) {
    console.log(`[Scheduler] Processing giveaway ${giveaway.id}...`);
    try {
        const config = giveaway.config;

        // Only support comments mode
        if (config.mode !== 'comments') {
            throw new Error(`Unsupported mode: ${config.mode}. Only 'comments' mode is supported.`);
        }

        // 1. Fetch Comments
        const postCode = extractPostId(config.url);
        if (!postCode) {
            throw new Error("Invalid post URL in giveaway config");
        }
        const res = await fetchInstagramComments(postCode);
        const pool = res.comments;

        // 2. Filter logic (Replicated from frontend)
        let filtered = [...pool];
        const seenUsers = new Set();
        const validCandidates = [];

        // Parse block list
        const blockedUsernames = new Set(
            (config.blockList || '')
                .split('\n')
                .map((line: string) => line.trim().toLowerCase().replace(/^@/, ''))
                .filter((username: string) => username.length > 0)
        );

        for (const entry of filtered) {
            // Block List Filter (first)
            if (blockedUsernames.has(entry.username.toLowerCase())) {
                continue;
            }

            // Keyword Filter
            if (config.keyword) {
                if (!entry.text || !entry.text.toLowerCase().includes(config.keyword.toLowerCase())) {
                    continue;
                }
            }

            // Mentions Filter
            if (config.minMentions > 0) {
                const mentionCount = (entry.text?.match(/@/g) || []).length;
                if (mentionCount < config.minMentions) {
                    continue;
                }
            }

            // Duplicate Filter
            if (config.duplicateCheck) {
                if (seenUsers.has(entry.username)) {
                    continue;
                }
                seenUsers.add(entry.username);
            }

            validCandidates.push(entry);
        }

        // 3. Pick Winners
        const winnerCount = Math.min(config.winnerCount || 1, validCandidates.length);
        let winners: any[] = [];
        
        if (config.bonusChances) {
            // Weighted selection based on mention count
            const weightedPool: any[] = [];
            validCandidates.forEach((entry: any) => {
                const mentionCount = (entry.text?.match(/@/g) || []).length;
                // Base entry + 1 extra entry per mention beyond the minimum
                const entries = 1 + Math.max(0, mentionCount - (config.minMentions || 0));
                for (let i = 0; i < entries; i++) {
                    weightedPool.push(entry);
                }
            });
            
            // Shuffle and pick unique winners
            const shuffled = [...weightedPool].sort(() => 0.5 - Math.random());
            const seen = new Set<string>();
            for (const entry of shuffled) {
                if (!seen.has(entry.username) && winners.length < winnerCount) {
                    seen.add(entry.username);
                    winners.push(entry);
                }
            }
        } else {
            // Regular random selection
            const shuffled = [...validCandidates].sort(() => 0.5 - Math.random());
            winners = shuffled.slice(0, winnerCount);
        }

        // 4. Update DB
        await storage.updateGiveawayStatus(giveaway.id, 'completed', winners);

        // 5. Email User
        const user = giveaway.userId !== 'anonymous' ? await storage.getUser(giveaway.userId) : null;
        const targetEmail = user?.email || giveaway.config?.contactEmail;

        if (targetEmail) {
            await sendEmail({
                to: targetEmail,
                subject: "🏆 Your Giveaway Results Are Ready!",
                text: getResultsEmailText({
                    winners: winners.map((w: any) => ({
                        username: w.username,
                        comment: w.comment,
                    })),
                    totalEntries: validCandidates.length,
                    postUrl: config.url,
                }),
                html: getResultsEmailHTML({
                    winners: winners.map((w: any) => ({
                        username: w.username,
                        comment: w.comment,
                    })),
                    totalEntries: validCandidates.length,
                    postUrl: config.url,
                }),
            });
        }

        console.log(`[Scheduler] Giveaway ${giveaway.id} completed. Winners: ${winners.length}`);

    } catch (error) {
        console.error(`[Scheduler] Giveaway ${giveaway.id} failed:`, error);
        await storage.updateGiveawayStatus(giveaway.id, 'failed');
    }
}

export function startScheduler() {
    console.log("[Scheduler] Starting polling service...");
    setInterval(async () => {
        try {
            const pending = await storage.getPendingGiveaways();
            if (pending.length > 0) {
                console.log(`[Scheduler] Found ${pending.length} pending giveaways.`);
                for (const g of pending) {
                    await processGiveaway(g);
                }
            }
        } catch (e) {
            console.error("[Scheduler] Error in poll loop:", e);
        }
    }, 60 * 1000); // Poll every minute
}
