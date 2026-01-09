# System-Wide Features - API Reference

## Roles & Permissions API

### Queries

#### `getAllRoles()`
Returns all roles with their details.
```typescript
const roles = useQuery(api.roles.getAllRoles);
// Returns: Array<Role>
```

#### `getRole({ id })`
Get a single role with member count.
```typescript
const role = useQuery(api.roles.getRole, { id: roleId });
// Returns: Role & { memberCount: number }
```

#### `getRolesWithMemberCount()`
Get all roles with member counts.
```typescript
const roles = useQuery(api.roles.getRolesWithMemberCount);
// Returns: Array<Role & { memberCount: number }>
```

#### `getAllPermissions()`
Get all available permissions.
```typescript
const permissions = useQuery(api.roles.getAllPermissions);
// Returns: Array<Permission>
```

#### `checkPermission({ userId, permissionKey })`
Check if a user has a specific permission.
```typescript
const hasPermission = useQuery(api.roles.checkPermission, {
  userId: "userId",
  permissionKey: "users.create"
});
// Returns: boolean
```

### Mutations

#### `createRole({ name, description, permissions })`
Create a new custom role.
```typescript
const createRole = useMutation(api.roles.createRole);
await createRole({
  name: "Content Manager",
  description: "Manages content",
  permissions: ["products.read", "products.update"]
});
// Returns: roleId
```

#### `updateRole({ id, name?, description?, permissions? })`
Update an existing role.
```typescript
const updateRole = useMutation(api.roles.updateRole);
await updateRole({
  id: roleId,
  permissions: ["users.read", "users.update"]
});
// Returns: roleId
```

#### `deleteRole({ id })`
Delete a custom role (not system roles).
```typescript
const deleteRole = useMutation(api.roles.deleteRole);
await deleteRole({ id: roleId });
// Returns: { success: true }
```

#### `initializeDefaultRoles()`
Initialize system with default roles and permissions.
```typescript
const initialize = useMutation(api.roles.initializeDefaultRoles);
const result = await initialize();
// Returns: { message, rolesCreated, permissionsCreated }
```

---

## Team Management API

### Queries

#### `getTeamMembers()`
Get all team members (admins and members).
```typescript
const members = useQuery(api.team.getTeamMembers);
// Returns: Array<User & { roleInfo: Role | null }>
```

#### `getTeamInvitations()`
Get all team invitations.
```typescript
const invitations = useQuery(api.team.getTeamInvitations);
// Returns: Array<TeamInvitation>
```

#### `getPendingInvitations()`
Get only pending invitations.
```typescript
const pending = useQuery(api.team.getPendingInvitations);
// Returns: Array<TeamInvitation>
```

### Mutations

#### `inviteTeamMember({ email, roleId })`
Invite a new team member.
```typescript
const invite = useMutation(api.team.inviteTeamMember);
const result = await invite({
  email: "user@example.com",
  roleId: roleId
});
// Returns: { invitationId, token, invitationUrl }
```

#### `cancelInvitation({ invitationId })`
Cancel a pending invitation.
```typescript
const cancel = useMutation(api.team.cancelInvitation);
await cancel({ invitationId });
// Returns: { success: true }
```

#### `resendInvitation({ invitationId })`
Resend an invitation with new token.
```typescript
const resend = useMutation(api.team.resendInvitation);
const result = await resend({ invitationId });
// Returns: { token, invitationUrl }
```

#### `updateTeamMemberRole({ userId, roleId })`
Change a team member's role.
```typescript
const updateRole = useMutation(api.team.updateTeamMemberRole);
await updateRole({ userId, roleId });
// Returns: { success: true }
```

#### `deactivateTeamMember({ userId, reason? })`
Deactivate a team member.
```typescript
const deactivate = useMutation(api.team.deactivateTeamMember);
await deactivate({
  userId,
  reason: "On leave"
});
// Returns: { success: true }
```

#### `activateTeamMember({ userId })`
Reactivate a team member.
```typescript
const activate = useMutation(api.team.activateTeamMember);
await activate({ userId });
// Returns: { success: true }
```

