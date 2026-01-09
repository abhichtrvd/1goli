# Settings Feature Structure

## Visual Layout in Admin Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Settings Page - Admin Panel                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. General Information                                   │ │
│ │   - Site Name                                            │ │
│ │   - Support Email                                        │ │
│ │   - Support Phone                                        │ │
│ │   - Address                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2. Logo & Branding                           ✅ NEW      │ │
│ │   - Upload Logo (Image file input)                      │ │
│ │   - Preview (20x20 border rounded)                      │ │
│ │   - Remove Logo button                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 3. Email Server Configuration                ✅ NEW      │ │
│ │   - SMTP Host                                            │ │
│ │   - SMTP Port                                            │ │
│ │   - SMTP Username                                        │ │
│ │   - SMTP Password (with show/hide toggle)               │ │
│ │   - From Email Address                                   │ │
│ │   - From Name                                            │ │
│ │   - [Send Test Email] button                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 4. API Key Management                        ✅ NEW      │ │
│ │                                                          │ │
│ │   Existing Keys:                                         │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ 🔑 Stripe API                          [Trash]   │  │ │
│ │   │    sk_test_abc123...                              │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ 🔑 SendGrid Key                        [Trash]   │  │ │
│ │   │    SG.abc123def456...                             │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │   Add New API Key:                                       │ │
│ │   [Label Input]  [Key Input]  [+ Add API Key]           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 5. Webhook Configuration                     ✅ NEW      │ │
│ │   - Order Created    [URL Input]           [Test]       │ │
│ │   - Order Shipped    [URL Input]           [Test]       │ │
│ │   - Order Delivered  [URL Input]           [Test]       │ │
│ │   - User Registered  [URL Input]           [Test]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 6. Security Settings                         ✅ NEW      │ │
│ │                                                          │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ Two-Factor Authentication (2FA)      [Toggle]    │  │ │
│ │   │ Require 2FA for admin accounts                   │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │   IP Whitelist:                                          │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ 192.168.1.1                                      │  │ │
│ │   │ 10.0.0.1                                         │  │ │
│ │   │ (one per line)                                   │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │   Session Timeout (min):  [___] (5-1440)                │ │
│ │   Password Change (days): [___] (0-365)                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [... existing sections: Hero, Social Media, Shipping, etc] │
│                                                              │
│                              [💾 Save Changes]              │
└─────────────────────────────────────────────────────────────┘
```

## File Organization

```
codebase/
├── src/
│   ├── convex/
│   │   ├── schema.ts           ✏️  Modified - Added new settings fields
│   │   └── settings.ts         ✏️  Modified - Added mutations
│   │
│   ├── lib/
│   │   └── fileUpload.ts       ✅  Created - File upload utilities
│   │
│   └── pages/admin/
│       ├── AdminSettings.tsx   ✏️  Modified - Added 5 new card sections
│       │
│       └── hooks/
│           └── useAdminSettings.ts  ✏️  Modified - Extended form state
│
└── Documentation/
    ├── SETTINGS_FEATURES_SUMMARY.md    ✅  Created - Technical overview
    ├── SETTINGS_USER_GUIDE.md          ✅  Created - End-user guide
    └── SETTINGS_STRUCTURE.md           ✅  Created - This file
```

## Data Flow

```
┌──────────────┐
│   User       │
│   Action     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│   AdminSettings.tsx              │
│   - Handles user interactions     │
│   - File uploads                  │
│   - Button clicks                 │
│   - Form inputs                   │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   useAdminSettings.ts            │
│   - Form state management         │
│   - Validation                    │
│   - Submit handler                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Convex Mutations               │
│   - updateSettings()              │
│   - generateUploadUrl()           │
│   - sendTestEmail()               │
│   - testWebhook()                 │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Database (siteSettings)        │
│   - All settings persisted        │
│   - Files stored in _storage      │
└──────────────────────────────────┘
```

## Component Hierarchy

```
AdminSettings
├── General Information Card (existing)
├── Logo & Branding Card (NEW)
│   ├── File Input
│   ├── Logo Preview
│   └── Remove Button
├── Email Server Card (NEW)
│   ├── SMTP Fields (6 inputs)
│   └── Send Test Email Button
├── API Key Management Card (NEW)
│   ├── API Key List
│   │   └── API Key Item (label, key, delete button)
│   └── Add API Key Form
│       ├── Label Input
│       ├── Key Input
│       └── Add Button
├── Webhook Configuration Card (NEW)
│   ├── Order Created Webhook
│   ├── Order Shipped Webhook
│   ├── Order Delivered Webhook
│   └── User Registered Webhook
│       └── Each: URL Input + Test Button
├── Security Settings Card (NEW)
│   ├── 2FA Toggle Switch
│   ├── IP Whitelist Textarea
│   ├── Session Timeout Input
│   └── Password Change Interval Input
├── Hero Section Card (existing)
├── Quick Actions Section (existing)
├── Health Concerns Section (existing)
├── Featured Brands Card (existing)
├── Social Media Card (existing)
├── Shipping & Delivery Card (existing)
├── Payment Settings Card (existing)
├── Tax & Currency Card (existing)
├── System Status Card (existing)
├── Feature Cards Section (existing)
└── Save Changes Button
```

## State Management

```typescript
// Form State Structure
SettingsFormState {
  // Existing fields...
  
  // NEW: Logo/Branding
  logoUrl?: string
  logoStorageId?: string | null
  
  // NEW: Email Configuration
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPassword?: string
  smtpFromAddress?: string
  smtpFromName?: string
  
  // NEW: API Keys
  apiKeys?: Array<{
    label: string
    key: string
    createdAt: number
  }>
  
  // NEW: Webhooks
  webhooks?: {
    orderCreated?: string
    orderShipped?: string
    orderDelivered?: string
    userRegistered?: string
  }
  
  // NEW: Security
  enable2FA?: boolean
  ipWhitelist?: string[]
  sessionTimeout?: number
  passwordChangeInterval?: number
}
```

## Icons Used

- 📤 Upload - Logo upload
- ✖️ X - Remove logo
- 👁️ Eye / EyeOff - Show/hide password
- ➕ Plus - Add API key
- 🗑️ Trash2 - Delete API key
- 🔑 Key - API key icon
- 📧 Send - Send test email
- 🔄 Loader2 - Loading spinner

## Color Scheme

- Primary actions: Default button style
- Destructive actions: Red/destructive variant
- Secondary actions: Outline variant
- Disabled state: Reduced opacity
- Error states: Red border/text
- Success states: Green toast notifications
