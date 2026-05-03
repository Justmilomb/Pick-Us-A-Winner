/**
 * Error Message Sanitization
 *
 * Maps raw internal/scraper errors to user-friendly messages.
 * Ensures no technical details leak to the client.
 */

import type { Response } from "express";
import { log } from "./log";

interface FriendlyError {
  title: string;
  message: string;
}

const ERROR_PATTERNS: Array<{ test: (msg: string) => boolean; title: string; message: string }> = [
  // Scraper unavailable (env vars missing, Puppeteer not installed, worker offline)
  {
    test: (m) =>
      m.includes("INSTAGRAM_USERNAME") ||
      m.includes("INSTAGRAM_PASSWORD") ||
      m.includes("environment variable") ||
      m.includes("Puppeteer may not be installed") ||
      m.includes("not available") ||
      m.includes("No scraper available") ||
      m.includes("Worker disconnected") ||
      m.includes("scraper:worker"),
    title: "Service Temporarily Unavailable",
    message: "Instagram comment fetching is temporarily unavailable. Please try again in a few minutes.",
  },
  // Timeouts
  {
    test: (m) =>
      m.includes("TimeoutError") ||
      m.includes("Navigation timeout") ||
      m.includes("net::ERR_") ||
      m.includes("Timed out") ||
      m.includes("timed out") ||
      m.includes("ETIMEDOUT"),
    title: "Request Timed Out",
    message: "Instagram took too long to respond. Please try again.",
  },
  // Login / checkpoint challenges
  {
    test: (m) =>
      m.includes("login") ||
      m.includes("challenge") ||
      m.includes("checkpoint") ||
      m.includes("suspicious_login"),
    title: "Temporarily Blocked",
    message: "Instagram is temporarily blocking requests. Please try again in a few minutes.",
  },
  // Rate limiting from Instagram itself
  {
    test: (m) =>
      m.includes("rate limit") ||
      m.includes("429") ||
      m.includes("too many requests"),
    title: "Too Many Requests",
    message: "Too many requests to Instagram. Please wait a few minutes and try again.",
  },
  // Connection errors
  {
    test: (m) =>
      m.includes("ECONNREFUSED") ||
      m.includes("ENOTFOUND") ||
      m.includes("ECONNRESET") ||
      m.includes("fetch failed") ||
      m.includes("network"),
    title: "Connection Error",
    message: "Could not connect to Instagram. Please check your internet connection and try again.",
  },
  // Private / unavailable posts
  {
    test: (m) =>
      m.includes("private") ||
      m.includes("not accessible") ||
      m.includes("Page not found") ||
      m.includes("not found"),
    title: "Post Unavailable",
    message: "This Instagram post appears to be private or unavailable.",
  },
  // Generic scraper crash
  {
    test: (m) =>
      m.includes("scraper") ||
      m.includes("Scraper") ||
      m.includes("browser") ||
      m.includes("Browser"),
    title: "Something Went Wrong",
    message: "Something went wrong while fetching comments. This is usually temporary — please try again in a minute.",
  },
];

/**
 * Convert an internal error into a user-friendly message.
 */
export function friendlyError(error: unknown): FriendlyError {
  const raw = error instanceof Error ? error.message : String(error);

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(raw)) {
      return { title: pattern.title, message: pattern.message };
    }
  }

  return {
    title: "Something Went Wrong",
    message: "Something went wrong on our end. Please try again.",
  };
}

/**
 * Send a sanitized error response. Logs the real error server-side,
 * sends only a friendly message to the client.
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  error: unknown,
  logContext: string,
  overrideMessage?: string,
): void {
  const raw = error instanceof Error ? error.message : String(error);
  log(`[${logContext}] ${raw}`, "error");

  const friendly = overrideMessage
    ? { title: "Error", message: overrideMessage }
    : friendlyError(error);

  res.status(statusCode).json({
    error: friendly.message,
    errorTitle: friendly.title,
  });
}
