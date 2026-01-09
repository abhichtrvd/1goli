# Custom Report Builder and Scheduled Reports Implementation

## Overview
Comprehensive system for creating, running, scheduling, and exporting custom reports with support for multiple data sources, filters, aggregations, and visualizations.

## Files Created/Modified

### Backend (Convex)
1. **`/home/daytona/codebase/src/convex/schema.ts`** - Updated
   - Added `reports` table with full configuration
   - Added `reportSchedules` table for automated report delivery
   - Added `reportExecutions` table for tracking history

2. **`/home/daytona/codebase/src/convex/reports.ts`** - New (32KB)
   - `createReport` - Create new custom report
   - `updateReport` - Update report configuration
   - `deleteReport` - Delete report and schedules
   - `listReports` - Query all reports (filtered by access)
   - `getReport` - Get single report
   - `runReport` - Execute report with filters and date range
   - `exportReport` - Export to CSV, Excel, or JSON
   - `scheduleReport` - Create automated schedule
   - `updateSchedule` - Modify schedule settings
   - `deleteSchedule` - Remove schedule
   - `getScheduledReports` - List all schedules
   - `getReportExecutions` - View execution history
   - `executeScheduledReports` - Cron job handler
   - Internal query functions for each data source

3. **`/home/daytona/codebase/src/convex/crons.ts`** - Updated
   - Added daily cron job to execute scheduled reports

### Frontend
4. **`/home/daytona/codebase/src/pages/admin/AdminReports.tsx`** - New (8.7KB)
   - Main reports management page
   - Tabbed interface (Builder, Preview, Schedules, History)
   - Handles report CRUD operations
   - Export functionality
   - Schedule management

5. **`/home/daytona/codebase/src/pages/admin/components/ReportBuilder.tsx`** - New (12KB)
   - Visual report builder interface
   - Data source selection
   - Filter builder (field, operator, value)
   - Column selector
   - Aggregation builder (sum, avg, count, min, max)
   - Group by and sort options
   - Chart type selector
   - Public/private toggle

6. **`/home/daytona/codebase/src/pages/admin/components/ReportPreview.tsx`** - New (1.7KB)
   - Table view of report results
   - Displays record count and execution time
   - Dynamic column rendering

7. **`/home/daytona/codebase/src/pages/admin/components/ReportLibrary.tsx`** - New (4.2KB)
   - List of all saved reports
   - Quick actions (Run, Edit, Export, Schedule, Delete)
   - Multi-format export menu (CSV, Excel, JSON)

8. **`/home/daytona/codebase/src/pages/admin/components/ScheduleReportDialog.tsx`** - New (6.3KB)
   - Schedule configuration dialog
   - Frequency selector (daily, weekly, monthly)
   - Day/time picker
   - Recipients email list
   - Export format selector

9. **`/home/daytona/codebase/src/pages/admin/components/ScheduledReportsList.tsx`** - New (3.7KB)
   - Table of scheduled reports
   - Enable/disable toggle
   - Next run time display
   - Last run status indicator
   - Delete schedule action

10. **`/home/daytona/codebase/src/pages/admin/components/ReportExecutionHistory.tsx`** - New (2.2KB)
    - Execution history table
    - Status indicators (success/failed/running)
    - Performance metrics
    - Export format tracking

11. **`/home/daytona/codebase/src/components/AdminLayout.tsx`** - Updated
    - Added "Reports" menu item with BarChart3 icon

12. **`/home/daytona/codebase/src/main.tsx`** - Already had route
    - Route already exists: `/admin/reports`

## Features Implemented

### 1. Custom Report Builder
- **Data Sources**: Orders, Products, Users, Prescriptions, Doctors
- **Report Types**: Sales, Inventory, User, Order, Doctor, Prescription
- **Filters**: 9 operators (equals, not_equals, contains, not_contains, gt, gte, lt, lte, between)
- **Aggregations**: Sum, Average, Count, Min, Max with custom labels
- **Grouping**: Group by any field
- **Sorting**: Sort by any field, ascending or descending
- **Columns**: Select specific fields to display
- **Visualization**: Table, Bar Chart, Line Chart, Pie Chart (frontend ready)
- **Access Control**: Public/private reports

### 2. Report Execution
- Real-time report generation
- Date range filtering
- Performance tracking (execution time, record count)
- Error handling and logging
- Execution history tracking

### 3. Export Functionality
- **CSV Export**: Comma-separated values with proper escaping
- **Excel Export**: Currently uses CSV format (can be enhanced with xlsx library)
- **JSON Export**: Formatted JSON with 2-space indentation
- Download to browser automatically

### 4. Scheduled Reports
- **Frequencies**: Daily, Weekly (with day of week), Monthly (with day of month)
- **Time Configuration**: 24-hour format time picker
- **Email Delivery**: Multiple recipients (comma-separated)
- **Export Formats**: CSV, Excel, PDF, JSON
- **Schedule Management**: Enable/disable, update, delete
- **Next Run Calculation**: Automatic calculation of next execution time
- **Status Tracking**: Success/failed status with error messages

### 5. Execution History
- Complete audit trail of all report executions
- Performance metrics (records, execution time)
- Status tracking (success, failed, running)
- Export format tracking
- Link to scheduled execution (if applicable)

### 6. Cron Automation
- Daily cron job checks for due reports
- Executes scheduled reports automatically
- Updates next run time
- Logs execution status and errors
- Ready for email integration (placeholder for SendGrid/AWS SES)

## Data Source Field Mappings

