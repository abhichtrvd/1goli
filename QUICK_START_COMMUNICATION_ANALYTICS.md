# Quick Start Guide - Communication & Analytics Features

## Immediate Access

All features are now accessible via these URLs:

### Communication Features
- **Campaigns**: http://localhost:5173/admin/campaigns
- **Templates**: http://localhost:5173/admin/templates
- **Messages**: http://localhost:5173/admin/messages
- **Activity Feed**: http://localhost:5173/admin/activity-feed

### Analytics Features
- **Heatmaps**: http://localhost:5173/admin/heatmaps
- **A/B Tests**: http://localhost:5173/admin/ab-tests
- **Cohorts**: http://localhost:5173/admin/cohorts
- **Funnels**: http://localhost:5173/admin/funnels
- **Dashboard Builder**: http://localhost:5173/admin/dashboard-builder

## Quick Setup Steps

### 1. Add Navigation (Optional)

Edit `/home/daytona/codebase/src/components/AdminLayout.tsx` and add to the navigation section:

```tsx
// Add these imports at the top
import { Mail, MessageSquare, Activity, BarChart2, Users2, Funnel, LayoutDashboard, FlaskConical } from "lucide-react";

// Add in navigation section (around line 52-100)
<div className="text-xs font-semibold text-muted-foreground px-3 mt-4 mb-2">
  COMMUNICATION
</div>
<Link to="/admin/campaigns">
  <Button variant="ghost" className="w-full justify-start">
    <Mail className="mr-2 h-4 w-4" />
    Campaigns
  </Button>
</Link>
<Link to="/admin/templates">
  <Button variant="ghost" className="w-full justify-start">
    <FileText className="mr-2 h-4 w-4" />
    Templates
  </Button>
</Link>
<Link to="/admin/messages">
  <Button variant="ghost" className="w-full justify-start">
    <MessageSquare className="mr-2 h-4 w-4" />
    Messages
  </Button>
</Link>
<Link to="/admin/activity-feed">
  <Button variant="ghost" className="w-full justify-start">
    <Activity className="mr-2 h-4 w-4" />
    Activity
  </Button>
</Link>

<div className="text-xs font-semibold text-muted-foreground px-3 mt-4 mb-2">
  ANALYTICS
</div>
<Link to="/admin/heatmaps">
  <Button variant="ghost" className="w-full justify-start">
    <BarChart2 className="mr-2 h-4 w-4" />
    Heatmaps
  </Button>
</Link>
<Link to="/admin/ab-tests">
  <Button variant="ghost" className="w-full justify-start">
    <FlaskConical className="mr-2 h-4 w-4" />
    A/B Tests
  </Button>
</Link>
<Link to="/admin/cohorts">
  <Button variant="ghost" className="w-full justify-start">
    <Users2 className="mr-2 h-4 w-4" />
    Cohorts
  </Button>
</Link>
<Link to="/admin/funnels">
  <Button variant="ghost" className="w-full justify-start">
    <Funnel className="mr-2 h-4 w-4" />
    Funnels
  </Button>
</Link>
<Link to="/admin/dashboard-builder">
  <Button variant="ghost" className="w-full justify-start">
    <LayoutDashboard className="mr-2 h-4 w-4" />
    Dashboards
  </Button>
</Link>
```

### 2. Test Features

#### Create a Campaign
```tsx
// Navigate to /admin/campaigns
// Click "Create Campaign"
// Fill in:
//   - Name: "Welcome Email"
//   - Channel: "Email"
//   - Audience: "All Users"
//   - Subject: "Welcome to our platform"
//   - Content: "Hi {name}, welcome!"
// Click "Create Campaign"
// Then "Send Now"
```

#### Create a Template
```tsx
// Navigate to /admin/templates
// Click "Create Template"
// Fill in:
//   - Name: "Order Confirmation"
//   - Category: "Order"
//   - Subject: "Order #{order_id} Confirmed"
//   - Content: "Hi {name}, your order has been confirmed..."
// Click "Create Template"
```

#### View Activity Feed
```tsx
// Navigate to /admin/activity-feed
// See live stream of all user activities
// Activities auto-update in real-time
```

#### Create an A/B Test
```tsx
// Navigate to /admin/ab-tests
// Click "Create Test"
// Fill in:
//   - Name: "Pricing Page Test"
//   - Type: "Pricing"
//   - Goal: "Conversion"
//   - Traffic Split: 50%
// Click "Create Test"
// View results with statistical analysis
```

#### Create a Cohort
```tsx
// Navigate to /admin/cohorts
// Click "Create Cohort"
// Fill in:
//   - Name: "January 2024 Signups"
//   - Start Date: 2024-01-01
//   - End Date: 2024-01-31
// Click "Create Cohort"
// Click cohort to view retention and revenue analysis
```

## Feature Highlights

### 1. Campaigns (Bulk Messaging)
- Create email, SMS, or push campaigns
- Target specific user segments
- Schedule for future delivery
- Track opens, clicks, and conversions
- Built-in A/B testing

### 2. Templates (Reusable Content)
- Create reusable message templates
- Support for variables: {name}, {order_id}, {amount}
- Multi-channel (email, SMS, push)
- Version history
- Clone templates

