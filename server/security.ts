/**
 * Security Module - Protects against API abuse
 * 
 * Features:
 * - Rate limiting per IP
 * - Credit/token system for expensive operations
 * - Usage tracking
 * - Request validation
 */

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Helper to normalize IPv6 addresses for consistent rate limiting
function normalizeIP(ip: string): string {
  // Handle IPv6-mapped IPv4 addresses (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  // For IPv6, take the /64 prefix for grouping
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return parts.slice(0, 4).join(':');
    }
  }
  return ip;
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Rate limits
  GLOBAL_RATE_LIMIT: 100,           // requests per window per IP
  GLOBAL_RATE_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  
  INSTAGRAM_RATE_LIMIT: 5,          // Instagram API calls per window per IP
  INSTAGRAM_RATE_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  
  GIVEAWAY_RATE_LIMIT: 3,           // Giveaway creations per window per IP
  GIVEAWAY_RATE_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  
  EMAIL_RATE_LIMIT: 10,             // Emails per window per IP
  EMAIL_RATE_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  
  IMAGE_RATE_LIMIT: 20,             // Image generations per window per IP
  IMAGE_RATE_WINDOW_MS: 60 * 60 * 1000, // 1 hour

  // Credit system
  FREE_CREDITS_PER_IP: 2,           // Free API calls before requiring payment
  CREDITS_PER_PURCHASE: 10,         // Credits granted per purchase
  
  // Validation
  MAX_PAYLOAD_SIZE: 50 * 1024,      // 50KB max request body
  MAX_URL_LENGTH: 500,
  MAX_BLOCK_LIST_LENGTH: 10000,     // Characters
  MAX_WINNERS: 50,
  MAX_EMAIL_RECIPIENTS: 10,

  // Security
  SUSPICIOUS_THRESHOLD: 10,         // Requests that trigger enhanced monitoring
  BLOCK_THRESHOLD: 50,              // Requests that trigger temporary block
  BLOCK_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
};

// ============================================
// STORAGE
// ============================================

interface UsageRecord {
  ip: string;
  credits: number;
  freeCreditsUsed: number;
  totalRequests: number;
  instagramCalls: number;
  giveawaysCreated: number;
  emailsSent: number;
  imagesGenerated: number;
  lastActivity: string;
  suspicious: boolean;
  blocked: boolean;
  blockedUntil?: string;
  purchaseTokens: string[];
}

interface SecurityData {
  usage: Record<string, UsageRecord>;
  purchaseTokens: Record<string, { 
    credits: number; 
    createdAt: string; 
    usedBy?: string;
    usedAt?: string;
  }>;
}

const DATA_FILE = path.resolve(process.cwd(), "security-data.json");

let securityData: SecurityData = {
  usage: {},
  purchaseTokens: {}
};

// Load data on startup
function loadSecurityData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      securityData = JSON.parse(raw);
      console.log(`[Security] Loaded security data: ${Object.keys(securityData.usage).length} IPs tracked`);
    }
  } catch (error) {
    console.error("[Security] Error loading security data:", error);
  }
}

function saveSecurityData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(securityData, null, 2));
  } catch (error) {
    console.error("[Security] Error saving security data:", error);
  }
}

// Initialize
loadSecurityData();

// ============================================
// USAGE TRACKING
// ============================================

function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  let ip: string;
  if (forwarded) {
    ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  } else {
    ip = req.ip || req.socket.remoteAddress || "unknown";
  }
  return normalizeIP(ip);
}

function getUsageRecord(ip: string): UsageRecord {
  if (!securityData.usage[ip]) {
    securityData.usage[ip] = {
      ip,
      credits: 0,
      freeCreditsUsed: 0,
      totalRequests: 0,
      instagramCalls: 0,
      giveawaysCreated: 0,
      emailsSent: 0,
      imagesGenerated: 0,
      lastActivity: new Date().toISOString(),
      suspicious: false,
      blocked: false,
      purchaseTokens: []
    };
  }
  return securityData.usage[ip];
}

