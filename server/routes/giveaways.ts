import type { Express } from "express";
import { format } from "date-fns";
import { log } from "../log";
import { storage } from "../storage";
import { scraperRelay } from "../scraper-relay";
import { sendEmail } from "../email";
import {
  getResultsEmailHTML,
  getResultsEmailText,
  getScraperOfflineScheduledEmailHTML,
  getScraperOfflineScheduledEmailText,
} from "../email-templates";

interface GiveawayRouteDeps {
  giveawayRateLimiter: any;
  validateGiveawayRequest: any;
  redeemPurchaseToken: (ip: string, token: string) => { success: boolean; error?: string };
  getClientIP: (req: any) => string;
}

function validateMinimumTime(scheduledFor: Date): { valid: boolean; error?: string } {
  const now = new Date();
  const minTime = new Date(now.getTime() + 15 * 60 * 1000);
  if (scheduledFor < minTime) {
    return {
      valid: false,
      error: "Scheduled time must be at least 15 minutes from now.",
    };
  }

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  if (scheduledFor > maxDate) {
    return {
      valid: false,
      error: "Scheduled time cannot be more than 1 month in advance.",
    };
  }

  return { valid: true };
}

function isValidDateValue(value: unknown): value is string | number | Date {
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function getInternalScraperSecret(): string {
  return process.env.SCRAPER_RESULT_SECRET || process.env.SCRAPER_RELAY_SECRET || "";
}

async function queueWorkerJob(giveaway: any, action: "upsert" | "cancel" = "upsert"): Promise<void> {
  await scraperRelay.scheduleJob({
    giveawayId: giveaway.id,
    scheduledFor: new Date(giveaway.scheduledFor).toISOString(),
    config: giveaway.config,
    action,
  });
}

export function registerGiveawayRoutes(app: Express, deps: GiveawayRouteDeps): void {
  const {
    giveawayRateLimiter,
    validateGiveawayRequest,
    redeemPurchaseToken,
    getClientIP,
  } = deps;

  app.post("/api/giveaways",
    giveawayRateLimiter,
    validateGiveawayRequest,
    async (req, res) => {
      try {
        const { scheduledFor, config, status, paymentToken } = req.body;

        if (!scheduledFor || !config) {
          return res.status(400).send("Missing required fields");
        }

        if (!isValidDateValue(scheduledFor)) {
          return res.status(400).json({ error: "Invalid scheduled date" });
        }

        if (typeof config !== "object" || config === null) {
          return res.status(400).json({ error: "Invalid giveaway config" });
        }

        if (typeof (config as any).url !== "string" || !(config as any).url.includes("instagram.com")) {
          return res.status(400).json({ error: "A valid Instagram URL is required in config.url" });
        }

        if (!paymentToken || typeof paymentToken !== "string") {
          return res.status(402).json({
            error: "Payment required. Please complete payment before scheduling.",
            paymentRequired: true,
          });
        }

        const ip = getClientIP(req);
        const tokenResult = redeemPurchaseToken(ip, paymentToken);
        if (!tokenResult.success) {
          return res.status(402).json({
            error: "Your payment session has expired or is invalid. Please try the payment again.",
            paymentRequired: true,
          });
        }

        if (!(config as any).contactEmail) {
          return res.status(400).json({ error: "Contact email is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test((config as any).contactEmail)) {
          return res.status(400).json({ error: "Invalid email format" });
        }

        const scheduledDate = new Date(scheduledFor);
        const timeValidation = validateMinimumTime(scheduledDate);
        if (!timeValidation.valid) {
          return res.status(400).json({ error: timeValidation.error });
        }

        const requesterUserId = req.isAuthenticated() ? (req.user as any).id : "anonymous";
        const schedulerMeta = {
          queuedAt: new Date().toISOString(),
          owner: "worker",
        };
        const configWithScheduler = {
          ...(config as any),
          _scheduler: schedulerMeta,
        };

        const giveaway = await storage.createGiveaway({
          userId: requesterUserId,
          scheduledFor: scheduledDate,
          config: configWithScheduler as any,
          status: status || "pending",
        });

        let scraperOnline = true;
        try {
          await queueWorkerJob(giveaway, "upsert");
        } catch (queueError) {
          scraperOnline = false;
          log(`[Giveaway] Worker unavailable at scheduling time, marking pendingQueue for ${(giveaway as any).id}`, "warn");
          const pendingConfig = {
            ...(giveaway as any).config,
            _scheduler: {
              ...(giveaway as any).config._scheduler,
              pendingQueue: true,
            },
          };
          await storage.updateGiveaway((giveaway as any).id, { config: pendingConfig });
        }

        const contactEmail = (config as any).contactEmail;
        if (contactEmail && (giveaway as any).accessToken) {
          const { sendEmail } = await import("../email");
          const { getScheduleEmailHTML, getScheduleEmailText } = await import("../email-templates");
          const baseUrl = process.env.BASE_URL || req.protocol + "://" + req.get("host");
          const accessLink = `${baseUrl}/schedule/${(giveaway as any).accessToken}`;
          const scheduledDateFormatted = format(scheduledDate, "MMMM do, yyyy 'at' h:mm a");

          let subject: string;
          let html: string;
          let text: string;

          if (scraperOnline) {
            subject = "Your Giveaway Has Been Scheduled! 🎉";
            html = getScheduleEmailHTML({ scheduledDate: scheduledDateFormatted, accessLink, postUrl: (config as any).url });
            text = getScheduleEmailText({ scheduledDate: scheduledDateFormatted, accessLink, postUrl: (config as any).url });
          } else {
            subject = "Your Giveaway Is Queued — We're On It";
            html = getScraperOfflineScheduledEmailHTML({ scheduledDate: scheduledDateFormatted, accessLink, postUrl: (config as any).url });
            text = getScraperOfflineScheduledEmailText({ scheduledDate: scheduledDateFormatted, accessLink, postUrl: (config as any).url });
          }

          const confirmationSent = await sendEmail({ to: contactEmail, subject, html, text });
          if (!confirmationSent) {
            log(`[EMAIL] Failed to send schedule confirmation to ${contactEmail} for giveaway ${(giveaway as any).id}`, "error");
          }
        }

        return res.status(201).json({ ...(giveaway as any), scraperOnline });
      } catch (error) {
        log(`Schedule Giveaway Error: ${error}`, "error");
        return res.status(500).json({ error: "Failed to schedule giveaway" });
      }
    },
  );

  app.get("/api/giveaways", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json([]);
    }
    const giveaways = await storage.getUserGiveaways((req.user as any).id);
    return res.json(giveaways);
  });

  app.get("/api/giveaways/:token", async (req, res) => {
    try {
      const { token } = req.params;
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

  app.put("/api/giveaways/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { scheduledFor, config, status } = req.body;

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
          error: "This giveaway can no longer be edited because it starts in less than 15 minutes.",
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
      const nextScheduledFor = scheduledFor ? new Date(scheduledFor) : new Date(giveaway.scheduledFor);
      if (scheduledFor) updates.scheduledFor = nextScheduledFor;
      if (config || scheduledFor) {
        const baseConfig = config || (giveaway as any).config;
        updates.config = {
          ...baseConfig,
          _scheduler: {
            queuedAt: new Date().toISOString(),
            owner: "worker",
          },
        };
      }
      if (status) updates.status = status;

      const preview = {
        ...giveaway,
        ...updates,
      };

      try {
        await queueWorkerJob({ ...preview, scheduledFor: nextScheduledFor }, "upsert");
      } catch (queueError) {
        return res.status(503).json({
          error: "Failed to sync updated giveaway to worker queue. Please retry.",
        });
      }

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
          error: "This giveaway can no longer be cancelled because it starts in less than 15 minutes.",
        });
      }

      try {
        await queueWorkerJob(giveaway, "cancel");
      } catch (queueError) {
        return res.status(503).json({
          error: "Failed to cancel giveaway in worker queue. Please retry.",
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

  app.post("/api/internal/scheduled-result", async (req, res) => {
    try {
      const secret = req.get("x-scraper-secret") || "";
      const expectedSecret = getInternalScraperSecret();
      if (!expectedSecret || secret !== expectedSecret) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { giveawayId, status, winners, totalEntries, error } = req.body || {};
      if (!giveawayId || typeof giveawayId !== "string") {
        return res.status(400).json({ error: "Missing giveawayId" });
      }
      if (status !== "completed" && status !== "failed") {
        return res.status(400).json({ error: "Invalid status" });
      }

      const giveaway = await storage.getGiveaway(giveawayId);
      if (!giveaway) {
        return res.status(404).json({ error: "Giveaway not found" });
      }

      if ((giveaway as any).status === "completed" || (giveaway as any).status === "failed") {
        return res.json({ success: true, deduped: true });
      }

      if (status === "failed") {
        await storage.updateGiveawayStatus(giveawayId, "failed");
        log(`[Worker] Giveaway ${giveawayId} marked failed: ${error || "unknown error"}`, "error");
        return res.json({ success: true });
      }

      const finalWinners = Array.isArray(winners) ? winners : [];
      await storage.updateGiveawayStatus(giveawayId, "completed", finalWinners);

      const user = giveaway.userId !== "anonymous" ? await storage.getUser(giveaway.userId) : null;
      const targetEmail = user?.email || (giveaway as any).config?.contactEmail;
      if (targetEmail) {
        const resultsSent = await sendEmail({
          to: targetEmail,
          subject: "🏆 Your Giveaway Results Are Ready!",
          text: getResultsEmailText({
            winners: finalWinners.map((w: any) => ({
              username: w.username,
              comment: w.text,
            })),
            totalEntries: Number(totalEntries || finalWinners.length || 0),
            postUrl: (giveaway as any).config?.url,
          }),
          html: getResultsEmailHTML({
            winners: finalWinners.map((w: any) => ({
              username: w.username,
              comment: w.text,
            })),
            totalEntries: Number(totalEntries || finalWinners.length || 0),
            postUrl: (giveaway as any).config?.url,
          }),
        });
        if (!resultsSent) {
          log(`[EMAIL] Failed to send scheduled results email for giveaway ${giveawayId} to ${targetEmail}`, "error");
        }
      }

      return res.json({ success: true });
    } catch (endpointError) {
      log(`Worker Scheduled Result Error: ${endpointError}`, "error");
      return res.status(500).json({ error: "Failed to process scheduled result" });
    }
  });
}
