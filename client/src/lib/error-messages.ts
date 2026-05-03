/**
 * Client-side error message parser.
 * Safety net that catches any raw/technical errors that slip through
 * from the server and converts them to user-friendly messages.
 */

interface FriendlyError {
  title: string;
  description: string;
}

// Patterns that indicate a raw technical error leaked through
const TECHNICAL_PATTERNS = [
  /puppeteer/i,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /ECONNRESET/,
  /net::ERR_/,
  /at\s+\w+\s+\(/,       // stack trace line
  /node_modules/,
  /Cannot read prop/,
  /undefined is not/,
  /TypeError:/,
  /ReferenceError:/,
  /SyntaxError:/,
  /\.ts:\d+/,             // TypeScript file:line references
  /\.js:\d+/,             // JavaScript file:line references
  /INSTAGRAM_USERNAME/,
  /INSTAGRAM_PASSWORD/,
  /environment variable/i,
  /Worker disconnected/,
  /scraper:worker/,
];

/**
 * Parse an error (from a catch block or API response) into a
 * user-friendly title + description suitable for a toast.
 */
export function parseApiError(error: unknown): FriendlyError {
  // Network failure (fetch threw, not an HTTP error)
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return {
      title: "Connection Error",
      description: "Could not connect to the server. Please check your internet connection.",
    };
  }

  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    return {
      title: "Something Went Wrong",
      description: "An unexpected error occurred. Please try again.",
    };
  }

  // Strip HTTP status code prefix (e.g. "500: ..." from queryClient)
  message = message.replace(/^\d{3}:\s*/, "");

  // Try to parse JSON error body
  try {
    const json = JSON.parse(message);
    if (json.error) {
      message = json.error;
    }
  } catch {
    // not JSON, use as-is
  }

  // Check if the message looks technical
  const isTechnical = TECHNICAL_PATTERNS.some((p) => p.test(message));

  if (isTechnical) {
    return {
      title: "Something Went Wrong",
      description: "Something went wrong on our end. Please try again.",
    };
  }

  // Message is already user-friendly (came from server's friendlyError)
  return {
    title: "Error",
    description: message,
  };
}