function trackRequest(ip: string, type: "general" | "instagram" | "giveaway" | "email" | "image") {
  const record = getUsageRecord(ip);
  record.totalRequests++;
  record.lastActivity = new Date().toISOString();
  
  switch (type) {
    case "instagram":
      record.instagramCalls++;
      break;
    case "giveaway":
      record.giveawaysCreated++;
      break;
    case "email":
      record.emailsSent++;
      break;
    case "image":
      record.imagesGenerated++;
      break;
  }

  // Check for suspicious activity
  if (record.totalRequests > CONFIG.SUSPICIOUS_THRESHOLD && !record.suspicious) {
    record.suspicious = true;
    console.log(`[Security] Suspicious activity detected from IP: ${ip}`);
  }

  // Auto-block on excessive requests
  if (record.totalRequests > CONFIG.BLOCK_THRESHOLD && !record.blocked) {
    record.blocked = true;
    record.blockedUntil = new Date(Date.now() + CONFIG.BLOCK_DURATION_MS).toISOString();
    console.log(`[Security] IP blocked: ${ip} until ${record.blockedUntil}`);
  }

  saveSecurityData();
}

// ============================================
// CREDIT SYSTEM
// ============================================

export function checkCredits(ip: string): { hasCredits: boolean; remaining: number; freeRemaining: number } {
  const record = getUsageRecord(ip);
  
  // Check if they have free credits remaining
  const freeRemaining = Math.max(0, CONFIG.FREE_CREDITS_PER_IP - record.freeCreditsUsed);
  
  // Total credits = purchased credits + free remaining
  const totalRemaining = record.credits + freeRemaining;
  
  return {
    hasCredits: totalRemaining > 0,
    remaining: totalRemaining,
    freeRemaining
  };
}

export function consumeCredit(ip: string): boolean {
  const record = getUsageRecord(ip);
  const creditStatus = checkCredits(ip);
  
  if (!creditStatus.hasCredits) {
    return false;
  }
  
  // Use free credits first
  if (creditStatus.freeRemaining > 0) {
    record.freeCreditsUsed++;
  } else if (record.credits > 0) {
    record.credits--;
  } else {
    return false;
  }
  
  saveSecurityData();
  return true;
}

export function generatePurchaseToken(credits: number = CONFIG.CREDITS_PER_PURCHASE): string {
  const token = `PAY_${randomUUID()}`;
  securityData.purchaseTokens[token] = {
    credits,
    createdAt: new Date().toISOString()
  };
  saveSecurityData();
  console.log(`[Security] Generated purchase token: ${token} for ${credits} credits`);
  return token;
}

export function redeemPurchaseToken(ip: string, token: string): { success: boolean; credits?: number; error?: string } {
  const tokenData = securityData.purchaseTokens[token];
  
  if (!tokenData) {
    return { success: false, error: "Invalid token" };
  }
  
  if (tokenData.usedBy) {
    return { success: false, error: "Token already used" };
  }
  
  // Mark token as used
  tokenData.usedBy = ip;
  tokenData.usedAt = new Date().toISOString();
  
  // Add credits to user
  const record = getUsageRecord(ip);
  record.credits += tokenData.credits;
  record.purchaseTokens.push(token);
  
  saveSecurityData();
  console.log(`[Security] Token ${token} redeemed by ${ip} for ${tokenData.credits} credits`);
  
  return { success: true, credits: tokenData.credits };
}

// ============================================
// RATE LIMITERS
// ============================================

// Global rate limiter - applies to all routes
export const globalRateLimiter = rateLimit({
  windowMs: CONFIG.GLOBAL_RATE_WINDOW_MS,
  max: CONFIG.GLOBAL_RATE_LIMIT,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default IP detection (req.ip)
});

