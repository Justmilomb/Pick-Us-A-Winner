import type { Express } from "express";
import { format } from "date-fns";
import { log } from "../log";
import { storage } from "../storage";

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
            error: tokenResult.error || "Invalid payment token",
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

        const giveaway = await storage.createGiveaway({
          userId: requesterUserId,
          scheduledFor: scheduledDate,
          config,
          status: status || "pending",
        });

        const contactEmail = (config as any).contactEmail;
        if (contactEmail && (giveaway as any).accessToken) {
          const { sendEmail } = await import("../email");
          const { getScheduleEmailHTML, getScheduleEmailText } = await import("../email-templates");
          const baseUrl = process.env.BASE_URL || req.protocol + "://" + req.get("host");
          const accessLink = `${baseUrl}/schedule/${(giveaway as any).accessToken}`;
          const scheduledDateFormatted = format(scheduledDate, "MMMM do, yyyy 'at' h:mm a");

          const confirmationSent = await sendEmail({
            to: contactEmail,
            subject: "Your Giveaway Has Been Scheduled! ðŸŽ‰",
            text: getScheduleEmailText({
              scheduledDate: scheduledDateFormatted,
              accessLink,
              postUrl: (config as any).url,
            }),
            html: getScheduleEmailHTML({
              scheduledDate: scheduledDateFormatted,
              accessLink,
              postUrl: (config as any).url,
            }),
          });

          if (!confirmationSent) {
            log(`[EMAIL] Failed to send schedule confirmation to ${contactEmail} for giveaway ${(giveaway as any).id}`, "error");
          }
        }

        return res.status(201).json(giveaway);
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
          error: "Giveaway cannot be edited. Less than 15 minutes remaining.",
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
          error: "Giveaway cannot be cancelled. Less than 15 minutes remaining.",
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
}
