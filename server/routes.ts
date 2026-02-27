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
import { registerArticleRoutes } from "./routes/articles";
import { getAllArticles } from "./markdown";
import { scraperRelay } from "./scraper-relay";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Track payment intent IDs to prevent double-redemption.
const redeemedPaymentIntents = new Set<string>();

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  // Enforce a single canonical origin in production to reduce duplicate indexing.
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      return next();
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const host = (req.get("host") || "").toLowerCase();
    const hostWithoutPort = host.split(":")[0];
    const forwardedProto = (req.get("x-forwarded-proto") || "").toLowerCase();
    const isHttp = req.protocol !== "https" && forwardedProto !== "https";
    const isWwwHost = hostWithoutPort === "www.pickusawinner.com";
    const isCanonicalHost = hostWithoutPort === "pickusawinner.com";

    if (isHttp || isWwwHost || !isCanonicalHost) {
      const target = `https://pickusawinner.com${req.originalUrl}`;
      return res.redirect(301, target);
    }

    return next();
  });

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

  registerArticleRoutes(app);

  // ============================================
  // SEO ENDPOINTS
  // ============================================

  const INDEXNOW_KEY = "2d3b9af4fb684c5cb646d6f9e42ffce8";
  const BASE_URL = "https://pickusawinner.com";

  const SITEMAP_URLS = [
    { loc: "/giveaway-generator", changefreq: "daily", priority: "1.0" },
    { loc: "/tool", changefreq: "daily", priority: "0.95" },
    { loc: "/spin-the-wheel", changefreq: "weekly", priority: "0.9" },
    { loc: "/random-name-picker", changefreq: "weekly", priority: "0.9" },
    { loc: "/random-option-picker", changefreq: "weekly", priority: "0.9" },
    { loc: "/how-it-works", changefreq: "weekly", priority: "0.85" },
    { loc: "/instagram-giveaway-guide", changefreq: "weekly", priority: "0.85" },
    { loc: "/youtube", changefreq: "weekly", priority: "0.8" },
    { loc: "/tiktok", changefreq: "weekly", priority: "0.8" },
    { loc: "/facebook-picker", changefreq: "weekly", priority: "0.8" },
    { loc: "/twitter-picker", changefreq: "weekly", priority: "0.8" },
    { loc: "/press", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact", changefreq: "monthly", priority: "0.6" },
    { loc: "/faq", changefreq: "monthly", priority: "0.6" },
    { loc: "/privacy", changefreq: "monthly", priority: "0.4" },
    { loc: "/terms", changefreq: "monthly", priority: "0.4" },
  ];

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /analytics

Sitemap: ${BASE_URL}/sitemap.xml
`);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];

      // Get dynamic article URLs
      const articles = await getAllArticles();
      const articleUrls = articles.map((a) => ({
        loc: `/article/${a.slug}`,
        lastmod: a.lastModified,
        changefreq: "monthly",
        priority: "0.7",
      }));

      // Combine static URLs with current date as lastmod
      const staticUrlsWithDate = SITEMAP_URLS.map((u) => ({
        ...u,
        lastmod: currentDate,
      }));

      // Combine static and dynamic URLs
      const allUrls = [...staticUrlsWithDate, ...articleUrls];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map((u) => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

      res.type("application/xml");
      res.send(sitemap);
    } catch (error) {
      log(`[SITEMAP] Error generating sitemap: ${error}`);
      res.status(500).send("Error generating sitemap");
    }
  });

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
