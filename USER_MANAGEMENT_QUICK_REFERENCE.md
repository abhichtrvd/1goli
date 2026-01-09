# Users Management - Quick Reference Guide

## Quick Access Paths

### Files Structure
```
src/
├── convex/
│   ├── schema.ts (updated - new tables & fields)
│   ├── users.ts (updated - new mutations)
│   ├── userActivity.ts (NEW)
│   └── loginHistory.ts (NEW)
│
└── pages/admin/
    ├── AdminUsers.tsx (updated - main integration)
    └── components/
        ├── UserTable.tsx (updated)
        ├── UserDetailsDialog.tsx (updated)
        ├── PasswordResetDialog.tsx (NEW)
        ├── SuspendUserDialog.tsx (NEW)
        ├── TagManagementDialog.tsx (NEW)
        └── BulkMessageDialog.tsx (NEW)
```

---

## Common Tasks

### 1. Reset User Password
```typescript
// Backend
await ctx.runMutation(api.users.generateResetToken, {
  userId: "user_id"
});
// Returns: { token, expiry, email }

// Frontend
<PasswordResetDialog
  user={user}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### 2. Log User Activity
```typescript
await ctx.runMutation(api.userActivity.logActivity, {
  userId: user._id,
  action: "order_placed",
  details: "Order #12345",
  metadata: {
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    orderId: orderId,
  }
});
```

### 3. Suspend/Activate User
```typescript
// Suspend
await ctx.runMutation(api.users.suspendUser, {
  userId: user._id,
  reason: "Fraudulent Activity"
});

// Activate
await ctx.runMutation(api.users.activateUser, {
  userId: user._id
});
```

### 4. Manage Tags
```typescript
// Add tag
await ctx.runMutation(api.users.addUserTag, {
  userId: user._id,
  tag: "VIP"
});

// Remove tag
await ctx.runMutation(api.users.removeUserTag, {
  userId: user._id,
  tag: "VIP"
});

// Bulk add tag
await ctx.runMutation(api.users.bulkAddTag, {
  userIds: [id1, id2, id3],
  tag: "Premium"
});
```

### 5. Track Login
```typescript
await ctx.runMutation(api.loginHistory.logLogin, {
  userId: user._id,
  success: true,
  ipAddress: "192.168.1.1",
  userAgent: request.headers['user-agent'],
  location: "New York, US"
});
```

### 6. Verify Email
```typescript
await ctx.runMutation(api.users.markEmailAsVerified, {
  userId: user._id
});
```

---

## Activity Action Types

Use these predefined constants from `userActivity.ts`:

```typescript
import { ACTIVITY_ACTIONS } from "@/convex/userActivity";

ACTIVITY_ACTIONS.LOGIN
ACTIVITY_ACTIONS.LOGOUT
ACTIVITY_ACTIONS.ORDER_PLACED
ACTIVITY_ACTIONS.PROFILE_UPDATED
ACTIVITY_ACTIONS.PASSWORD_CHANGED
ACTIVITY_ACTIONS.PASSWORD_RESET_REQUESTED
ACTIVITY_ACTIONS.EMAIL_VERIFIED
ACTIVITY_ACTIONS.ADDRESS_UPDATED
ACTIVITY_ACTIONS.CART_UPDATED
ACTIVITY_ACTIONS.REVIEW_POSTED
ACTIVITY_ACTIONS.PRESCRIPTION_UPLOADED
ACTIVITY_ACTIONS.CONSULTATION_BOOKED
ACTIVITY_ACTIONS.ACCOUNT_SUSPENDED
ACTIVITY_ACTIONS.ACCOUNT_ACTIVATED
```

---

## Query Examples

### Get User Activity
```typescript
const activity = useQuery(api.userActivity.getUserActivity, {
  userId: user._id,
  limit: 50,
  filter: "7d" // "24h", "7d", "30d", "all"
});
```

### Get Login History
```typescript
const history = useQuery(api.loginHistory.getUserLoginHistory, {
  userId: user._id,
  limit: 20
});
```

### Get Failed Logins
```typescript
const failed = useQuery(api.loginHistory.getFailedLoginAttempts, {
  userId: user._id,
  limit: 10
});
```

### Get Users by Tag
```typescript
const vipUsers = useQuery(api.users.getUsersByTag, {
  tag: "VIP"
});
```

### Get Suspended Users
```typescript
const suspended = useQuery(api.users.getSuspendedUsers);
```

---

## Component Usage

### Password Reset Dialog
```tsx
const [userToReset, setUserToReset] = useState(null);