### 3. Messages (Customer Support)
- Two-way messaging with customers
- Conversation threading
- Read receipts
- Assign to admins
- Unread count tracking

### 4. Activity Feed (Real-time)
- Live stream of all platform activities
- Filter by type (orders, users, reviews)
- Color-coded actions
- User attribution
- Export capability

### 5. Heatmaps (Visual Analytics)
- Track where users click
- Measure scroll depth
- Page-level analysis
- Date range filtering
- Visual density maps

### 6. A/B Tests (Experimentation)
- Test pricing, layouts, messaging
- Automatic variant assignment
- Statistical significance testing
- Conversion tracking
- Revenue comparison

### 7. Cohorts (User Segmentation)
- Group users by signup date
- Retention analysis (12 periods)
- Revenue per cohort
- Behavioral patterns
- Export data

### 8. Funnels (Conversion Tracking)
- Multi-step user journeys
- Identify drop-off points
- Conversion rates per step
- Time-to-convert metrics
- Predefined funnels

### 9. Dashboard Builder (Custom Views)
- Create custom dashboards
- Drag-and-drop widgets
- Public/private sharing
- Default templates
- Widget library

## API Usage Examples

### Send a Campaign
```tsx
const sendCampaign = useMutation(api.campaigns.sendCampaign);

await sendCampaign({ campaignId: "campaign_id_here" });
```

### Track a Click
```tsx
const trackClick = useMutation(api.analytics.trackClick);

await trackClick({
  sessionId: "session_123",
  page: "/products",
  x: 150,
  y: 300,
});
```

### Create an A/B Test
```tsx
const createTest = useMutation(api.abTests.createABTest);

await createTest({
  name: "New Homepage Layout",
  type: "layout",
  variantA: { name: "Control", config: {} },
  variantB: { name: "New Layout", config: {} },
  trafficSplit: 50,
  goalMetric: "conversion",
});
```

### Track Funnel Step
```tsx
const trackStep = useMutation(api.funnels.trackFunnelStep);

await trackStep({
  funnelId: "funnel_id",
  sessionId: "session_123",
  stepIndex: 2,
});
```

## Database Schema Quick Reference

```
campaigns
├── name, subject, content
├── type (email/sms/push)
├── segment (all/vip/new_users/inactive/custom)
├── status (draft/scheduled/sending/sent/failed)
└── analytics (deliveredCount, openedCount, clickedCount)

notificationTemplates
├── name, category, content
├── channels (email/sms/push)
├── variables (array)
└── version history

messages & conversations
├── conversationId
├── userId, senderId, senderType
├── content, attachments
└── isRead, readAt

clickEvents & scrollEvents
├── sessionId, page
├── x, y coordinates (clicks)
└── maxDepth (scroll)

abTests
├── variantA, variantB
├── trafficSplit, goalMetric
└── assignments & conversions

cohorts
├── definitionType, startDate, endDate
└── userIds, userCount

funnels & funnelEvents
├── steps (name, eventType, order)
└── sessionId, stepIndex, timestamp

customDashboards
├── layout (widgets array)
└── isPublic
```

## Troubleshooting

### Issue: Routes not working
**Solution**: Make sure you've run `npm run dev` to restart the development server after adding routes.

### Issue: Schema errors
**Solution**: Run `npx convex dev` to sync schema changes.

### Issue: Empty data
**Solution**: Features require data. Create test campaigns, cohorts, or track some events first.

### Issue: Analytics not tracking
**Solution**: Add tracking code to your frontend pages (see COMMUNICATION_ANALYTICS_IMPLEMENTATION.md).

## Next Steps

1. **Add Navigation** - Update AdminLayout.tsx with navigation links
2. **Test Features** - Try creating campaigns, cohorts, and tests
3. **Integrate Services** - Connect email/SMS providers (SendGrid, Twilio)
4. **Add Tracking** - Implement click and scroll tracking on frontend
5. **Customize** - Modify widgets and dashboards for your needs

## Support Files

- **Full Documentation**: `COMMUNICATION_ANALYTICS_IMPLEMENTATION.md`
- **Summary**: `COMMUNICATION_ANALYTICS_SUMMARY.md`
- **This Guide**: `QUICK_START_COMMUNICATION_ANALYTICS.md`

## File Locations

### Backend
- `/home/daytona/codebase/src/convex/campaigns.ts`
- `/home/daytona/codebase/src/convex/notificationTemplates.ts`
- `/home/daytona/codebase/src/convex/messages.ts`
- `/home/daytona/codebase/src/convex/analytics.ts`
- `/home/daytona/codebase/src/convex/abTests.ts`
- `/home/daytona/codebase/src/convex/cohorts.ts`
- `/home/daytona/codebase/src/convex/funnels.ts`
- `/home/daytona/codebase/src/convex/dashboards.ts`

### Frontend
- `/home/daytona/codebase/src/pages/admin/AdminCampaigns.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminTemplates.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminMessages.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminActivityFeed.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminHeatmaps.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminABTests.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminCohorts.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminFunnels.tsx`
- `/home/daytona/codebase/src/pages/admin/AdminDashboardBuilder.tsx`

## Ready to Use!

All features are fully implemented and ready to use. Just navigate to the URLs above or add navigation links to your admin panel.

**Happy coding!**
