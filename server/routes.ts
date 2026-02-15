import type { Express } from "express";
import type { Server } from "http";
import Stripe from "stripe";
import { setupAuth } from "./auth";
import { log } from "./log";
import { fetchInstagramComments, extractPostId } from "./instagram";
import {
  globalRateLimiter,
  instagramRateLimiter,
  giveawayRateLimiter,
  emailRateLimiter,
  validateRequest,
  validateInstagramRequest,
  validateGiveawayRequest,
  adminAuthMiddleware,
  generatePurchaseToken,
  redeemPurchaseToken,
  consumeCredit,
  getSecurityStats,
  getClientIP,
} from "./security";
import { registerPaymentRoutes } from "./routes/payment";
import { registerInstagramRoutes } from "./routes/instagram";
import { registerGiveawayRoutes } from "./routes/giveaways";
import { registerAdminRoutes } from "./routes/admin";
import { registerAdRoutes } from "./routes/ads";
import { registerPublicRoutes } from "./routes/public";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Track payment intent IDs to prevent double-redemption.
const redeemedPaymentIntents = new Set<string>();

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  app.use("/api", globalRateLimiter);
  app.use("/api", validateRequest);

  app.use("/api/instagram", (req, _res, next) => {
    if (req.method === "POST") {
      log(`API Request Body: ${JSON.stringify(req.body)}`, "debug");
    }
    next();
  });

  registerPaymentRoutes(app, {
    stripe,
    redeemedPaymentIntents,
    generatePurchaseToken,
    getClientIP,
  });

  registerInstagramRoutes(app, {
    validateInstagramRequest,
    instagramRateLimiter,
    fetchInstagramComments,
    extractPostId,
    redeemPurchaseToken,
    consumeCredit,
    getClientIP,
  });

  registerGiveawayRoutes(app, {
    giveawayRateLimiter,
    validateGiveawayRequest,
    redeemPurchaseToken,
    getClientIP,
  });

  registerAdminRoutes(app, {
    adminAuthMiddleware,
    generatePurchaseToken,
    getSecurityStats,
  });

  registerAdRoutes(app, {
    adminAuthMiddleware,
  });

  app.post("/api/contact", emailRateLimiter, async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message ?? "Invalid input";
        return res.status(400).json({ error: msg });
      }
      const { name, email, subject, message } = parsed.data;

      const contactEmail = process.env.CONTACT_EMAIL || "support@pickusawinner.com";
      const timestamp = format(new Date(), "PPpp");

      const { sendEmail } = await import("./email");
      const {
        getContactReceivedHTML,
        getContactReceivedText,
        getContactAutoReplyHTML,
        getContactAutoReplyText,
      } = await import("./email-templates");

      const contactData = { name, email, subject, message, timestamp };

      const supportSent = await sendEmail({
        to: contactEmail,
        subject: `[PickUsAWinner Contact] ${subject}`,
        text: getContactReceivedText(contactData),
        html: getContactReceivedHTML(contactData),
        replyTo: email,
      });

      const autoReplySent = await sendEmail({
        to: email,
        subject: "We received your message - PickUsAWinner",
        text: getContactAutoReplyText({ name }),
        html: getContactAutoReplyHTML({ name }),
      });

      if (!supportSent) {
        log(`[CONTACT] Failed to send to support (${contactEmail})`, "error");
        return res.status(500).json({ error: "Failed to send message. Please try again later." });
      }

      if (!autoReplySent) {
        log(`[CONTACT] Support email sent but auto-reply failed for ${email}`, "warn");
      }

      return res.json({ success: true });
    } catch (err) {
      log(`[CONTACT] Error: ${err}`, "error");
      return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
  });

  // ============================================
  // SEO ENDPOINTS
  // ============================================

  const INDEXNOW_KEY = "8466da73837f479186345615201a4510";
  const BASE_URL = "https://pickusawinner.com";

  const SITEMAP_URLS = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/tool", changefreq: "daily", priority: "0.95" },
    { loc: "/instagram-comment-scraper", changefreq: "weekly", priority: "0.85" },
    { loc: "/wheel", changefreq: "weekly", priority: "0.85" },
    { loc: "/picker", changefreq: "weekly", priority: "0.85" },
    { loc: "/youtube", changefreq: "weekly", priority: "0.8" },
    { loc: "/tiktok", changefreq: "weekly", priority: "0.8" },
    { loc: "/facebook-picker", changefreq: "weekly", priority: "0.8" },
    { loc: "/twitter-picker", changefreq: "weekly", priority: "0.8" },
    { loc: "/press", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact", changefreq: "monthly", priority: "0.6" },
    { loc: "/privacy", changefreq: "monthly", priority: "0.4" },
    { loc: "/terms", changefreq: "monthly", priority: "0.4" },
  ];

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /schedule/
Disallow: /analytics

Sitemap: ${BASE_URL}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const currentDate = new Date().toISOString().split("T")[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${SITEMAP_URLS.map((u) => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.type("application/xml");
    res.send(sitemap);
  registerPublicRoutes(app, {
    emailRateLimiter,
  });

  // IndexNow key verification file
  app.get(`/${INDEXNOW_KEY}.txt`, (_req, res) => {
    res.type("text/plain");
    res.send(INDEXNOW_KEY);
  });

  // IndexNow submission endpoint - call this to notify search engines of URL changes
  app.post("/api/indexnow/submit", async (req, res) => {
    const { urls } = req.body as { urls?: string[] };
    const urlList = urls?.length
      ? urls.map((u: string) => `${BASE_URL}${u}`)
      : SITEMAP_URLS.map((u) => `${BASE_URL}${u.loc}`);

    const payload = {
      host: "pickusawinner.com",
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    // Submit to all IndexNow-supporting search engines
    const engines = [
      "https://api.indexnow.org/IndexNow",
      "https://www.bing.com/IndexNow",
      "https://yandex.com/indexnow",
    ];

    const results: { engine: string; status: number }[] = [];
    for (const engine of engines) {
      try {
        const r = await fetch(engine, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });
        results.push({ engine, status: r.status });
      } catch (err) {
        results.push({ engine, status: 0 });
      }
    }

    log(`[INDEXNOW] Submitted ${urlList.length} URLs: ${JSON.stringify(results)}`);
    return res.json({ success: true, submitted: urlList.length, results });
  });

  return httpServer;
}