#### `removeTeamMember({ userId })`
Remove team member (converts to customer).
```typescript
const remove = useMutation(api.team.removeTeamMember);
await remove({ userId });
// Returns: { success: true }
```

---

## Backup & Restore API

### Queries

#### `listBackups()`
Get all backup records.
```typescript
const backups = useQuery(api.backup.listBackups);
// Returns: Array<Backup>
```

#### `getBackup({ id })`
Get single backup details.
```typescript
const backup = useQuery(api.backup.getBackup, { id: backupId });
// Returns: Backup
```

#### `getBackupStats()`
Get backup statistics.
```typescript
const stats = useQuery(api.backup.getBackupStats);
// Returns: { totalBackups, totalSize, completedBackups, latestBackup }
```

### Actions

#### `createBackup({ name, description?, tables? })`
Create a new backup.
```typescript
const createBackup = useAction(api.backup.createBackup);
const result = await createBackup({
  name: "Weekly Backup",
  description: "Regular backup",
  tables: ["users", "orders", "products"] // optional
});
// Returns: { backupId, data, size, recordCount }
```

#### `downloadBackupData({ backupId })`
Download backup data.
```typescript
const download = useAction(api.backup.downloadBackupData);
const backup = await download({ backupId });
// Returns: Backup metadata
```

### Mutations

#### `deleteBackup({ id })`
Delete a backup record.
```typescript
const deleteBackup = useMutation(api.backup.deleteBackup);
await deleteBackup({ id: backupId });
// Returns: { success: true }
```

#### `scheduleBackup({ frequency, enabled })`
Configure automatic backups.
```typescript
const schedule = useMutation(api.backup.scheduleBackup);
await schedule({
  frequency: "weekly",
  enabled: true
});
// Returns: { message, frequency, enabled }
```

---

## Database Optimization API

### Queries

#### `analyzeDatabaseStats()`
Get database statistics for all tables.
```typescript
const stats = useQuery(api.optimization.analyzeDatabaseStats);
// Returns: { tables: Array<TableStats>, totals: { totalRecords, totalSize, totalTables }}
```

#### `getDataRetentionInfo()`
Get information about old data eligible for cleanup.
```typescript
const retention = useQuery(api.optimization.getDataRetentionInfo);
// Returns: {
//   auditLogs: { total, older90Days },
//   loginHistory: { total, older90Days },
//   userActivity: { total, older6Months },
//   deletedOrders: { total, older30Days },
//   deletedPrescriptions: { total, older30Days }
// }
```

#### `findDuplicateUsers()`
Find users with duplicate email or phone.
```typescript
const duplicates = useQuery(api.optimization.findDuplicateUsers);
// Returns: {
//   duplicateEmails: Array<{ email, users, count }>,
//   duplicatePhones: Array<{ phone, users, count }>,
//   totalDuplicates: number
// }
```

#### `findOrphanedRecords()`
Find records referencing non-existent data.
```typescript
const orphaned = useQuery(api.optimization.findOrphanedRecords);
// Returns: {
//   issues: Array<{ type, id, details }>,
//   totalIssues: number
// }
```

#### `getIndexHealth()`
Get database index health status.
```typescript
const health = useQuery(api.optimization.getIndexHealth);
// Returns: { message, recommendation, status }
```

### Mutations

#### `cleanupOldAuditLogs({ olderThanDays })`
Delete old audit logs.
```typescript
const cleanup = useMutation(api.optimization.cleanupOldAuditLogs);
const result = await cleanup({ olderThanDays: 90 });
// Returns: { deleted, kept }
```

#### `cleanupOldLoginHistory({ olderThanDays })`
Delete old login history.
```typescript
const cleanup = useMutation(api.optimization.cleanupOldLoginHistory);
const result = await cleanup({ olderThanDays: 90 });
// Returns: { deleted }
```

#### `cleanupOldUserActivity({ olderThanDays })`
Delete old user activity.
```typescript
const cleanup = useMutation(api.optimization.cleanupOldUserActivity);
const result = await cleanup({ olderThanDays: 180 });
// Returns: { deleted }
```

#### `cleanupDeletedOrders({ olderThanDays })`
Permanently delete soft-deleted orders.
```typescript
const cleanup = useMutation(api.optimization.cleanupDeletedOrders);
const result = await cleanup({ olderThanDays: 30 });
// Returns: { deleted }
```

