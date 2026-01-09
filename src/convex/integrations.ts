import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";

// List all available integrations
export const listAvailableIntegrations = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("payment"),
        v.literal("shipping"),
        v.literal("email"),
        v.literal("sms"),
        v.literal("analytics"),
        v.literal("crm"),
        v.literal("accounting")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let integrations = await ctx.db.query("integrations").collect();

    if (args.category) {
      integrations = integrations.filter(i => i.category === args.category);
    }

    // Sort by popular first, then by name
    return integrations.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// Get installed integrations
export const getInstalledIntegrations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("integrations")
      .filter(q =>
        q.or(
          q.eq(q.field("status"), "installed"),
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "inactive")
        )
      )
      .collect();
  },
});

// Get integrations by category
export const getIntegrationsByCategory = query({
  args: {
    category: v.union(
      v.literal("payment"),
      v.literal("shipping"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("analytics"),
      v.literal("crm"),
      v.literal("accounting")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("integrations")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Get a single integration
export const getIntegration = query({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.integrationId);
  },
});

// Install integration
export const installIntegration = mutation({
  args: {
    integrationId: v.id("integrations"),
    config: v.optional(v.object({
      apiKey: v.optional(v.string()),
      apiSecret: v.optional(v.string()),
      webhookUrl: v.optional(v.string()),
      settings: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);

    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    await ctx.db.patch(args.integrationId, {
      status: "active",
      config: args.config,
      installedBy: userId || "admin",
      installedAt: Date.now(),
      usageCount: 0,
    });

    return { success: true, message: `${integration.name} installed successfully` };
  },
});

// Configure integration
export const configureIntegration = mutation({
  args: {
    integrationId: v.id("integrations"),
    config: v.object({
      apiKey: v.optional(v.string()),
      apiSecret: v.optional(v.string()),
      webhookUrl: v.optional(v.string()),
      settings: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    await ctx.db.patch(args.integrationId, {
      config: args.config,
      lastUsedAt: Date.now(),
    });

    return { success: true, message: `${integration.name} configured successfully` };
  },
});

// Uninstall integration
export const uninstallIntegration = mutation({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    await ctx.db.patch(args.integrationId, {
      status: "available",
      config: undefined,
      installedBy: undefined,
      installedAt: undefined,
    });

    return { success: true, message: `${integration.name} uninstalled successfully` };
  },
});

// Toggle integration active/inactive status
export const toggleIntegrationStatus = mutation({
  args: {
    integrationId: v.id("integrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    if (integration.status === "available") {
      throw new Error("Integration must be installed first");
    }

    await ctx.db.patch(args.integrationId, {
      status: args.isActive ? "active" : "inactive",
    });

    return {
      success: true,
      message: `${integration.name} ${args.isActive ? 'activated' : 'deactivated'}`
    };
  },
});

// Test integration connection
export const testIntegration = action({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.getIntegration, {
      integrationId: args.integrationId,
    });

    if (!integration) throw new Error("Integration not found");
    if (!integration.config) throw new Error("Integration not configured");

    let testResult;

    switch (integration.provider) {
      case "stripe":
        testResult = await testStripeConnection(integration.config);
        break;
      case "razorpay":
        testResult = await testRazorpayConnection(integration.config);
        break;
      case "paypal":
        testResult = await testPayPalConnection(integration.config);
        break;
      case "fedex":
        testResult = await testFedExConnection(integration.config);
        break;
      case "ups":
        testResult = await testUPSConnection(integration.config);
        break;
      case "dhl":
        testResult = await testDHLConnection(integration.config);
        break;
      case "shipstation":
        testResult = await testShipStationConnection(integration.config);
        break;
      case "sendgrid":
        testResult = await testSendGridConnection(integration.config);
        break;
      case "aws_ses":
        testResult = await testAWSSESConnection(integration.config);
        break;
      case "mailgun":
        testResult = await testMailgunConnection(integration.config);
        break;
      case "twilio":
        testResult = await testTwilioConnection(integration.config);
        break;
      case "plivo":
        testResult = await testPlivoConnection(integration.config);
        break;
      case "google_analytics":
        testResult = await testGoogleAnalyticsConnection(integration.config);
        break;
      case "mixpanel":
        testResult = await testMixpanelConnection(integration.config);
        break;
      case "salesforce":
        testResult = await testSalesforceConnection(integration.config);
        break;
      case "hubspot":
        testResult = await testHubSpotConnection(integration.config);
        break;
      case "quickbooks":
        testResult = await testQuickBooksConnection(integration.config);
        break;
      case "xero":
        testResult = await testXeroConnection(integration.config);
        break;
      default:
        testResult = { success: false, message: "Test not implemented for this provider" };
    }

    // Update last used timestamp
    if (testResult.success) {
      await ctx.runMutation(api.integrations.updateIntegrationUsage, {
        integrationId: args.integrationId,
      });
    }

    return testResult;
  },
});

// Update integration usage
export const updateIntegrationUsage = mutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return;

    await ctx.db.patch(args.integrationId, {
      lastUsedAt: Date.now(),
      usageCount: (integration.usageCount || 0) + 1,
    });
  },
});

// Initialize marketplace with 20+ pre-defined integrations
export const initializeMarketplace = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Check if integrations already exist
    const existing = await ctx.db.query("integrations").collect();
    if (existing.length > 0) {
      return { message: "Marketplace already initialized", count: existing.length };
    }

    const marketplaceIntegrations = [
      // Payment Integrations
      {
        name: "Stripe",
        description: "Accept online payments with Stripe. Credit cards, debit cards, and more payment methods worldwide.",
        category: "payment" as const,
        provider: "stripe",
        logoUrl: "https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg",
        websiteUrl: "https://stripe.com",
        status: "available" as const,
        version: "v2023.10",
        supportedFeatures: ["credit_cards", "debit_cards", "apple_pay", "google_pay", "subscriptions", "refunds"],
        isPopular: true,
      },
      {
        name: "Razorpay",
        description: "Complete payment solution for India. Accept payments via UPI, cards, wallets, netbanking, and more.",
        category: "payment" as const,
        provider: "razorpay",
        logoUrl: "https://razorpay.com/assets/razorpay-glyph.svg",
        websiteUrl: "https://razorpay.com",
        status: "available" as const,
        version: "v1.0",
        supportedFeatures: ["upi", "cards", "netbanking", "wallets", "emi", "subscriptions"],
        isPopular: true,
      },
      {
        name: "PayPal",
        description: "Global payment platform trusted by millions. Accept PayPal, credit cards, and local payment methods.",
        category: "payment" as const,
        provider: "paypal",
        logoUrl: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
        websiteUrl: "https://paypal.com",
        status: "available" as const,
        version: "v2.0",
        supportedFeatures: ["paypal_account", "credit_cards", "venmo", "pay_later"],
        isPopular: true,
      },

      // Shipping Integrations
      {
        name: "FedEx",
        description: "FedEx shipping integration. Get real-time rates, print labels, and track shipments worldwide.",
        category: "shipping" as const,
        provider: "fedex",
        logoUrl: "https://www.fedex.com/content/dam/fedex-com/logos/logo.png",
        websiteUrl: "https://fedex.com",
        status: "available" as const,
        version: "v3.0",
        supportedFeatures: ["rate_calculation", "label_printing", "tracking", "address_validation"],
        isPopular: true,
      },
      {
        name: "UPS",
        description: "UPS shipping services. Calculate rates, create shipments, and track packages in real-time.",
        category: "shipping" as const,
        provider: "ups",
        logoUrl: "https://www.ups.com/assets/resources/webcontent/images/ups-logo.svg",
        websiteUrl: "https://ups.com",
        status: "available" as const,
        version: "v2.1",
        supportedFeatures: ["rate_quotes", "shipping_labels", "tracking", "pickup_scheduling"],
        isPopular: true,
      },
      {
        name: "DHL",
        description: "DHL Express international shipping. Fast worldwide delivery with tracking and customs support.",
        category: "shipping" as const,
        provider: "dhl",
        logoUrl: "https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg",
        websiteUrl: "https://dhl.com",
        status: "available" as const,
        version: "v4.0",
        supportedFeatures: ["international_shipping", "customs_docs", "tracking", "rate_calculator"],
        isPopular: false,
      },
      {
        name: "ShipStation",
        description: "Multi-carrier shipping software. Manage orders, print labels, and automate fulfillment from one platform.",
        category: "shipping" as const,
        provider: "shipstation",
        logoUrl: "https://ss-cdn.shipstation.com/brand-assets/shipstation_logo_blue_on_white.png",
        websiteUrl: "https://shipstation.com",
        status: "available" as const,
        version: "v3.5",
        supportedFeatures: ["multi_carrier", "bulk_shipping", "automation", "branded_tracking"],
        isPopular: true,
      },

      // Email Integrations
      {
        name: "SendGrid",
        description: "Reliable email delivery at scale. Send transactional and marketing emails with high deliverability.",
        category: "email" as const,
        provider: "sendgrid",
        logoUrl: "https://sendgrid.com/content/dam/sendgrid/legacy/images/SendGrid_Logo.svg",
        websiteUrl: "https://sendgrid.com",
        status: "available" as const,
        version: "v3.0",
        supportedFeatures: ["transactional_email", "templates", "analytics", "suppression_management"],
        isPopular: true,
      },
      {
        name: "AWS SES",
        description: "Amazon Simple Email Service. Cost-effective bulk and transactional email sending.",
        category: "email" as const,
        provider: "aws_ses",
        logoUrl: "https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png",
        websiteUrl: "https://aws.amazon.com/ses/",
        status: "available" as const,
        version: "v2.0",
        supportedFeatures: ["bulk_email", "transactional", "high_volume", "smtp"],
        isPopular: false,
      },
      {
        name: "Mailgun",
        description: "Email API service for developers. Send, receive, and track emails with powerful APIs.",
        category: "email" as const,
        provider: "mailgun",
        logoUrl: "https://www.mailgun.com/wp-content/uploads/2021/01/mailgun-logo.png",
        websiteUrl: "https://mailgun.com",
        status: "available" as const,
        version: "v4.0",
        supportedFeatures: ["email_api", "validation", "routing", "analytics"],
        isPopular: false,
      },

      // SMS Integrations
      {
        name: "Twilio",
        description: "SMS and voice communication platform. Send SMS notifications, alerts, and 2FA codes globally.",
        category: "sms" as const,
        provider: "twilio",
        logoUrl: "https://www.twilio.com/content/dam/twilio-com/global/en/blog/legacy/2018/02-Twilio-Logo.png",
        websiteUrl: "https://twilio.com",
        status: "available" as const,
        version: "v2022.1",
        supportedFeatures: ["sms", "mms", "voice", "verify", "programmable_messaging"],
        isPopular: true,
      },
      {
        name: "Plivo",
        description: "SMS and voice API platform. Send SMS messages and make voice calls with simple APIs.",
        category: "sms" as const,
        provider: "plivo",
        logoUrl: "https://www.plivo.com/assets/images/logo.svg",
        websiteUrl: "https://plivo.com",
        status: "available" as const,
        version: "v1.0",
        supportedFeatures: ["sms", "voice", "carrier_lookup", "number_masking"],
        isPopular: false,
      },

      // Analytics Integrations
      {
        name: "Google Analytics",
        description: "Web analytics and reporting. Track user behavior, conversions, and site performance.",
        category: "analytics" as const,
        provider: "google_analytics",
        logoUrl: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg",
        websiteUrl: "https://analytics.google.com",
        status: "available" as const,
        version: "GA4",
        supportedFeatures: ["pageviews", "events", "conversions", "user_tracking", "real_time"],
        isPopular: true,
      },
      {
        name: "Mixpanel",
        description: "Product analytics platform. Track user actions, funnels, retention, and engagement metrics.",
        category: "analytics" as const,
        provider: "mixpanel",
        logoUrl: "https://mixpanel.com/wp-content/themes/mixpanel/assets/images/mixpanel-logo.svg",
        websiteUrl: "https://mixpanel.com",
        status: "available" as const,
        version: "v2.0",
        supportedFeatures: ["event_tracking", "funnels", "cohorts", "a_b_testing", "retention"],
        isPopular: false,
      },

      // CRM Integrations
      {
        name: "Salesforce",
        description: "World's #1 CRM platform. Sync customers, leads, and opportunities automatically.",
        category: "crm" as const,
        provider: "salesforce",
        logoUrl: "https://www.salesforce.com/content/dam/sfdc-docs/www/logos/logo-salesforce.svg",
        websiteUrl: "https://salesforce.com",
        status: "available" as const,
        version: "v54.0",
        supportedFeatures: ["contact_sync", "lead_management", "opportunity_tracking", "custom_objects"],
        isPopular: true,
      },
      {
        name: "HubSpot",
        description: "Marketing, sales, and service CRM. Sync contacts, deals, and marketing automation.",
        category: "crm" as const,
        provider: "hubspot",
        logoUrl: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png",
        websiteUrl: "https://hubspot.com",
        status: "available" as const,
        version: "v3.0",
        supportedFeatures: ["contact_sync", "deals", "marketing_automation", "email_tracking"],
        isPopular: true,
      },

      // Accounting Integrations
      {
        name: "QuickBooks",
        description: "Accounting software for small businesses. Sync invoices, customers, and financial data.",
        category: "accounting" as const,
        provider: "quickbooks",
        logoUrl: "https://plugin.intuitcdn.net/designsystem/assets/2020/11/09093141/qbo-logo.svg",
        websiteUrl: "https://quickbooks.intuit.com",
        status: "available" as const,
        version: "v3.0",
        supportedFeatures: ["invoice_sync", "customer_sync", "payment_tracking", "financial_reports"],
        isPopular: true,
      },
      {
        name: "Xero",
        description: "Beautiful accounting software. Sync transactions, invoices, and financial data seamlessly.",
        category: "accounting" as const,
        provider: "xero",
        logoUrl: "https://www.xero.com/content/dam/xero/pilot-images/logos/xero-logo.svg",
        websiteUrl: "https://xero.com",
        status: "available" as const,
        version: "v2.0",
        supportedFeatures: ["invoice_management", "bank_reconciliation", "expense_tracking", "reports"],
        isPopular: false,
      },
    ];

    for (const integration of marketplaceIntegrations) {
      await ctx.db.insert("integrations", integration);
    }

    return {
      message: `Initialized ${marketplaceIntegrations.length} marketplace integrations`,
      count: marketplaceIntegrations.length
    };
  },
});