<PasswordResetDialog
  user={userToReset}
  open={!!userToReset}
  onOpenChange={(open) => !open && setUserToReset(null)}
/>
```

### Suspend User Dialog
```tsx
const [userToSuspend, setUserToSuspend] = useState(null);

<SuspendUserDialog
  user={userToSuspend}
  open={!!userToSuspend}
  onOpenChange={(open) => !open && setUserToSuspend(null)}
  onSuccess={() => {
    // Refresh data or show success message
  }}
/>
```

### Tag Management Dialog
```tsx
const [userToTag, setUserToTag] = useState(null);

<TagManagementDialog
  user={userToTag}
  open={!!userToTag}
  onOpenChange={(open) => !open && setUserToTag(null)}
  onSuccess={() => {
    // Refresh data
  }}
/>
```

### Bulk Message Dialog
```tsx
const [selectedUsers, setSelectedUsers] = useState([]);
const [isMessageOpen, setIsMessageOpen] = useState(false);

<BulkMessageDialog
  users={selectedUsers}
  open={isMessageOpen}
  onOpenChange={setIsMessageOpen}
/>
```

---

## Schema Fields Reference

### User Fields (New)
```typescript
emailVerified?: boolean
suspended?: boolean
suspensionReason?: string
suspendedAt?: number
suspendedBy?: string
resetToken?: string
resetTokenExpiry?: number
tags?: string[]
lastActiveAt?: number
```

### userActivity Table
```typescript
{
  userId: Id<"users">
  action: string
  details?: string
  metadata?: {
    ipAddress?: string
    userAgent?: string
    orderId?: string
  }
  timestamp: number
}
```

### loginHistory Table
```typescript
{
  userId: Id<"users">
  timestamp: number
  ipAddress?: string
  userAgent?: string
  success: boolean
  failureReason?: string
  location?: string
}
```

---

## Predefined Tags

```typescript
const PREDEFINED_TAGS = [
  "VIP",
  "New",
  "Inactive",
  "Premium",
  "Verified",
  "Wholesale",
  "Retail"
];
```

## Suspension Reasons

```typescript
const SUSPENSION_REASONS = [
  "Violation of Terms of Service",
  "Fraudulent Activity",
  "Abusive Behavior",
  "Spam or Malicious Content",
  "Payment Issues",
  "Security Concerns",
  "User Request",
  "Other"
];
```

---

## Message Templates

```typescript
const MESSAGE_TEMPLATES = {
  welcome: {
    subject: "Welcome to Our Platform!",
    body: "Dear {name},\n\nWelcome..."
  },
  promotion: {
    subject: "Special Offer Just for You!",
    body: "Dear {name},\n\nWe have..."
  },
  warning: {
    subject: "Important: Account Notice",
    body: "Dear {name},\n\nThis is..."
  },
  announcement: {
    subject: "Important Announcement",
    body: "Dear {name},\n\nWe have..."
  },
  custom: {
    subject: "",
    body: ""
  }
};
```

---

## Error Handling Examples

### With Try-Catch
```typescript
const handleAction = async () => {
  try {
    await suspendUser({ userId, reason });
    toast.success("User suspended successfully");
  } catch (error: any) {
    toast.error(error.message || "Failed to suspend user");
    console.error(error);
  }
};
```

### With Validation
```typescript
const handleResetPassword = async () => {
  if (!user?.email) {
    toast.error("User has no email address");
    return;
  }

  try {
    const result = await generateResetToken({ userId: user._id });
    // Handle result
  } catch (error) {
    toast.error("Failed to generate reset token");
  }
};
```

---

## Best Practices

1. **Always Log Activity:**
   ```typescript
   // After important user actions
   await logActivity({
     userId,
     action: ACTIVITY_ACTIONS.ORDER_PLACED,
     details: `Order #${orderId}`,
     metadata: { orderId }
   });
   ```

2. **Check Suspension Before Actions:**
   ```typescript
   if (user.suspended) {
     throw new Error("Account is suspended. Contact support.");
   }
   ```

3. **Update Last Active:**
   ```typescript
   // Automatically done by logActivity mutation
   await ctx.db.patch(userId, {
     lastActiveAt: Date.now()
   });
   ```

4. **Track Failed Logins:**
   ```typescript
   await logLogin({
     userId,
     success: false,
     failureReason: "invalid_password",
     ipAddress,
     userAgent
   });
   ```

5. **Filter by Time Periods:**
   ```typescript
   // Use consistent time filters
   const filters = {
     "24h": Date.now() - 24 * 60 * 60 * 1000,
     "7d": Date.now() - 7 * 24 * 60 * 60 * 1000,
     "30d": Date.now() - 30 * 24 * 60 * 60 * 1000
   };
   ```

---

## Integration Checklist

When integrating into your auth flow:

- [ ] Log successful logins
- [ ] Log failed login attempts
- [ ] Check if user is suspended
- [ ] Update lastActiveAt on activity
- [ ] Track password changes
- [ ] Track profile updates
- [ ] Log email verifications
- [ ] Record order placements
- [ ] Track account status changes

---

## Performance Tips

1. **Pagination for Activity:**
   ```typescript
   // Always use limits
   getUserActivity({ userId, limit: 50, filter: "7d" })
   ```

2. **Cleanup Old Records:**
   ```typescript
   // Periodically clean up old activity (30+ days)
   const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
   await clearUserActivity({ userId, olderThan: thirtyDaysAgo });
   ```

3. **Index Usage:**
   - Use `by_user_timestamp` for user-specific queries
   - Use `by_timestamp` for global recent activity
   - Use `by_action` for filtering by action type

---

## Export/CSV Functions

### Export Login History
```typescript
const exportData = await ctx.runQuery(
  api.loginHistory.exportLoginHistory,
  { userId }
);