// Instagram API rate limiter - stricter
export const instagramRateLimiter = rateLimit({
  windowMs: CONFIG.INSTAGRAM_RATE_WINDOW_MS,
  max: CONFIG.INSTAGRAM_RATE_LIMIT,
  message: { 
    error: "Instagram API rate limit exceeded. Please try again later or purchase more credits.",
    retryAfter: Math.ceil(CONFIG.INSTAGRAM_RATE_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Giveaway creation rate limiter
export const giveawayRateLimiter = rateLimit({
  windowMs: CONFIG.GIVEAWAY_RATE_WINDOW_MS,
  max: CONFIG.GIVEAWAY_RATE_LIMIT,
  message: { error: "Too many giveaways created. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email rate limiter
export const emailRateLimiter = rateLimit({
  windowMs: CONFIG.EMAIL_RATE_WINDOW_MS,
  max: CONFIG.EMAIL_RATE_LIMIT,
  message: { error: "Too many emails sent. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Image generation rate limiter
export const imageRateLimiter = rateLimit({
  windowMs: CONFIG.IMAGE_RATE_WINDOW_MS,
  max: CONFIG.IMAGE_RATE_LIMIT,
  message: { error: "Too many image requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// MIDDLEWARE
// ============================================

// Block check middleware
export function blockCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  const record = getUsageRecord(ip);
  
  // Check if blocked
  if (record.blocked) {
    if (record.blockedUntil && new Date(record.blockedUntil) > new Date()) {
      return res.status(403).json({ 
        error: "Access temporarily blocked due to suspicious activity",
        blockedUntil: record.blockedUntil
      });
    } else {
      // Unblock if time has passed
      record.blocked = false;
      record.blockedUntil = undefined;
      record.totalRequests = 0; // Reset counter
      saveSecurityData();
    }
  }
  
  next();
}

// Credit check middleware for expensive operations
export function creditCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  const creditStatus = checkCredits(ip);
  
  if (!creditStatus.hasCredits) {
    return res.status(402).json({
      error: "No credits remaining. Please purchase credits to continue.",
      creditsRemaining: 0,
      purchaseRequired: true
    });
  }
  
  // Attach credit info to request for later use
  (req as any).creditStatus = creditStatus;
  next();
}

// Usage tracking middleware
export function createTrackingMiddleware(type: "general" | "instagram" | "giveaway" | "email" | "image") {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);
    trackRequest(ip, type);
    next();
  };
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Check payload size
  const contentLength = parseInt(req.headers["content-length"] || "0");
  if (contentLength > CONFIG.MAX_PAYLOAD_SIZE) {
    return res.status(413).json({ error: "Request payload too large" });
  }
  
  next();
}

// Instagram-specific validation
export function validateInstagramRequest(req: Request, res: Response, next: NextFunction) {
  const { url } = req.body;
  
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid URL parameter" });
  }
  
  if (url.length > CONFIG.MAX_URL_LENGTH) {
    return res.status(400).json({ error: "URL too long" });
  }
  
  if (!url.includes("instagram.com")) {
    return res.status(400).json({ error: "Please provide a valid Instagram URL" });
  }
  
  next();
}

// Giveaway validation
export function validateGiveawayRequest(req: Request, res: Response, next: NextFunction) {
  const { config } = req.body;
  
  if (!config) {
    return res.status(400).json({ error: "Missing giveaway configuration" });
  }
  
  // Validate winner count
  if (config.winnerCount && (config.winnerCount < 1 || config.winnerCount > CONFIG.MAX_WINNERS)) {
    return res.status(400).json({ error: `Winner count must be between 1 and ${CONFIG.MAX_WINNERS}` });
  }
  
  // Validate block list length
  if (config.blockList && config.blockList.length > CONFIG.MAX_BLOCK_LIST_LENGTH) {
    return res.status(400).json({ error: "Block list too long" });
  }
  
  next();
}

// Email validation
export function validateEmailRequest(req: Request, res: Response, next: NextFunction) {
  const { winners } = req.body;
  
  if (!winners || !Array.isArray(winners)) {
    return res.status(400).json({ error: "Winners array is required" });
  }
  
  if (winners.length > CONFIG.MAX_EMAIL_RECIPIENTS) {
    return res.status(400).json({ error: `Maximum ${CONFIG.MAX_EMAIL_RECIPIENTS} email recipients allowed` });
  }
  
  // Validate email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const winner of winners) {
    if (winner.email && !emailRegex.test(winner.email)) {
      return res.status(400).json({ error: `Invalid email format: ${winner.email}` });
    }
  }
  
  next();
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export function getSecurityStats() {
  const ips = Object.keys(securityData.usage);
  const blocked = ips.filter(ip => securityData.usage[ip].blocked).length;
  const suspicious = ips.filter(ip => securityData.usage[ip].suspicious).length;
  const totalInstagramCalls = ips.reduce((sum, ip) => sum + securityData.usage[ip].instagramCalls, 0);
  
  return {
    totalTrackedIPs: ips.length,
    blockedIPs: blocked,
    suspiciousIPs: suspicious,
    totalInstagramCalls,
    totalPurchaseTokens: Object.keys(securityData.purchaseTokens).length,
    usedPurchaseTokens: Object.values(securityData.purchaseTokens).filter(t => t.usedBy).length
  };
}

export function isAdminRequest(req: Request): boolean {
  // Check for admin API key in header
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    console.warn("[Security] ADMIN_API_KEY not set - admin endpoints disabled");
    return false;
  }
  
  return adminKey === expectedKey;
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ============================================
// EXPORTS
// ============================================

export { CONFIG as SECURITY_CONFIG, getClientIP, getUsageRecord };
