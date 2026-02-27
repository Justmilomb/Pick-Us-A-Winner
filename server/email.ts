import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
}

export interface EmailHealthStatus {
    configured: boolean;
    verified: boolean;
    smtp: {
        host: string | null;
        port: string | null;
        secure: boolean;
        userMasked: string | null;
        from: string | null;
        fromMatchesUser: boolean;
    };
    error?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;
let isTransportVerified = false;
let verifyPromise: Promise<void> | null = null;

function resetTransporter(reason: string): void {
    transporter = null;
    isTransportVerified = false;
    verifyPromise = null;
    console.warn(`[EMAIL] SMTP transporter reset: ${reason}`);
}

function getTransporter(): nodemailer.Transporter | null {
    if (transporter) {
        return transporter;
    }

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.warn("[EMAIL] SMTP not configured. Email sending will be disabled.");
        console.warn("[EMAIL] Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
        return null;
    }

    try {
        const parsedPort = Number.parseInt(smtpPort, 10);
        if (!Number.isFinite(parsedPort)) {
            console.error(`[EMAIL] Invalid SMTP_PORT value: ${smtpPort}`);
            return null;
        }

        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parsedPort,
            secure: process.env.SMTP_SECURE === "true" || smtpPort === "465",
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
        });

        console.log(`[EMAIL] SMTP transporter configured for ${smtpHost}:${smtpPort}`);
        return transporter;
    } catch (error) {
        console.error("[EMAIL] Failed to create transporter:", error);
        return null;
    }
}

/** Check if email is configured (Resend or SMTP) */
export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY) return true;
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Send email via Resend API */
async function sendViaResend({ to, subject, text, html, replyTo }: EmailOptions): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);

    const fromName = process.env.SMTP_FROM_NAME?.trim() || "PickUsAWinner";
    const fromEmail = process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim() || "noreply@pickusawinner.com";
    const from = `${fromName} <${fromEmail}>`;

    try {
        const { error } = await resend.emails.send({
            from,
            to,
            subject,
            html: html || text.replace(/\n/g, "<br>"),
            text,
            ...(replyTo ? { replyTo } : {}),
        });

        if (error) {
            console.error(`[RESEND] Failed to send email to ${to}:`, error.message);
            return false;
        }

        console.log(`[RESEND] Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[RESEND] Error sending email to ${to}:`, err.message);
        return false;
    }
}

async function ensureTransportVerified(emailTransporter: nodemailer.Transporter): Promise<boolean> {
    if (isTransportVerified) {
        return true;
    }

    if (!verifyPromise) {
        verifyPromise = emailTransporter.verify().then(() => {
            isTransportVerified = true;
            console.log("[EMAIL] SMTP connection verified successfully");
        }).catch((error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error("[EMAIL] SMTP verification failed:", err.message);
            resetTransporter(`verify error: ${err.message}`);
            throw err;
        }).finally(() => {
            verifyPromise = null;
        });
    }

    try {
        await verifyPromise;
        return true;
    } catch {
        return false;
    }
}

function shouldRetryWithAuthSender(errorMessage: string): boolean {
    const msg = errorMessage.toLowerCase();
    return (
        msg.includes("sender address rejected") ||
        msg.includes("mail from command failed") ||
        msg.includes("from address") ||
        msg.includes("sender rejected")
    );
}

function shouldResetTransportOnError(errorMessage: string): boolean {
    const msg = errorMessage.toLowerCase();
    return (
        msg.includes("econnreset") ||
        msg.includes("etimedout") ||
        msg.includes("connection closed") ||
        msg.includes("socket closed") ||
        msg.includes("greeting never received")
    );
}

