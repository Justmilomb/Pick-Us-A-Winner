import nodemailer from "nodemailer";

export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

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
        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort, 10),
            secure: process.env.SMTP_SECURE === "true" || smtpPort === "465",
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        console.log(`[EMAIL] SMTP transporter configured for ${smtpHost}:${smtpPort}`);
        return transporter;
    } catch (error) {
        console.error("[EMAIL] Failed to create transporter:", error);
        return null;
    }
}

export async function sendEmail({ to, subject, text, html, replyTo }: EmailOptions): Promise<boolean> {
    const emailTransporter = getTransporter();

    if (!emailTransporter) {
        console.warn(`[EMAIL] Cannot send email - SMTP not configured. Would send to: ${to}`);
        console.warn(`[EMAIL] Subject: ${subject}`);
        return false;
    }

    try {
        const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@giveaway-engine.com";

        const mailOptions = {
            from: fromEmail,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, "<br>"), // Simple HTML conversion if no HTML provided
            ...(replyTo && { replyTo }),
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`[EMAIL] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] Failed to send email to ${to}:`, error);
        return false;
    }
}
