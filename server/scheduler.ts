import { storage } from "./storage";
import { fetchInstagramComments, extractPostId, countMentions } from "./instagram";
import { sendEmail } from "./email";
import { getResultsEmailHTML, getResultsEmailText } from "./email-templates";

const MAX_RETRY_ATTEMPTS = 20;
const BASE_RETRY_MS = 60 * 1000; // 1 minute
const MAX_RETRY_MS = 30 * 60 * 1000; // 30 minutes
const PREPARE_LEAD_MS = 5 * 60 * 1000; // 5 minutes before scheduled time

type SchedulerMeta = {
  attempts?: number;
  lastError?: string;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  queuedAt?: string;
  preparedAt?: string;
  preparedWinners?: any[];
  preparedEntryCount?: number;
  finalizedAt?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRetryableSchedulerError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("no scraper worker connected") ||
    message.includes("worker disconnected") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("temporarily unavailable")
  );
}

function getSchedulerMeta(config: any): SchedulerMeta {
  return (config?._scheduler || {}) as SchedulerMeta;
}

function toIsoOrNow(date: Date): string {
  const now = new Date();
  return (date.getTime() > now.getTime() ? date : now).toISOString();
}

function buildConfigWithMeta(config: any, meta: SchedulerMeta): any {
  return {
    ...config,
    _scheduler: meta,
  };
}

function clearRetryMeta(meta: SchedulerMeta): SchedulerMeta {
  return {
    ...meta,
    attempts: 0,
    lastError: undefined,
    nextAttemptAt: undefined,
  };
}

function computeWinners(config: any, pool: any[]): { winners: any[]; validCandidates: any[] } {
  const seenUsers = new Set<string>();
  const validCandidates: any[] = [];
  const blockedUsernames = new Set(
    (config.blockList || "")
      .split("\n")
      .map((line: string) => line.trim().toLowerCase().replace(/^@/, ""))
      .filter((username: string) => username.length > 0),
  );

  for (const entry of pool) {
    if (blockedUsernames.has(entry.username.toLowerCase())) continue;

    if (config.keyword) {
      if (!entry.text || !entry.text.toLowerCase().includes(config.keyword.toLowerCase())) continue;
    }

    if (config.requireMention && config.minMentions > 0) {
      const mentionCount = countMentions(entry.text);
      if (mentionCount < config.minMentions) continue;
    }

    if (config.duplicateCheck) {
      if (seenUsers.has(entry.username)) continue;
      seenUsers.add(entry.username);
    }

    validCandidates.push(entry);
  }

  const winnerCount = Math.min(config.winnerCount || 1, validCandidates.length);
  let winners: any[] = [];

  if (config.bonusChances) {
    const weightedPool: any[] = [];
    validCandidates.forEach((entry: any) => {
      const mentionCount = countMentions(entry.text);
      const minMentions = config.requireMention ? (config.minMentions || 0) : 0;
      const entries = 1 + Math.max(0, mentionCount - minMentions);
      for (let i = 0; i < entries; i++) {
        weightedPool.push(entry);
      }
    });

    const shuffled = [...weightedPool].sort(() => 0.5 - Math.random());
    const seen = new Set<string>();
    for (const entry of shuffled) {
      if (!seen.has(entry.username) && winners.length < winnerCount) {
        seen.add(entry.username);
        winners.push(entry);
      }
    }
  } else {
    const shuffled = [...validCandidates].sort(() => 0.5 - Math.random());
    winners = shuffled.slice(0, winnerCount);
  }

  return { winners, validCandidates };
}

async function fetchPoolForGiveaway(config: any): Promise<any[]> {
  const postCode = extractPostId(config.url);
  if (!postCode) {
    throw new Error("Invalid post URL in giveaway config");
  }

  const result = await fetchInstagramComments(postCode);
  return result.comments || [];
}

async function scheduleRetry(giveaway: any, error: unknown): Promise<void> {
  const config = giveaway.config || {};
  const previousMeta = getSchedulerMeta(config);
  const attempts = Number(previousMeta.attempts || 0) + 1;

  if (attempts >= MAX_RETRY_ATTEMPTS) {
    console.error(`[Scheduler] Giveaway ${giveaway.id} exceeded retry attempts (${attempts}). Marking as failed.`);
    await storage.updateGiveawayStatus(giveaway.id, "failed");
    return;
  }

  const delay = Math.min(BASE_RETRY_MS * (2 ** (attempts - 1)), MAX_RETRY_MS);
  const nextAttemptAt = new Date(Date.now() + delay).toISOString();
  const updatedMeta: SchedulerMeta = {
    ...previousMeta,
    attempts,
    lastError: getErrorMessage(error),
    lastAttemptAt: new Date().toISOString(),
    nextAttemptAt,
  };

  await storage.updateGiveaway(giveaway.id, {
    config: buildConfigWithMeta(config, updatedMeta),
    status: "pending" as any,
  });

  console.warn(
    `[Scheduler] Giveaway ${giveaway.id} deferred after transient error. Retry ${attempts}/${MAX_RETRY_ATTEMPTS - 1} at ${nextAttemptAt}`,
  );
}