function quoteDisplayName(name: string): string {
    const sanitized = name.replace(/"/g, "").trim();
    return `"${sanitized}"`;
}

function maskEmail(email: string | undefined): string | null {
    if (!email) return null;
    const trimmed = email.trim();
    const atIndex = trimmed.indexOf("@");
    if (atIndex <= 1) return "***";
    return `${trimmed[0]}***${trimmed.slice(atIndex - 1)}`;
}

export async function checkEmailHealth(): Promise<EmailHealthStatus> {
    const smtpHost = process.env.SMTP_HOST?.trim() || null;
    const smtpPort = process.env.SMTP_PORT?.trim() || null;
    const smtpUser = process.env.SMTP_USER?.trim() || "";
    const smtpFrom = process.env.SMTP_FROM?.trim() || null;
    const secure = process.env.SMTP_SECURE === "true" || smtpPort === "465";

    if (!isEmailConfigured()) {
        return {
            configured: false,
            verified: false,
            smtp: {
                host: smtpHost,
                port: smtpPort,
                secure,
                userMasked: maskEmail(smtpUser || undefined),
                from: smtpFrom,
                fromMatchesUser: !!(smtpFrom && smtpUser && smtpFrom === smtpUser),
            },
            error: "Missing required SMTP env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).",
        };
    }

    const emailTransporter = getTransporter();
    if (!emailTransporter) {
        return {
            configured: true,
            verified: false,
            smtp: {
                host: smtpHost,
                port: smtpPort,
                secure,
                userMasked: maskEmail(smtpUser || undefined),
                from: smtpFrom,
                fromMatchesUser: !!(smtpFrom && smtpUser && smtpFrom === smtpUser),
            },
            error: "Transporter could not be created.",
        };
    }

    const verified = await ensureTransportVerified(emailTransporter);
    return {
        configured: true,
        verified,
        smtp: {
            host: smtpHost,
            port: smtpPort,
            secure,
            userMasked: maskEmail(smtpUser || undefined),
            from: smtpFrom,
            fromMatchesUser: !!(smtpFrom && smtpUser && smtpFrom === smtpUser),
        },
        ...(verified ? {} : { error: "SMTP connection/auth verification failed. Check host, port, user, password, and sender." }),
    };
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    // Prefer Resend if API key is configured
    if (process.env.RESEND_API_KEY) {
        return sendViaResend(options);
    }
    return sendViaSMTP(options);
}

async function sendViaSMTP({ to, subject, text, html, replyTo }: EmailOptions): Promise<boolean> {
    const emailTransporter = getTransporter();

    if (!emailTransporter) {
        console.warn(`[EMAIL] Cannot send email - SMTP not configured. Would send to: ${to}`);
        console.warn(`[EMAIL] Subject: ${subject}`);
        return false;
    }

    try {
        const smtpUser = process.env.SMTP_USER || "";
        const configuredFrom = process.env.SMTP_FROM?.trim();
        const fromName = process.env.SMTP_FROM_NAME?.trim();
        const defaultReplyTo = process.env.SMTP_REPLY_TO?.trim();
        const fromEmail = configuredFrom || smtpUser || "noreply@pickusawinner.com";
        const formattedFrom = fromName ? `${quoteDisplayName(fromName)} <${fromEmail}>` : fromEmail;
        const effectiveReplyTo = replyTo || defaultReplyTo;

        const verified = await ensureTransportVerified(emailTransporter);
        if (!verified) {
            console.error("[EMAIL] SMTP verification failed. Email was not sent.");
            resetTransporter("verification failed");
            return false;
        }

        const buildMailOptions = (from: string) => ({
            from: from === fromEmail ? formattedFrom : (fromName ? `${quoteDisplayName(fromName)} <${from}>` : from),
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, "<br>"), // Simple HTML conversion if no HTML provided
            ...(effectiveReplyTo && { replyTo: effectiveReplyTo }),
        });

        let info;
        try {
            info = await emailTransporter.sendMail(buildMailOptions(fromEmail));
        } catch (firstError) {
            const firstErr = firstError instanceof Error ? firstError : new Error(String(firstError));
            if (configuredFrom && smtpUser && configuredFrom !== smtpUser && shouldRetryWithAuthSender(firstErr.message)) {
                console.warn(`[EMAIL] SMTP_FROM '${configuredFrom}' was rejected. Retrying with SMTP_USER '${smtpUser}'.`);
                info = await emailTransporter.sendMail(buildMailOptions(smtpUser));
            } else {
                throw firstErr;
            }
        }

        console.log(`[EMAIL] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[EMAIL] Failed to send email to ${to}:`, err.message);
        if (shouldResetTransportOnError(err.message)) {
            resetTransporter(`transport error: ${err.message}`);
        }
        if (err.message?.includes("Invalid login") || err.message?.includes("authentication")) {
            console.error("[EMAIL] Hint: For iCloud, use an App-Specific Password from appleid.apple.com");
        }
        return false;
    }
}
