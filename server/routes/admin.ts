import type { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";

interface AdminRouteDeps {
  adminAuthMiddleware: any;
  generatePurchaseToken: (credits?: number) => string;
  getSecurityStats: () => unknown;
}

export function registerAdminRoutes(app: Express, deps: AdminRouteDeps): void {
  const { adminAuthMiddleware, generatePurchaseToken, getSecurityStats } = deps;

  app.get("/api/analytics",
    adminAuthMiddleware,
    async (_req, res) => {
      try {
        const allGiveaways = await storage.getAllGiveaways();

        const stats = {
          totalGiveaways: allGiveaways.length,
          completedGiveaways: allGiveaways.filter((g: any) => g.status === "completed").length,
          pendingGiveaways: allGiveaways.filter((g: any) => g.status === "pending").length,
          totalWinners: allGiveaways.reduce((sum: number, g: any) => {
            return sum + (g.winners ? (Array.isArray(g.winners) ? g.winners.length : 0) : 0);
          }, 0),
          security: getSecurityStats(),
        };

        return res.json(stats);
      } catch (error) {
        log(`Analytics Error: ${error}`, "error");
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to fetch analytics",
        });
      }
    },
  );

  app.post("/api/admin/generate-token",
    adminAuthMiddleware,
    (req, res) => {
      const parsedCredits = Number.parseInt(String(req.body?.credits ?? "10"), 10);
      const credits = Number.isFinite(parsedCredits) ? parsedCredits : 10;
      if (credits < 1 || credits > 100) {
        return res.status(400).json({ error: "credits must be an integer between 1 and 100" });
      }

      const token = generatePurchaseToken(credits);
      return res.json({ token, credits });
    },
  );

  app.get("/api/admin/security",
    adminAuthMiddleware,
    (_req, res) => {
      return res.json(getSecurityStats());
    },
  );

  app.get("/api/admin/email/health",
    adminAuthMiddleware,
    async (_req, res) => {
      try {
        const { checkEmailHealth } = await import("../email");
        const health = await checkEmailHealth();
        const status = health.configured && health.verified ? 200 : 503;
        return res.status(status).json(health);
      } catch (error) {
        log(`Email Health Check Error: ${error}`, "error");
        return res.status(500).json({
          configured: false,
          verified: false,
          error: error instanceof Error ? error.message : "Failed to check email health",
        });
      }
    },
  );
}