#### `cleanupOrphanedRecords()`
Remove orphaned records.
```typescript
const cleanup = useMutation(api.optimization.cleanupOrphanedRecords);
const result = await cleanup();
// Returns: { deleted }
```

---

## Type Definitions

### Role
```typescript
interface Role {
  _id: Id<"roles">;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
}
```

### Permission
```typescript
interface Permission {
  _id: Id<"permissions">;
  resource: string;
  action: string;
  description: string;
  category: string;
  key: string; // format: "{resource}.{action}"
}
```

### TeamInvitation
```typescript
interface TeamInvitation {
  _id: Id<"teamInvitations">;
  email: string;
  roleId: Id<"roles">;
  roleName: string;
  invitedBy: string;
  invitedAt: number;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: number;
  acceptedAt?: number;
  token: string;
}
```

### Backup
```typescript
interface Backup {
  _id: Id<"backups">;
  name: string;
  description?: string;
  size: number;
  tablesIncluded: string[];
  recordCount: number;
  createdBy: string;
  createdAt: number;
  storageId?: Id<"_storage">;
  type: "manual" | "scheduled";
  status: "in_progress" | "completed" | "failed";
}
```

### TableStats
```typescript
interface TableStats {
  tableName: string;
  recordCount: number;
  estimatedSize: number;
  sampleRecord: number;
  error?: string;
}
```

---

## Permission Keys

### Users
- `users.create` - Create new users
- `users.read` - View user information
- `users.update` - Update user information
- `users.delete` - Delete users
- `users.suspend` - Suspend/activate users

### Orders
- `orders.create` - Create new orders
- `orders.read` - View orders
- `orders.update` - Update order status
- `orders.delete` - Delete orders
- `orders.refund` - Process refunds

### Products
- `products.create` - Create new products
- `products.read` - View products
- `products.update` - Update product information
- `products.delete` - Delete products
- `products.manage_stock` - Manage product inventory

### Doctors
- `doctors.create` - Add new doctors
- `doctors.read` - View doctor information
- `doctors.update` - Update doctor information
- `doctors.delete` - Remove doctors

### Prescriptions
- `prescriptions.create` - Create prescriptions
- `prescriptions.read` - View prescriptions
- `prescriptions.update` - Update prescription status
- `prescriptions.delete` - Delete prescriptions

### Settings
- `settings.read` - View system settings
- `settings.update` - Modify system settings

### Reports
- `reports.view` - View analytics and reports
- `reports.export` - Export reports

### Roles
- `roles.manage` - Manage roles and permissions

### Backup
- `backup.create` - Create backups
- `backup.restore` - Restore from backup

---

## Error Handling

All mutations can throw errors. Always wrap in try-catch:

```typescript
try {
  await createRole({
    name: "New Role",
    description: "Description",
    permissions: []
  });
  toast.success("Role created");
} catch (error: any) {
  toast.error(error.message || "Failed to create role");
}
```

Common error messages:
- "Unauthorized: Admin access required"
- "Role with this name already exists"
- "Cannot delete system roles"
- "Cannot delete role. X user(s) still have this role"
- "You cannot change your own role"
- "Invalid email format"
- "Pending invitation already exists"
- "Invitation has expired"

---

## Best Practices

1. **Always check permissions before UI actions**
   ```typescript
   const hasPermission = useQuery(api.roles.checkPermission, {
     userId: currentUser._id,
     permissionKey: "users.create"
   });

   {hasPermission && <Button>Create User</Button>}
   ```

2. **Handle loading states**
   ```typescript
   if (!roles) return <Loader />;
   ```

3. **Provide user feedback**
   ```typescript
   toast.success("Action completed");
   toast.error("Action failed");
   ```

4. **Validate before mutations**
   ```typescript
   if (!email || !roleId) {
     toast.error("Please fill all fields");
     return;
   }
   ```

5. **Use TypeScript types**
   ```typescript
   import { Id } from "@/convex/_generated/dataModel";
   ```

---

**API Version**: 1.0.0
**Last Updated**: January 2024