async function runPreparation(giveaway: any, scheduledFor: Date): Promise<void> {
  const config = giveaway.config;
  const currentMeta = getSchedulerMeta(config);
  const pool = await fetchPoolForGiveaway(config);
  const { winners, validCandidates } = computeWinners(config, pool);

  const updatedMeta: SchedulerMeta = clearRetryMeta({
    ...currentMeta,
    preparedAt: new Date().toISOString(),
    preparedWinners: winners,
    preparedEntryCount: validCandidates.length,
    lastAttemptAt: new Date().toISOString(),
    nextAttemptAt: toIsoOrNow(scheduledFor),
  });

  await storage.updateGiveaway(giveaway.id, {
    config: buildConfigWithMeta(config, updatedMeta),
    status: "pending" as any,
  });

  console.log(
    `[Scheduler] Giveaway ${giveaway.id} prepared at T-5. Winners ready: ${winners.length}, candidates: ${validCandidates.length}`,
  );
}

async function finalizeGiveaway(giveaway: any): Promise<void> {
  const config = giveaway.config;
  const currentMeta = getSchedulerMeta(config);
  let winners = Array.isArray(currentMeta.preparedWinners) ? currentMeta.preparedWinners : null;
  let totalEntries = Number(currentMeta.preparedEntryCount || 0);

  if (!winners) {
    const pool = await fetchPoolForGiveaway(config);
    const computed = computeWinners(config, pool);
    winners = computed.winners;
    totalEntries = computed.validCandidates.length;
  }

  await storage.updateGiveawayStatus(giveaway.id, "completed", winners);

  const finalizedMeta: SchedulerMeta = {
    ...currentMeta,
    finalizedAt: new Date().toISOString(),
    nextAttemptAt: undefined,
  };
  await storage.updateGiveaway(giveaway.id, {
    config: buildConfigWithMeta(config, finalizedMeta),
  });

  const user = giveaway.userId !== "anonymous" ? await storage.getUser(giveaway.userId) : null;
  const targetEmail = user?.email || giveaway.config?.contactEmail;

  if (targetEmail) {
    const resultsSent = await sendEmail({
      to: targetEmail,
      subject: "🏆 Your Giveaway Results Are Ready!",
      text: getResultsEmailText({
        winners: winners.map((w: any) => ({
          username: w.username,
          comment: w.text,
        })),
        totalEntries,
        postUrl: config.url,
      }),
      html: getResultsEmailHTML({
        winners: winners.map((w: any) => ({
          username: w.username,
          comment: w.text,
        })),
        totalEntries,
        postUrl: config.url,
      }),
    });
    if (!resultsSent) {
      console.error(`[Scheduler] Failed to send results email for giveaway ${giveaway.id} to ${targetEmail}`);
    }
  }

  console.log(`[Scheduler] Giveaway ${giveaway.id} completed. Winners: ${winners.length}`);
}

async function processGiveaway(giveaway: any) {
  console.log(`[Scheduler] Processing giveaway ${giveaway.id}...`);
  try {
    const config = giveaway.config || {};
    if (config?._scheduler?.owner === "worker") {
      return;
    }
    if (config.mode !== "comments") {
      throw new Error(`Unsupported mode: ${config.mode}. Only 'comments' mode is supported.`);
    }

    const scheduledFor = new Date(giveaway.scheduledFor);
    const prepareAt = new Date(scheduledFor.getTime() - PREPARE_LEAD_MS);
    const now = new Date();
    const meta = getSchedulerMeta(config);

    // T-5: Start preparation only when within 5 minutes of scheduled time
    if (!meta.preparedAt && now.getTime() >= prepareAt.getTime()) {
      await runPreparation(giveaway, scheduledFor);
      if (now.getTime() < scheduledFor.getTime()) {
        return;
      }
      await finalizeGiveaway(giveaway);
      return;
    }

    if (now.getTime() >= scheduledFor.getTime()) {
      await finalizeGiveaway(giveaway);
      return;
    }
    // Before T-5: nothing to do, wait for next tick
  } catch (error) {
    if (isRetryableSchedulerError(error)) {
      await scheduleRetry(giveaway, error);
      return;
    }

    console.error(`[Scheduler] Giveaway ${giveaway.id} failed:`, error);
    await storage.updateGiveawayStatus(giveaway.id, "failed");
  }
}

export async function runSchedulerTick(): Promise<void> {
  try {
    const pending = await storage.getPendingGiveaways();
    if (pending.length > 0) {
      console.log(`[Scheduler] Found ${pending.length} pending giveaways.`);
      for (const giveaway of pending) {
        await processGiveaway(giveaway);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in poll loop:", error);
  }
}

export function startScheduler() {
  console.log("[Scheduler] Starting polling service...");
  void runSchedulerTick();
  setInterval(() => {
    void runSchedulerTick();
  }, 60 * 1000);
}
