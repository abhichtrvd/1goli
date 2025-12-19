"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

export const createPaymentIntent = action({
  args: { amount: v.number(), currency: v.string() },
  handler: async (ctx, args) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return { error: "Stripe API key not configured" };
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20" as any, // Cast to any to avoid strict type mismatch with specific library versions
    });

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(args.amount * 100), // Stripe expects cents
        currency: args.currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error("Stripe error:", error);
      return { error: error.message || "Failed to create payment intent" };
    }
  },
});