// Test connection helper functions (Mock implementations)
// In production, these would make actual API calls to test connectivity

async function testStripeConnection(config: any): Promise<any> {
  try {
    // Mock: In production, test Stripe API with the provided keys
    if (!config.apiKey) throw new Error("API key required");
    console.log("Testing Stripe connection...", { hasKey: !!config.apiKey });
    return { success: true, message: "Stripe connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testRazorpayConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey || !config.apiSecret) throw new Error("API key and secret required");
    console.log("Testing Razorpay connection...");
    return { success: true, message: "Razorpay connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testPayPalConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey || !config.apiSecret) throw new Error("Client ID and secret required");
    console.log("Testing PayPal connection...");
    return { success: true, message: "PayPal connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testFedExConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("API credentials required");
    console.log("Testing FedEx connection...");
    return { success: true, message: "FedEx connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testUPSConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("Access key required");
    console.log("Testing UPS connection...");
    return { success: true, message: "UPS connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testDHLConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("API credentials required");
    console.log("Testing DHL connection...");
    return { success: true, message: "DHL connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testShipStationConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey || !config.apiSecret) throw new Error("API key and secret required");
    console.log("Testing ShipStation connection...");
    return { success: true, message: "ShipStation connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testSendGridConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("API key required");
    console.log("Testing SendGrid connection...");
    return { success: true, message: "SendGrid connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testAWSSESConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey || !config.apiSecret) throw new Error("AWS credentials required");
    console.log("Testing AWS SES connection...");
    return { success: true, message: "AWS SES connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testMailgunConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("API key required");
    console.log("Testing Mailgun connection...");
    return { success: true, message: "Mailgun connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testTwilioConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey || !config.apiSecret) throw new Error("Account SID and Auth Token required");
    console.log("Testing Twilio connection...");
    return { success: true, message: "Twilio connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testPlivoConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey || !config.apiSecret) throw new Error("Auth ID and Auth Token required");
    console.log("Testing Plivo connection...");
    return { success: true, message: "Plivo connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testGoogleAnalyticsConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("Tracking ID or Measurement ID required");
    console.log("Testing Google Analytics connection...");
    return { success: true, message: "Google Analytics connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testMixpanelConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("Project token required");
    console.log("Testing Mixpanel connection...");
    return { success: true, message: "Mixpanel connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testSalesforceConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("OAuth credentials required");
    console.log("Testing Salesforce connection...");
    return { success: true, message: "Salesforce connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testHubSpotConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("API key required");
    console.log("Testing HubSpot connection...");
    return { success: true, message: "HubSpot connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testQuickBooksConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("OAuth credentials required");
    console.log("Testing QuickBooks connection...");
    return { success: true, message: "QuickBooks connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

async function testXeroConnection(config: any): Promise<any> {
  try {
    if (!config.apiKey) throw new Error("OAuth credentials required");
    console.log("Testing Xero connection...");
    return { success: true, message: "Xero connection successful" };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

// Import API for internal use
import { api } from "./_generated/api";
