import type { Express } from "express";
import type Stripe from "stripe";
import { log } from "../log";

interface PaymentRouteDeps {
  stripe: Stripe;
  redeemedPaymentIntents: Set<string>;
  generatePurchaseToken: (credits?: number) => string;
  getClientIP: (req: any) => string;
}

export function registerPaymentRoutes(app: Express, deps: PaymentRouteDeps): void {
  const { stripe, redeemedPaymentIntents, generatePurchaseToken, getClientIP } = deps;

  app.get("/api/config", (_req, res) => {
    res.json({
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  });

  app.post("/api/payment/create-intent", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== "string" || !url.includes("instagram.com")) {
        return res.status(400).json({ error: "Valid Instagram URL required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 250,
        currency: "gbp",
        automatic_payment_methods: { enabled: true },
        metadata: { url },
      });

      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      log(`Stripe Create Intent Error: ${error}`, "error");
      return res.status(500).json({
        error: "Failed to create payment. Please try again.",
      });
    }
  });

  app.post("/api/payment/confirm", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const ip = getClientIP(req);

      if (!paymentIntentId || typeof paymentIntentId !== "string") {
        return res.status(400).json({ error: "Payment intent ID required" });
      }

      if (redeemedPaymentIntents.has(paymentIntentId)) {
        return res.status(400).json({ error: "This payment has already been applied to your account." });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Payment hasn't completed yet. Please wait a moment and try again." });
      }

      redeemedPaymentIntents.add(paymentIntentId);

      const paymentToken = generatePurchaseToken(1);
      console.log(`[Payment] Verified Stripe payment ${paymentIntentId} from ${ip}`);

      return res.json({
        success: true,
        paymentToken,
      });
    } catch (error) {
      log(`Stripe Confirm Error: ${error}`, "error");
      return res.status(500).json({
        error: "Payment verification failed. Please try again.",
      });
    }
  });
}

