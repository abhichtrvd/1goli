# 1goli Admin Panel - Complete Setup Guide

This guide will help you complete the setup and initialization of your comprehensive admin panel.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Initialize Default Data](#initialize-default-data)
3. [Configure Services](#configure-services)
4. [Verify Installation](#verify-installation)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Deploy Schema and Functions

```bash
# Ensure all backend functions are deployed
npx convex dev --once
```

This will deploy all tables, indexes, and backend functions to Convex.

### 2. Start Development Server

```bash
npm run dev
```

The admin panel will be available at: `http://localhost:5173/admin`

---

## 🎯 Initialize Default Data

After deploying the schema, you need to initialize default data for several features. Navigate to the admin panel and run initialization for each module:

### 1. **Initialize Roles & Permissions** (REQUIRED)

Navigate to: **Admin Panel → Roles & Permissions** (`/admin/roles`)

- Click **"Initialize Default Roles"** button
- This creates 5 system roles:
  - Super Admin (full access)
  - Admin (most permissions)
  - Manager (order & product management)
  - Staff (customer support)
  - Customer (customer portal)
- Creates 30+ granular permissions across 9 categories

**Status:** Required for RBAC functionality

### 2. **Initialize Integration Marketplace**

Navigate to: **Admin Panel → Integrations** (`/admin/integrations`)

- Click **"Initialize Marketplace"** button
- This creates 18 pre-defined integrations:
  - Payment: Stripe, Razorpay, PayPal
  - Shipping: FedEx, UPS, DHL, ShipStation
  - Email: SendGrid, AWS SES, Mailgun
  - SMS: Twilio, Plivo
  - Analytics: Google Analytics, Mixpanel
  - CRM: Salesforce, HubSpot
  - Accounting: QuickBooks, Xero

**Status:** Optional (can initialize when needed)

### 3. **Initialize Notification Templates**

Navigate to: **Admin Panel → Templates** (`/admin/templates`)

- The system will prompt to create default templates
- Pre-built templates include:
  - Order Confirmation
  - Shipping Update
  - Welcome Email
  - Password Reset
  - Low Stock Alert
  - Prescription Approval
  - Review Request
  - Refund Processed

**Status:** Recommended for communication features

### 4. **Check Initialization Status**

Run this in Convex dashboard or via API:

```typescript
// This checks what's initialized
await api.initialize.checkInitializationStatus({});
```

---

## 🔧 Configure Services

### Email Services (Optional)

Configure email services for sending transactional and marketing emails.

#### Option 1: SendGrid (Recommended)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key with "Mail Send" permissions
3. Navigate to: **Admin Panel → Integrations**
4. Find "SendGrid" and click "Install"
5. Enter your API key
6. Click "Test Connection"

#### Option 2: AWS SES

1. Create AWS account and enable SES
2. Verify your domain/email
3. Create IAM credentials with SES permissions
4. Navigate to: **Admin Panel → Integrations**
5. Find "AWS SES" and click "Install"
6. Enter Access Key ID and Secret Access Key

#### Option 3: Mailgun

1. Sign up at [mailgun.com](https://mailgun.com)
2. Get API key from dashboard
3. Navigate to: **Admin Panel → Integrations**
4. Find "Mailgun" and click "Install"
5. Enter your API key and domain

**Integration in Code:**

Update `/home/daytona/codebase/src/convex/campaigns.ts` - `sendCampaign` action:

```typescript
// Replace mock implementation with actual email sending
const sendgridConfig = await getIntegration(ctx, "sendgrid");
if (sendgridConfig?.config?.apiKey) {
  // Use SendGrid API
  await sendWithSendGrid(sendgridConfig.config.apiKey, {
    to: recipient.email,
    subject: campaign.subject,
    content: campaign.content
  });
}
```

---

### SMS Services (Optional)

Configure SMS services for sending notifications.

#### Twilio (Recommended)

1. Sign up at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Navigate to: **Admin Panel → Integrations**
5. Find "Twilio" and click "Install"
6. Enter Account SID and Auth Token
7. Click "Test Connection"

**Integration in Code:**

Update workflow actions and campaign sending to use Twilio:

```typescript
// In workflows.ts or campaigns.ts
const twilioConfig = await getIntegration(ctx, "twilio");
if (twilioConfig?.config?.accountSid) {
  await sendSMSWithTwilio({
    accountSid: twilioConfig.config.accountSid,
    authToken: twilioConfig.config.authToken,
    from: twilioConfig.config.phoneNumber,
    to: recipient.phone,
    body: message
  });
}
```

---

### Payment Gateways (Required for Orders)

#### Stripe

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys (Publishable and Secret)
3. Navigate to: **Admin Panel → Integrations**
4. Find "Stripe" and click "Install"
5. Enter Publishable Key and Secret Key
6. OR use Settings: **Admin Panel → Settings** → Payment Settings

#### Razorpay (for India)

1. Create account at [razorpay.com](https://razorpay.com)
2. Get Key ID and Key Secret
3. Navigate to: **Admin Panel → Integrations**
4. Find "Razorpay" and click "Install"
5. Enter Key ID and Key Secret
6. OR use Settings: **Admin Panel → Settings** → Payment Settings

---

### Shipping Carriers (Optional)

Configure shipping integrations for automatic tracking and label printing.

#### FedEx / UPS / DHL

1. Create developer account with carrier
2. Get API credentials
3. Navigate to: **Admin Panel → Integrations**
4. Find your carrier and click "Install"
5. Enter API credentials
6. Configure webhook URLs

---

### Analytics (Recommended)

#### Google Analytics

1. Create GA4 property
2. Get Measurement ID
3. Navigate to: **Admin Panel → Integrations**
4. Find "Google Analytics" and click "Install"
5. Enter Measurement ID

---

## ✅ Verify Installation

### 1. Check All Pages Load

Visit each admin page to ensure they load without errors:

- ✓ Dashboard: `/admin`
- ✓ Products: `/admin/products`
- ✓ Orders: `/admin/orders`
- ✓ Users: `/admin/users`
- ✓ Doctors: `/admin/doctors`
- ✓ Prescriptions: `/admin/prescriptions`
- ✓ Reviews: `/admin/reviews`
- ✓ Roles & Permissions: `/admin/roles`
- ✓ Team Management: `/admin/team`
- ✓ Backup & Restore: `/admin/backup`
- ✓ Optimization: `/admin/optimization`
- ✓ Reports: `/admin/reports`
- ✓ Workflows: `/admin/workflows`
- ✓ Rules: `/admin/rules`
- ✓ Integrations: `/admin/integrations`
- ✓ Campaigns: `/admin/campaigns`
- ✓ Templates: `/admin/templates`
- ✓ Messages: `/admin/messages`
- ✓ Activity Feed: `/admin/activity-feed`
- ✓ Settings: `/admin/settings`
- ✓ Audit Logs: `/admin/audit-logs`

### 2. Test Core Features

1. **Create a Product**
   - Navigate to Products
   - Click "Add Product"
   - Fill in details and save

2. **Create an Order** (manual)
   - Navigate to Orders
   - Click "Create Order"
   - Select customer and products

3. **Send a Test Campaign**
   - Navigate to Campaigns
   - Click "Create Campaign"
   - Choose "All Users" audience
   - Use test template
   - Click "Send Now"

4. **Create a Workflow**
   - Navigate to Workflows
   - Click "Create Workflow"
   - Select trigger: "order.created"
   - Add action: "send_email"
   - Test workflow

5. **Generate a Report**
   - Navigate to Reports
   - Click "Create Report"
   - Select data source: "Orders"
   - Choose columns
   - Click "Run Report"

### 3. Check Database Health

Navigate to: **Admin Panel → Optimization**

- View table sizes
- Check for orphaned records
- Review database statistics

### 4. Create Backup

Navigate to: **Admin Panel → Backup & Restore**

- Click "Create Backup"
- Backup will download automatically
- Verify backup file exists

---

## 🔍 Troubleshooting

### Issue: "Initialize Default Roles" button doesn't work

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Ensure Convex functions are deployed: `npx convex dev --once`
4. Manually call the mutation:
   ```typescript
   await api.roles.initializeDefaultRoles({});
   ```

### Issue: Pages load slowly

**Solution:**
1. Check database indexes are created
2. Review query performance in Convex dashboard
3. Navigate to Optimization page for insights

### Issue: Integration test fails

**Solution:**
1. Verify API keys are correct
2. Check API key permissions (read/write)
3. Ensure integration service is active
4. Check for IP whitelisting requirements

### Issue: Email campaigns don't send

**Solution:**
1. Ensure email integration is installed and active
2. Check integration configuration
3. Verify email templates exist
4. Check campaign status and logs

### Issue: Workflows don't trigger

**Solution:**
1. Ensure workflow is enabled
2. Check trigger conditions match event
3. Add trigger calls to mutations (see `WORKFLOW_INTEGRATION_EXAMPLES.md`)
4. Review execution history for errors

---

## 📚 Additional Resources

### Documentation Files

- `SYSTEM_WIDE_FEATURES_SUMMARY.md` - RBAC, Team, Backup, Optimization
- `REPORTS_IMPLEMENTATION.md` - Custom reports and scheduling
- `WORKFLOW_RULE_ENGINE_IMPLEMENTATION.md` - Automation and rules
- `WORKFLOW_INTEGRATION_EXAMPLES.md` - How to integrate workflows
- `USER_MANAGEMENT_ENHANCEMENT_SUMMARY.md` - Advanced user features

### API Reference

All backend functions are documented with TypeScript types. Check:
- `/src/convex/*.ts` for backend API
- Function signatures in Convex dashboard

### Support

For issues or questions:
1. Check documentation files
2. Review Convex dashboard logs
3. Check browser console for frontend errors
4. Review audit logs in admin panel

---

## 🎉 Congratulations!

Your admin panel is now fully set up with:
- ✅ 20+ admin pages
- ✅ RBAC with 5 roles and 30+ permissions
- ✅ Complete order management
- ✅ User and team management
- ✅ Workflow automation
- ✅ Custom report builder
- ✅ Communication tools
- ✅ Integration marketplace
- ✅ Backup and optimization tools
- ✅ Advanced analytics (ready for implementation)

**Next Steps:**
1. Invite team members
2. Configure payment gateways
3. Set up email/SMS services
4. Create your first automated workflow
5. Schedule regular backups
6. Build custom reports for your business

Enjoy your powerful admin panel! 🚀
