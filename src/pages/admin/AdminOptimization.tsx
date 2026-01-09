import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Database, Trash2, AlertTriangle, BarChart3, HardDrive, FileWarning, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminOptimization() {
  const dbStats = useQuery(api.optimization.analyzeDatabaseStats);
  const retentionInfo = useQuery(api.optimization.getDataRetentionInfo);
  const duplicateUsers = useQuery(api.optimization.findDuplicateUsers);
  const orphanedRecords = useQuery(api.optimization.findOrphanedRecords);
  const indexHealth = useQuery(api.optimization.getIndexHealth);

  const cleanupAuditLogs = useMutation(api.optimization.cleanupOldAuditLogs);
  const cleanupLoginHistory = useMutation(api.optimization.cleanupOldLoginHistory);
  const cleanupUserActivity = useMutation(api.optimization.cleanupOldUserActivity);
  const cleanupDeletedOrders = useMutation(api.optimization.cleanupDeletedOrders);
  const cleanupOrphanedRecords = useMutation(api.optimization.cleanupOrphanedRecords);

  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [cleanupType, setCleanupType] = useState<string>("");
  const [cleanupDays, setCleanupDays] = useState<number>(90);

  const handleCleanup = async () => {
    try {
      let result;
      switch (cleanupType) {
        case "auditLogs":
          result = await cleanupAuditLogs({ olderThanDays: cleanupDays });
          toast.success(`Deleted ${result.deleted} audit logs`);
          break;
        case "loginHistory":
          result = await cleanupLoginHistory({ olderThanDays: cleanupDays });
          toast.success(`Deleted ${result.deleted} login history records`);
          break;
        case "userActivity":
          result = await cleanupUserActivity({ olderThanDays: cleanupDays });
          toast.success(`Deleted ${result.deleted} user activity records`);
          break;
        case "deletedOrders":
          result = await cleanupDeletedOrders({ olderThanDays: cleanupDays });
          toast.success(`Permanently deleted ${result.deleted} orders`);
          break;
        case "orphanedRecords":
          result = await cleanupOrphanedRecords();
          toast.success(`Cleaned up ${result.deleted} orphaned records`);
          break;
        default:
          toast.error("Unknown cleanup type");
      }
      setIsCleanupDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Cleanup failed");
    }
  };

  const openCleanupDialog = (type: string) => {
    setCleanupType(type);
    setCleanupDays(type === "userActivity" ? 180 : 90);
    setIsCleanupDialogOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!dbStats || !retentionInfo || !duplicateUsers || !orphanedRecords || !indexHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalIssues =
    duplicateUsers.totalDuplicates +
    orphanedRecords.totalIssues +
    (retentionInfo.auditLogs.older90Days > 1000 ? 1 : 0) +
    (retentionInfo.loginHistory.older90Days > 1000 ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Optimization</h1>
          <p className="text-muted-foreground">
            Monitor and optimize database performance
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbStats.totals.totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {dbStats.totals.totalTables} tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(dbStats.totals.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated total size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              {totalIssues === 0 ? "All clean" : "Needs attention"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Index Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{indexHealth.status}</div>
            <p className="text-xs text-muted-foreground">
              {indexHealth.recommendation}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Table Statistics</CardTitle>
          <CardDescription>
            Record count and size for each database table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Estimated Size</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbStats.tables
                .sort((a, b) => b.recordCount - a.recordCount)
                .map((table) => {
                  const percentage =
                    (table.recordCount / dbStats.totals.totalRecords) * 100;
                  return (
                    <TableRow key={table.tableName}>
                      <TableCell className="font-medium">
                        {table.tableName}
                      </TableCell>
                      <TableCell className="text-right">
                        {table.recordCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBytes(table.estimatedSize)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={percentage} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Data Retention & Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention & Cleanup</CardTitle>
          <CardDescription>
            Old data that can be safely removed to optimize storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h4 className="font-medium">Old Audit Logs</h4>
              <p className="text-sm text-muted-foreground">
                {retentionInfo.auditLogs.older90Days} records older than 90 days
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCleanupDialog("auditLogs")}
              disabled={retentionInfo.auditLogs.older90Days === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h4 className="font-medium">Old Login History</h4>
              <p className="text-sm text-muted-foreground">
                {retentionInfo.loginHistory.older90Days} records older than 90 days
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCleanupDialog("loginHistory")}
              disabled={retentionInfo.loginHistory.older90Days === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h4 className="font-medium">Old User Activity</h4>
              <p className="text-sm text-muted-foreground">
                {retentionInfo.userActivity.older6Months} records older than 6 months
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCleanupDialog("userActivity")}
              disabled={retentionInfo.userActivity.older6Months === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h4 className="font-medium">Soft-Deleted Orders</h4>
              <p className="text-sm text-muted-foreground">
                {retentionInfo.deletedOrders.older30Days} orders deleted more than 30 days ago
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCleanupDialog("deletedOrders")}
              disabled={retentionInfo.deletedOrders.older30Days === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Issues */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Users</CardTitle>
            <CardDescription>Users with duplicate email or phone</CardDescription>
          </CardHeader>
          <CardContent>
            {duplicateUsers.duplicateEmails.length === 0 &&
            duplicateUsers.duplicatePhones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No duplicate users found
              </p>
            ) : (
              <div className="space-y-2">
                {duplicateUsers.duplicateEmails.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">
                      Duplicate Emails: {duplicateUsers.duplicateEmails.length}
                    </p>
                  </div>
                )}
                {duplicateUsers.duplicatePhones.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">
                      Duplicate Phones: {duplicateUsers.duplicatePhones.length}
                    </p>
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-2">
                  View Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orphaned Records</CardTitle>
            <CardDescription>
              Records referencing non-existent data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orphanedRecords.totalIssues === 0 ? (
              <p className="text-sm text-muted-foreground">
                No orphaned records found
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {orphanedRecords.totalIssues} issue(s) found
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCleanupDialog("orphanedRecords")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Up
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <BarChart3 className="h-5 w-5" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Convex automatically optimizes indexes for better performance</li>
            <li>Regular cleanup of old data helps maintain optimal performance</li>
            <li>Monitor table sizes to identify data growth patterns</li>
            <li>Remove orphaned records to maintain data integrity</li>
            <li>Consider archiving old data instead of deleting if needed for compliance</li>
          </ul>
        </CardContent>
      </Card>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={isCleanupDialogOpen} onOpenChange={setIsCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirm Cleanup
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {cleanupType === "orphanedRecords" ? (
                <p>
                  This will permanently delete all orphaned records. This action
                  cannot be undone.
                </p>
              ) : (
                <>
                  <p>
                    This will permanently delete records older than the specified
                    number of days. This action cannot be undone.
                  </p>
                  <div>
                    <Label htmlFor="cleanup-days">Days to keep</Label>
                    <Input
                      id="cleanup-days"
                      type="number"
                      value={cleanupDays}
                      onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                      min={1}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Records older than {cleanupDays} days will be deleted
                    </p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} className="bg-destructive">
              Delete Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
