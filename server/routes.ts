import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
fetchInstagramComments,
  extractPostId,
} from "./instagram";
import { InstagramScraper } from "./scraper/instagram-scraper";
import { setupAuth } from "./auth";
import { log } from "./log";
import { format } from "date-fns";

// Security imports — kept: rate limiting, validation, sanitization
import {
  globalRateLimiter,
  instagramRateLimiter,
  giveawayRateLimiter,
  emailRateLimiter,
  imageRateLimiter,
  validateRequest,
  validateInstagramRequest,
  validateGiveawayRequest,
  validateEmailRequest,
  adminAuthMiddleware,
  generatePurchaseToken,
  redeemPurchaseToken,
  getSecurityStats,
  getClientIP,
} from "./security";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // ============================================
  // GLOBAL MIDDLEWARE
  // ============================================

  // Apply global rate limiting to all /api routes
  app.use("/api", globalRateLimiter);

  // Apply request validation to all /api routes
  app.use("/api", validateRequest);

  // Debug logging for API requests
  app.use("/api/instagram", (req, res, next) => {
    if (req.method === "POST") {
      log(`API Request Body: ${JSON.stringify(req.body)}`, "debug");
    }
    next();
  });

  // ============================================
  // PAYMENT ENDPOINTS
  // ============================================

  // Process payment and generate access token
  // In production, this would integrate with Stripe
  app.post("/api/payment/process", async (req, res) => {
    try {
      const { amount, url } = req.body;
      const ip = getClientIP(req);

      // Validate the payment amount
      if (amount !== 500) { // £5.00 in pence
        return res.status(400).json({ error: "Invalid payment amount" });
      }

      // Validate URL is provided
      if (!url || typeof url !== "string" || !url.includes("instagram.com")) {
        return res.status(400).json({ error: "Valid Instagram URL required" });
      }

      // TODO: In production, integrate with Stripe here
      // For now, simulate successful payment and generate token

      // Generate a one-time use payment token
      const paymentToken = generatePurchaseToken(1); // 1 API call

      console.log(`[Payment] Processed £5.00 payment from ${ip}, token: ${paymentToken}`);

      return res.json({
        success: true,
        paymentToken: paymentToken,
        message: "Payment successful. You can now fetch comments."
      });
    } catch (error) {
      log(`Payment Error: ${error}`, "error");
      return res.status(500).json({
        error: "Payment processing failed. Please try again."
      });
    }
  });

  // ============================================
  // INSTAGRAM ENDPOINTS
  // ============================================

  // URL Validation endpoint (no API cost - just validates format)
  app.post("/api/instagram/validate",
    validateInstagramRequest,
    async (req, res) => {
      try {
        const { url } = req.body;
        const postId = extractPostId(url);

        if (!postId) {
          return res.status(400).json({
            valid: false,
            error: "Could not extract post ID from URL. Use format: instagram.com/p/CODE or instagram.com/reel/CODE"
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
          error: error instanceof Error ? error.message : "Failed to validate URL"
        });
      }
    }
  );

  // Instagram comments endpoint - REQUIRES PAYMENT
  app.post("/api/instagram/comments",
    validateInstagramRequest,
    instagramRateLimiter,
    async (req, res) => {
      try {
        const { url, paymentToken } = req.body;

        const postId = extractPostId(url);
        if (!postId) {
          return res.status(400).json({
            error: "Could not extract post ID from URL"
          });
        }

        // Demo mode removed


        // PAYMENT REQUIRED - must have valid payment token
        if (!paymentToken || typeof paymentToken !== "string") {
          return res.status(402).json({
            error: "Payment required. Please complete payment before fetching comments.",
            paymentRequired: true
          });
        }

        // Verify the payment token
        const ip = getClientIP(req);
        const tokenResult = redeemPurchaseToken(ip, paymentToken);
        if (!tokenResult.success) {
          return res.status(402).json({
            error: tokenResult.error || "Invalid payment token",
            paymentRequired: true
          });
        }

        // Payment successful - now make the API call
        // Pass the full URL so we can extract the username from it
        const result = await fetchInstagramComments(url);

        // Fraud detection
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
          paid: true,
          fraudStats: {
            flagged: entriesWithFraud.filter((e: any) => e.fraudScore > 20).length,
            total: entriesWithFraud.length,
          },
        });
      } catch (error) {
        log(`Instagram Comments API Error: ${error}`, "error");
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to fetch comments"
        });
      }
    }
  );

  // Check if users follow the logged-in Instagram account
  app.post("/api/instagram/check-followers",
    instagramRateLimiter,
    async (req, res) => {
      try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ error: "userIds array is required" });
        }

        // Limit to 20 users per request
        const limitedIds = userIds.slice(0, 20).filter((id: any) => typeof id === "string" && id.length > 0);

        if (limitedIds.length === 0) {
          return res.status(400).json({ error: "No valid user IDs provided" });
        }

        const scraper = new InstagramScraper();
        try {
          const results = await scraper.checkFollowers(limitedIds);
          return res.json({ results });
        } finally {
          await scraper.close();
        }
      } catch (error) {
        log(`Follower Check Error: ${error}`, "error");
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to check follower status"
        });
      }
    }
  );

  // ============================================
  // GIVEAWAY ENDPOINTS
  // ============================================

  // Helper function to validate scheduling times
  function validateMinimumTime(scheduledFor: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000);
    if (scheduledFor < minTime) {
      return {
        valid: false,
        error: `Scheduled time must be at least 15 minutes from now.`
      };
    }

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    if (scheduledFor > maxDate) {
      return {
        valid: false,
        error: `Scheduled time cannot be more than 1 month in advance.`
      };
    }

    return { valid: true };
  }

  // Schedule Giveaway Endpoint
  app.post("/api/giveaways",
    giveawayRateLimiter,
    validateGiveawayRequest,
    async (req, res) => {
      try {
        const { scheduledFor, config, status, userId } = req.body;

        if (!scheduledFor || !config) {
          return res.status(400).send("Missing required fields");
        }

        // Validate email is provided (required for anonymous giveaways)
        if (!config.contactEmail) {
          return res.status(400).json({ error: "Contact email is required" });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(config.contactEmail)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        const scheduledDate = new Date(scheduledFor);
        const timeValidation = validateMinimumTime(scheduledDate);
        if (!timeValidation.valid) {
          return res.status(400).json({ error: timeValidation.error });
        }

        const giveaway = await storage.createGiveaway({
          userId: userId || "anonymous",
          scheduledFor: scheduledDate,
          config,
          status: status || "pending"
        });

        // Send confirmation email
        const contactEmail = config.contactEmail;
        if (contactEmail && (giveaway as any).accessToken) {
          const { sendEmail } = await import("./email");
          const { getScheduleEmailHTML, getScheduleEmailText } = await import("./email-templates");
          const baseUrl = process.env.BASE_URL || req.protocol + "://" + req.get("host");
          const accessLink = `${baseUrl}/schedule/${(giveaway as any).accessToken}`;

          const scheduledDateFormatted = format(scheduledDate, "MMMM do, yyyy 'at' h:mm a");

          await sendEmail({
            to: contactEmail,
            subject: "Your Giveaway Has Been Scheduled! 🎉",
            text: getScheduleEmailText({
              scheduledDate: scheduledDateFormatted,
              accessLink,
              postUrl: config.url,
            }),
            html: getScheduleEmailHTML({
              scheduledDate: scheduledDateFormatted,
              accessLink,
              postUrl: config.url,
            }),
          });
        }

        return res.status(201).json(giveaway);
      } catch (error) {
        log(`Schedule Giveaway Error: ${error}`, "error");
        return res.status(500).json({ error: "Failed to schedule giveaway" });
      }
    }
  );

  // Get user's giveaways (authenticated)
  app.get("/api/giveaways", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json([]);
    }
    const giveaways = await storage.getUserGiveaways((req.user as any).id);
    res.json(giveaways);
  });

  // Get giveaway by access token
  app.get("/api/giveaways/:token", async (req, res) => {
    try {
      const { token } = req.params;

      // Validate token format (UUID)
      if (!token || token.length < 30) {
        return res.status(400).json({ error: "Invalid token format" });
      }

      const giveaway = await storage.getGiveawayByToken(token);

      if (!giveaway) {
        return res.status(404).json({ error: "Giveaway not found" });
      }

      return res.json(giveaway);
    } catch (error) {
      log(`Get Giveaway Error: ${error}`, "error");
      return res.status(500).json({ error: "Failed to fetch giveaway" });
    }
  });

  // Update giveaway by access token
  app.put("/api/giveaways/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { scheduledFor, config, status } = req.body;

      const giveaway = await storage.getGiveawayByToken(token);
      if (!giveaway) {
        return res.status(404).json({ error: "Giveaway not found" });
      }

      // Check lock window
      const now = new Date();
      const scheduledTime = new Date(giveaway.scheduledFor);
      const timeUntilScheduled = scheduledTime.getTime() - now.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeUntilScheduled < fifteenMinutes) {
        return res.status(403).json({
          error: "Giveaway cannot be edited. Less than 15 minutes remaining."
        });
      }

      if (scheduledFor) {
        const newScheduledDate = new Date(scheduledFor);
        const timeValidation = validateMinimumTime(newScheduledDate);
        if (!timeValidation.valid) {
          return res.status(400).json({ error: timeValidation.error });
        }
      }

      const updates: any = {};
      if (scheduledFor) updates.scheduledFor = new Date(scheduledFor);
      if (config) updates.config = config;
      if (status) updates.status = status;

      const updated = await storage.updateGiveaway(giveaway.id, updates);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update giveaway" });
      }

      return res.json(updated);
    } catch (error) {
      log(`Update Giveaway Error: ${error}`, "error");
      return res.status(500).json({ error: "Failed to update giveaway" });
    }
  });

  // Delete giveaway by access token
  app.delete("/api/giveaways/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const giveaway = await storage.getGiveawayByToken(token);
      if (!giveaway) {
        return res.status(404).json({ error: "Giveaway not found" });
      }

      const now = new Date();
      const scheduledTime = new Date(giveaway.scheduledFor);
      const timeUntilScheduled = scheduledTime.getTime() - now.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeUntilScheduled < fifteenMinutes) {
        return res.status(403).json({
          error: "Giveaway cannot be cancelled. Less than 15 minutes remaining."
        });
      }

      const deleted = await storage.deleteGiveaway(giveaway.id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete giveaway" });
      }

      return res.json({ success: true, message: "Giveaway cancelled successfully" });
    } catch (error) {
      log(`Delete Giveaway Error: ${error}`, "error");
      return res.status(500).json({ error: "Failed to delete giveaway" });
    }
  });

  // ============================================
  // IMAGE & EMAIL ENDPOINTS - PROTECTED
  // ============================================



  // ============================================
  // ANALYTICS - ADMIN ONLY
  // ============================================

  app.get("/api/analytics",
    adminAuthMiddleware,
    async (req, res) => {
      try {
        const allGiveaways = await storage.getAllGiveaways();

        const stats = {
          totalGiveaways: allGiveaways.length,
          completedGiveaways: allGiveaways.filter((g: any) => g.status === 'completed').length,
          pendingGiveaways: allGiveaways.filter((g: any) => g.status === 'pending').length,
          totalWinners: allGiveaways.reduce((sum: number, g: any) => {
            return sum + (g.winners ? (Array.isArray(g.winners) ? g.winners.length : 0) : 0);
          }, 0),
          security: getSecurityStats()
        };

        return res.json(stats);
      } catch (error) {
        log(`Analytics Error: ${error}`, "error");
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to fetch analytics"
        });
      }
    }
  );

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // Generate purchase tokens (admin only)
  app.post("/api/admin/generate-token",
    adminAuthMiddleware,
    (req, res) => {
      const { credits } = req.body;
      const token = generatePurchaseToken(credits || 10);
      return res.json({ token, credits: credits || 10 });
    }
  );

  // View security stats (admin only)
  app.get("/api/admin/security",
    adminAuthMiddleware,
    (req, res) => {
      return res.json(getSecurityStats());
    }
  );

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  app.get("/api/check-username", async (req, res) => {
    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Invalid username" });
    }
    const user = await storage.getUserByUsername(username);
    res.json({ available: !user });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      security: "enabled"
    });
  });

  // ============================================
  // SEO ENDPOINTS
  // ============================================

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /schedule/
Disallow: /analytics

Sitemap: https://giveaway-engine.com/sitemap.xml
`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const baseUrl = "https://giveaway-engine.com";
    const currentDate = new Date().toISOString().split("T")[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/tool</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    res.type("application/xml");
    res.send(sitemap);
  });

  return httpServer;
}
