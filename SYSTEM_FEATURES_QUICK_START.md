# System-Wide Features - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Initialize the System (1 min)
1. Navigate to `/admin/roles`
2. Click **"Initialize Default Roles"** button
3. ✅ Creates 5 roles and 30+ permissions automatically

### Step 2: Invite Your First Team Member (2 min)
1. Navigate to `/admin/team`
2. Click **"Invite Team Member"**
3. Enter email and select role
4. Share the invitation URL (auto-copied to clipboard)

### Step 3: Create Your First Backup (2 min)
1. Navigate to `/admin/backup`
2. Click **"Create Backup"**
3. Name it (e.g., "Initial Backup")
4. Backup downloads automatically

## 📍 Navigation

All new features are in the Admin Panel sidebar:

```
System Features Section:
├── 🛡️  Roles & Permissions    /admin/roles
├── 👥  Team Management         /admin/team
├── 💾  Backup & Restore        /admin/backup
└── ⚡  Optimization            /admin/optimization
```

## 🎯 Common Tasks

### Managing Roles
```
View all roles     → /admin/roles
Create custom role → Click "Create Role" → Select permissions
Edit role          → Click Edit icon → Modify permissions
Delete role        → Click Delete icon (only for custom roles with no members)
```

### Managing Team
```
Invite member      → /admin/team → "Invite Team Member"
Change role        → Click "Change Role" on member row
Deactivate member  → Click user icon (X) on member row
View invitations   → /admin/team → "Pending Invitations" section
```

### Backups
```
Create backup      → /admin/backup → "Create Backup"
Download backup    → Click Download icon on backup row
Delete backup      → Click Trash icon on backup row
View stats         → Top of backup page shows statistics
```

### Optimization
```
View DB stats      → /admin/optimization → Top cards + table
Cleanup old data   → Click "Cleanup" button in Data Retention section
Check for issues   → Review "Duplicate Users" and "Orphaned Records" cards
```

## 🔐 Default Roles

### Super Admin
- Full system access
- Can manage roles and restore backups
- **Use for**: System administrators

### Admin
- Administrative access
- Cannot manage roles or restore backups
- **Use for**: Senior administrators

### Manager
- Manage orders, products, reports
- **Use for**: Store managers

### Staff
- View and update orders/prescriptions
- **Use for**: Support staff

### Customer
- Basic customer access
- **Use for**: Regular users

## 💡 Pro Tips

1. **Always backup before major changes**
   - Navigate to `/admin/backup`
   - Create backup before system updates

2. **Review audit logs regularly**
   - Go to `/admin/audit-logs`
   - Filter by critical actions

3. **Schedule regular optimization**
   - Weekly: Check data retention
   - Monthly: Cleanup old logs
   - Quarterly: Review duplicates

4. **Use least privilege principle**
   - Assign minimal necessary permissions
   - Create custom roles for specific needs

5. **Monitor team activity**
   - Check team member status
   - Review invitation expirations

## ⚠️ Important Warnings

### Restore
- ⚠️ Restore overwrites ALL current data
- Always create fresh backup before restoring
- Type "RESTORE" to confirm

### Cleanup
- ⚠️ Cleanup permanently deletes data
- Review counts before confirming
- Critical audit logs are preserved

### Role Deletion
- ❌ Cannot delete system roles
- ❌ Cannot delete roles with members
- First reassign members to other roles

## 🔧 Troubleshooting

### "Cannot delete role"
→ Check if role has members assigned
→ Reassign members first

### "Invitation expired"
→ Resend invitation from team page
→ New token generated automatically

### "Permission denied"
→ Check your role permissions
→ Contact Super Admin

### "Backup failed"
→ Check browser console for errors
→ Try with smaller date range

## 📊 Monitoring Dashboard

### Key Metrics to Watch
1. **Database Size** (Optimization page)
   - Monitor growth trends
   - Set up regular cleanups

2. **Team Size** (Team page)
   - Track active members
   - Review pending invitations

3. **Backup Frequency** (Backup page)
   - Ensure regular backups
   - Check latest backup date

4. **Issues Count** (Optimization page)
   - Monitor orphaned records
   - Check for duplicates

## 🎓 Learning Path

### Day 1: Basics
1. ✅ Initialize roles
2. ✅ Create first backup
3. ✅ Explore optimization stats

### Day 2: Team Setup
1. ✅ Invite team members
2. ✅ Assign roles
3. ✅ Test permissions

### Week 1: Maintenance
1. ✅ Review audit logs
2. ✅ Run optimization cleanup
3. ✅ Schedule backups

### Month 1: Advanced
1. ✅ Create custom roles
2. ✅ Optimize data retention
3. ✅ Establish backup strategy

## 📞 Quick Reference

| Task | Path | Time |
|------|------|------|
| Initialize Roles | `/admin/roles` → Initialize | 30s |
| Invite Member | `/admin/team` → Invite | 1m |
| Create Backup | `/admin/backup` → Create | 2m |
| Cleanup Data | `/admin/optimization` → Cleanup | 1m |
| View Stats | `/admin/optimization` | 10s |

## 🎯 Success Checklist

After setup, you should have:
- [ ] 5 default roles initialized
- [ ] At least 1 backup created
- [ ] Team members invited (if applicable)
- [ ] Database stats reviewed
- [ ] Audit logging verified
- [ ] Navigation tested

---

**Ready to start?** Go to `/admin/roles` and click "Initialize Default Roles"!
