import type { Express } from "express";
import { log } from "../log";
import { countMentions, getScraperInstance } from "../instagram";

interface InstagramRouteDeps {
  validateInstagramRequest: any;
  instagramRateLimiter: any;
  fetchInstagramComments: (url: string) => Promise<any>;
  extractPostId: (url: string) => string | null;
  redeemPurchaseToken: (ip: string, token: string) => { success: boolean; error?: string };
  consumeCredit: (ip: string) => boolean;
  getClientIP: (req: any) => string;
}

export function registerInstagramRoutes(app: Express, deps: InstagramRouteDeps): void {
  const {
    validateInstagramRequest,
    instagramRateLimiter,
    fetchInstagramComments,
    extractPostId,
    redeemPurchaseToken,
    consumeCredit,
    getClientIP,
  } = deps;

  app.post("/api/instagram/validate",
    validateInstagramRequest,
    async (req, res) => {
      try {
        const { url } = req.body;
        const postId = extractPostId(url);

        if (!postId) {
          return res.status(400).json({
            valid: false,
            error: "Could not extract post ID from URL. Use format: instagram.com/p/CODE or instagram.com/reel/CODE",
          });
        }

        return res.json({
          valid: true,
          postId,
          url,
        });
      } catch (error) {
        log(`Validation Error: ${error}`, "error");
        return res.status(500).json({
          valid: false,
          error: error instanceof Error ? error.message : "Failed to validate URL",
        });
      }
    },
  );

  app.post("/api/instagram/comments",
    validateInstagramRequest,
    instagramRateLimiter,
    async (req, res) => {
      try {
        const { url, paymentToken } = req.body;

        const postId = extractPostId(url);
        if (!postId) {
          return res.status(400).json({
            error: "Could not extract post ID from URL",
          });
        }

        // Comment scraping is available before payment.
        // Payment is enforced later when user confirms pick/schedule.

        const result = await fetchInstagramComments(url);

        const usernameCounts = new Map<string, number>();
        result.comments.forEach((c: any) => {
          usernameCounts.set(c.username, (usernameCounts.get(c.username) || 0) + 1);
        });

        const entriesWithFraud = result.comments.map((c: any) => {
          let fraudScore = 0;
          const usernameCount = usernameCounts.get(c.username) || 0;

          if (usernameCount > 1) fraudScore += usernameCount * 10;
          if (c.text && c.text.length < 5) fraudScore += 5;
          if (c.text && /^[\p{Emoji}\s]+$/u.test(c.text)) fraudScore += 3;

          return {
            id: c.id,
            username: c.username,
            avatar: c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`,
            comment: c.text,
            mentionCount: countMentions(c.text),
            platform: "instagram" as const,
            timestamp: c.timestamp,
            fraudScore: Math.min(fraudScore, 100),
            userId: c.userId,
          };
        });

        return res.json({
          entries: entriesWithFraud,
          total: result.total,
          postInfo: result.postInfo,
          demo: false,
          paid: false,
          fraudStats: {
            flagged: entriesWithFraud.filter((e: any) => e.fraudScore > 20).length,
            total: entriesWithFraud.length,
          },
        });
      } catch (error) {
        log(`Instagram Comments API Error: ${error}`, "error");
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to fetch comments",
        });
      }
    },
  );

  app.post("/api/instagram/check-followers",
    instagramRateLimiter,
    async (req, res) => {
      try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ error: "userIds array is required" });
        }

        const limitedIds = userIds.slice(0, 20).filter((id: any) => typeof id === "string" && id.length > 0);

        if (limitedIds.length === 0) {
          return res.status(400).json({ error: "No valid user IDs provided" });
        }

        // Reuse singleton scraper instance (persistent browser)
        const scraper = getScraperInstance();
        const results = await scraper.checkFollowers(limitedIds);
        return res.json({ results });
      } catch (error) {
        log(`Follower Check Error: ${error}`, "error");
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to check follower status",
        });
      }
    },
  );
}