// Returns formatted data ready for CSV export
```

### Export Users with New Fields
```typescript
const headers = [
  "Name", "Email", "Phone", "Role",
  "Status", "Tags", "Last Active", "Joined"
];

const csvData = users.map(u => [
  u.name,
  u.email,
  u.phone,
  u.role,
  u.suspended ? "Suspended" : u.emailVerified ? "Verified" : "Unverified",
  u.tags?.join("; "),
  u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : "Never",
  new Date(u._creationTime).toISOString()
]);
```

---

## Troubleshooting

### Issue: Activity not showing
**Solution:** Check if activity is being logged. Verify `logActivity` is called.

### Issue: Tags not updating
**Solution:** Ensure you're calling the mutation and handling the response.

### Issue: Suspended users can still login
**Solution:** Add suspension check in your auth flow:
```typescript
const user = await getCurrentUser(ctx);
if (user?.suspended) {
  throw new Error("Account suspended");
}
```

### Issue: Reset token expired
**Solution:** Tokens expire after 24 hours. Generate a new one.

### Issue: Login history missing
**Solution:** Ensure `logLogin` is called in your authentication flow.

---

## Quick Commands

```bash
# Navigate to admin users page
/admin/users

# View all suspended users
Filter by status in the UI or query:
const suspended = useQuery(api.users.getSuspendedUsers);

# Export user data
Click "Export CSV" button in admin panel

# Bulk operations
Select users → Choose action → Confirm
```

---

This quick reference provides everything developers need to work with the new user management features. For detailed implementation examples, see USER_MANAGEMENT_ENHANCEMENT_SUMMARY.md.
