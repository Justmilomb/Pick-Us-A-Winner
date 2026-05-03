import type { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";

interface AdRouteDeps {
  adminAuthMiddleware: any;
}

export function registerAdRoutes(app: Express, deps: AdRouteDeps): void {
  const { adminAuthMiddleware } = deps;

  app.get("/api/ads/random", async (_req, res) => {
    try {
      const ads = await storage.getActiveAds();
      if (ads.length === 0) {
        return res.json({ ad: null });
      }

      const randomAd = ads[Math.floor(Math.random() * ads.length)];
      storage.incrementAdStats(randomAd.id, "view").catch((err) =>
        console.error("Failed to increment ad view:", err),
      );

      return res.json({ ad: randomAd });
    } catch (error) {
      log(`Get Random Ad Error: ${error}`, "error");
      return res.status(500).json({
        error: "Failed to load ad",
      });
    }
  });

  app.post("/api/ads/:id/click", async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.getAd(id);
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }

      await storage.incrementAdStats(id, "click");
      return res.json({ success: true });
    } catch (error) {
      log(`Track Ad Click Error: ${error}`, "error");
      return res.status(500).json({
        error: "Failed to track click",
      });
    }
  });

  app.get("/api/admin/ads",
    adminAuthMiddleware,
    async (_req, res) => {
      try {
        const ads = await storage.getAllAds();
        return res.json(ads);
      } catch (error) {
        log(`Get All Ads Error: ${error}`, "error");
        return res.status(500).json({
          error: "Failed to fetch ads",
        });
      }
    },
  );

  app.post("/api/admin/ads",
    adminAuthMiddleware,
    async (req, res) => {
      try {
        const { imageUrl, linkUrl } = req.body;
        if (!imageUrl || !linkUrl) {
          return res.status(400).json({ error: "Image URL and Link URL are required" });
        }

        const ad = await storage.createAd({
          imageUrl,
          linkUrl,
          active: true,
        });

        return res.status(201).json(ad);
      } catch (error) {
        log(`Create Ad Error: ${error}`, "error");
        return res.status(500).json({
          error: "Failed to create ad",
        });
      }
    },
  );

  app.put("/api/admin/ads/:id",
    adminAuthMiddleware,
    async (req, res) => {
      try {
        const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
        if (!id) return res.status(400).json({ error: "Invalid ad ID" });

        const updates = req.body;
        const ad = await storage.updateAd(id, updates);
        if (!ad) {
          return res.status(404).json({ error: "Ad not found" });
        }

        return res.json(ad);
      } catch (error) {
        log(`Update Ad Error: ${error}`, "error");
        return res.status(500).json({
          error: "Failed to update ad",
        });
      }
    },
  );

  app.delete("/api/admin/ads/:id",
    adminAuthMiddleware,
    async (req, res) => {
      try {
        const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0];
        if (!id) return res.status(400).json({ error: "Invalid ad ID" });

        const success = await storage.deleteAd(id);
        if (!success) {
          return res.status(404).json({ error: "Ad not found" });
        }

        return res.json({ success: true });
      } catch (error) {
        log(`Delete Ad Error: ${error}`, "error");
        return res.status(500).json({
          error: "Failed to delete ad",
        });
      }
    },
  );
}
