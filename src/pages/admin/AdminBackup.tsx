import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Upload, AlertTriangle, Database, HardDrive, Calendar, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export default function AdminBackup() {
  const backups = useQuery(api.backup.listBackups);
  const backupStats = useQuery(api.backup.getBackupStats);
  const createBackup = useAction(api.backup.createBackup);
  const deleteBackup = useMutation(api.backup.deleteBackup);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  const [restorePassword, setRestorePassword] = useState("");

  const handleCreateBackup = async () => {
    if (!createForm.name) {
      toast.error("Please provide a backup name");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createBackup({
        name: createForm.name,
        description: createForm.description,
      });

      // Download the backup
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-${createForm.name}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(
        `Backup created successfully! ${result.recordCount} records backed up.`
      );
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", description: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create backup");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      await deleteBackup({ id: selectedBackup._id });
      toast.success("Backup deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedBackup(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete backup");
    }
  };

  const handleDownloadBackup = async (backup: any) => {
    // In a real implementation, you would fetch the actual backup data
    toast.info("Downloading backup...");
    // Placeholder for download logic
  };

  const openDeleteDialog = (backup: any) => {
    setSelectedBackup(backup);
    setIsDeleteDialogOpen(true);
  };

  const openRestoreDialog = (backup: any) => {
    setSelectedBackup(backup);
    setRestorePassword("");
    setIsRestoreDialogOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!backups || !backupStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
          <p className="text-muted-foreground">
            Create and manage database backups
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Save className="mr-2 h-4 w-4" />
          Create Backup
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupStats.totalBackups}</div>
            <p className="text-xs text-muted-foreground">
              {backupStats.completedBackups} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(backupStats.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground">Across all backups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStats.latestBackup
                ? formatDistanceToNow(backupStats.latestBackup.createdAt, {
                    addSuffix: true,
                  })
                : "None"}
            </div>
            <p className="text-xs text-muted-foreground">
              {backupStats.latestBackup?.name || "No backups yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            All database backups and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No backups yet. Create your first backup to get started.
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup._id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {backup.description || "No description"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(backup.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>{formatBytes(backup.size)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{backup.recordCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {backup.status === "completed" && (
                        <Badge variant="default">Completed</Badge>
                      )}
                      {backup.status === "in_progress" && (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                      {backup.status === "failed" && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadBackup(backup)}
                          disabled={backup.status !== "completed"}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openRestoreDialog(backup)}
                          disabled={backup.status !== "completed"}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(backup)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
          <p>
            <strong>Backup Best Practices:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create regular backups before major system changes</li>
            <li>Store backup files in a secure, off-site location</li>
            <li>Test backup restoration periodically</li>
            <li>Keep multiple backup versions for redundancy</li>
          </ul>
          <p className="mt-4">
            <strong>Restore Warning:</strong> Restoring a backup will overwrite
            current data. This action cannot be undone. Always create a fresh
            backup before restoring.
          </p>
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              Create a complete backup of your database
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Backup Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="e.g., Weekly Backup"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Notes about this backup..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the backup "{selectedBackup?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Restore Database - DANGEROUS
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="font-semibold">
                WARNING: This action will overwrite ALL current data!
              </p>
              <p>
                Restoring from backup "{selectedBackup?.name}" will replace all
                existing data with the backed up version. This action CANNOT be
                undone.
              </p>
              <p>
                To confirm, type <strong>RESTORE</strong> below:
              </p>
              <Input
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Type RESTORE to confirm"
                className="font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restorePassword === "RESTORE") {
                  toast.error(
                    "Restore functionality is disabled for safety. Please contact system administrator."
                  );
                  setIsRestoreDialogOpen(false);
                } else {
                  toast.error("Please type RESTORE to confirm");
                }
              }}
              disabled={restorePassword !== "RESTORE"}
              className="bg-destructive"
            >
              Restore Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