### Orders
- `_id`, `_creationTime`, `userId`, `total`, `status`, `itemCount`, `paymentMethod`, `paymentStatus`

### Products
- `_id`, `_creationTime`, `name`, `brand`, `sku`, `basePrice`, `stock`, `category`, `averageRating`, `ratingCount`

### Users
- `_id`, `_creationTime`, `name`, `email`, `phone`, `role`, `emailVerified`, `suspended`, `lastActiveAt`

### Prescriptions
- `_id`, `_creationTime`, `userId`, `patientName`, `patientPhone`, `status`, `doctorName`, `diagnosis`, `medicineCount`

### Doctors
- `_id`, `_creationTime`, `name`, `specialization`, `experienceYears`, `rating`, `totalConsultations`, `clinicCity`

## Filter Operators

1. **equals** - Exact match
2. **not_equals** - Not equal to
3. **contains** - Contains substring (case-insensitive)
4. **not_contains** - Does not contain substring
5. **gt** - Greater than (numeric)
6. **gte** - Greater than or equal (numeric)
7. **lt** - Less than (numeric)
8. **lte** - Less than or equal (numeric)
9. **between** - Between two values (numeric)
10. **in** - In array of values
11. **not_in** - Not in array of values

## Aggregation Functions

1. **sum** - Sum of numeric values
2. **avg** - Average of numeric values
3. **count** - Count of records
4. **min** - Minimum value
5. **max** - Maximum value

## Usage Examples

### Example 1: Sales Report
```typescript
{
  name: "Monthly Sales Report",
  type: "sales",
  dataSource: "orders",
  filters: [
    { field: "status", operator: "equals", value: "completed" }
  ],
  columns: ["_creationTime", "userId", "total", "paymentMethod"],
  groupBy: "paymentMethod",
  aggregations: [
    { field: "total", function: "sum", label: "Total Revenue" },
    { field: "_id", function: "count", label: "Order Count" }
  ],
  sortBy: "Total Revenue",
  sortOrder: "desc",
  chartType: "bar"
}
```

### Example 2: Low Stock Report
```typescript
{
  name: "Low Stock Alert",
  type: "inventory",
  dataSource: "products",
  filters: [
    { field: "stock", operator: "lt", value: "10" }
  ],
  columns: ["name", "brand", "sku", "stock", "basePrice"],
  sortBy: "stock",
  sortOrder: "asc",
  chartType: "table"
}
```

### Example 3: User Growth Report
```typescript
{
  name: "New Users This Month",
  type: "user",
  dataSource: "users",
  columns: ["name", "email", "role", "_creationTime"],
  aggregations: [
    { field: "_id", function: "count", label: "Total Users" }
  ],
  chartType: "line"
}
```

## Scheduling Examples

### Daily Report at 9 AM
```typescript
{
  frequency: "daily",
  timeOfDay: "09:00",
  recipients: ["admin@example.com"],
  exportFormat: "csv"
}
```

### Weekly Report (Every Monday)
```typescript
{
  frequency: "weekly",
  dayOfWeek: 1, // Monday
  timeOfDay: "08:00",
  recipients: ["manager@example.com", "owner@example.com"],
  exportFormat: "excel"
}
```

### Monthly Report (1st of month)
```typescript
{
  frequency: "monthly",
  dayOfMonth: 1,
  timeOfDay: "00:00",
  recipients: ["cfo@example.com"],
  exportFormat: "pdf"
}
```

## Security & Access Control

- Admin-only access (requires `requireAdmin` check)
- Public/private report visibility
- Report creators can edit/delete their own reports
- Public reports visible to all admins
- Audit logging for all report operations

## Performance Considerations

- Execution time tracking
- Record count limits (can be added)
- Indexed queries on data sources
- Efficient filtering and aggregation
- CSV streaming for large exports (can be enhanced)

## Future Enhancements

1. **Email Integration**
   - SendGrid/AWS SES integration for scheduled report delivery
   - Email templates with report data embedded
   - Attachment support for exported files

2. **Advanced Visualizations**
   - Chart.js or Recharts integration for actual charts
   - Interactive dashboards
   - Real-time data updates

3. **Report Templates**
   - Pre-built report templates library
   - Template marketplace
   - Clone from existing reports

4. **Advanced Filtering**
   - Complex filter logic (AND/OR combinations)
   - Nested filters
   - Custom SQL-like expressions

5. **PDF Export**
   - Actual PDF generation (using jsPDF or similar)
   - Custom PDF templates
   - Charts in PDF

6. **Webhooks**
   - Webhook delivery for scheduled reports
   - Custom webhook payloads
   - Retry logic

7. **Report Sharing**
   - Share reports via link
   - Embed reports in other apps
   - Public report URLs

## Testing the Implementation

1. Navigate to `/admin/reports`
2. Click "Create Report"
3. Select data source and configure report
4. Add filters and select columns
5. Click "Save" or "Create Report"
6. Click "Run" icon to execute
7. View results in "Preview" tab
8. Click "Export" to download
9. Click "Calendar" to schedule
10. View schedules in "Schedules" tab
11. Check "Execution History" tab for audit trail

## Troubleshooting

- **Report not running**: Check filters and ensure data exists
- **Schedule not executing**: Verify cron job is running (`executeScheduledReports`)
- **Export failing**: Check data size and browser download permissions
- **Access denied**: Ensure user has admin role
- **Missing fields**: Verify data source has required fields

## Notes

- All timestamps are in milliseconds (Unix epoch)
- Cron runs daily at midnight UTC
- CSV exports use RFC 4180 format
- Date ranges are inclusive
- All operations are logged to auditLogs table
