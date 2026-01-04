import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Download, Upload, MoreHorizontal, Trash2, Eye, Shield, FileSpreadsheet } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const currentUser = useQuery(api.users.currentUser);
  
  const { results: users, status, loadMore, isLoading } = usePaginatedQuery(
    api.users.searchUsers,
    { 
      search, 
      role: roleFilter === "all" ? undefined : roleFilter 
    },
    { initialNumItems: 10 }
  );
  
  const updateRole = useMutation(api.users.updateUserRole);
  const bulkUpdateRole = useMutation(api.users.bulkUpdateUserRole);
  const deleteUser = useMutation(api.users.deleteUser);
  const bulkDeleteUsers = useMutation(api.users.bulkDeleteUsers);
  const importUsers = useMutation(api.users.importUsers);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Id<"users">[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("");

  // Single User Action State
  const [userToDelete, setUserToDelete] = useState<Id<"users"> | null>(null);
  const [userToView, setUserToView] = useState<any | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "user" | "member") => {
    try {
      await updateRole({ id: userId, role: newRole });
      toast.success("User role updated");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser({ id: userToDelete });
      toast.success("User deleted successfully");
      setUserToDelete(null);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleSelect = (id: Id<"users">, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && users) {
      const newIds = users.map(u => u._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    } else if (users) {
      const pageIds = users.map(u => u._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !bulkRole) return;
    
    try {
      const result = await bulkUpdateRole({
        ids: selectedIds,
        role: bulkRole as any
      });
      
      if (result && typeof result === 'object' && 'skipped' in result && result.skipped > 0) {
        toast.success(`Updated ${result.updated} users. Skipped ${result.skipped} (cannot update yourself).`);
      } else {
        toast.success(`Updated ${selectedIds.length} users`);
      }
      
      setIsBulkDialogOpen(false);
      setSelectedIds([]);
      setBulkRole("");
    } catch (error) {
      toast.error("Failed to update users");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const result = await bulkDeleteUsers({ ids: selectedIds });
      if (result && typeof result === 'object' && 'skipped' in result && result.skipped > 0) {
        toast.success(`Deleted ${result.deleted} users. Skipped ${result.skipped} (cannot delete yourself).`);
      } else {
        toast.success(`Deleted ${selectedIds.length} users`);
      }
      setIsBulkDeleteAlertOpen(false);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete users");
    }
  };

  const handleExportCSV = () => {
    if (!users || users.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Role", "Address", "Joined Date"];
    const csvContent = [
      headers.join(","),
      ...users.map(u => [
        `"${(u.name || "Anonymous").replace(/"/g, '""')}"`,
        `"${(u.email || "").replace(/"/g, '""')}"`,
        `"${(u.phone || "").replace(/"/g, '""')}"`,
        u.role || "user",
        `"${(u.address || "").replace(/"/g, '""')}"`,
        new Date(u._creationTime).toISOString().split('T')[0]
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Address"];
    const sampleRow = ["John Doe", "john@example.com", "+1234567890", "user", "123 Main St"];
    const csvContent = [
      headers.join(","),
      sampleRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const usersToImport = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          // Handle CSV parsing with quotes
          const row: string[] = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          row.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

          const user: any = {};
          headers.forEach((header, index) => {
            if (row[index]) {
              if (header === 'name') user.name = row[index];
              if (header === 'email') user.email = row[index];
              if (header === 'phone') user.phone = row[index];
              if (header === 'role') user.role = row[index];
              if (header === 'address') user.address = row[index];
            }
          });

          if (user.name) { // Only add if name exists (basic check before sending)
            usersToImport.push(user);
          }
        }

        if (usersToImport.length === 0) {
          toast.error("No valid users found in CSV");
          return;
        }

        const result = await importUsers({ users: usersToImport });
        
        if (result.failed > 0) {
          toast.warning(`Import completed with issues: ${result.imported} imported, ${result.updated} updated, ${result.failed} failed.`);
          // Show first few errors
          result.errors.slice(0, 3).forEach(err => toast.error(err));
          if (result.errors.length > 3) {
            toast.error(`...and ${result.errors.length - 3} more errors.`);
          }
        } else {
          toast.success(`Import complete: ${result.imported} imported, ${result.updated} updated`);
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to import users. Check CSV format.");
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user roles and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={handleDownloadTemplate} title="Download Template">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Template
          </Button>
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users by name..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsBulkDeleteAlertOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
                </Button>
                <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <CheckSquare className="mr-2 h-4 w-4" /> Update Selected ({selectedIds.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Update Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>New Role</Label>
                        <Select value={bulkRole} onValueChange={setBulkRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleBulkUpdate} className="w-full">
                        Update {selectedIds.length} Users
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={users && users.length > 0 && users.every(u => selectedIds.includes(u._id))}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(user._id)}
                      onCheckedChange={(checked) => handleSelect(user._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name || "Anonymous"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.email || user.phone || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={user.role || "user"} 
                      onValueChange={(val: any) => handleRoleChange(user._id, val)}
                      disabled={currentUser?._id === user._id}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user._creationTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setUserToView(user)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setUserToDelete(user._id)}
                          disabled={currentUser?._id === user._id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-center py-4">
            {status === "CanLoadMore" && (
              <Button
                variant="outline"
                onClick={() => loadMore(10)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load More
              </Button>
            )}
            {status === "LoadingFirstPage" && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {selectedIds.length} user accounts
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete {selectedIds.length} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View User Details Dialog */}
      <Dialog open={!!userToView} onOpenChange={(open) => !open && setUserToView(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information for {userToView?.name || "Anonymous User"}
            </DialogDescription>
          </DialogHeader>
          {userToView && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userToView.image} />
                  <AvatarFallback className="text-lg">{userToView.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{userToView.name || "Anonymous"}</h3>
                  <Badge variant={userToView.role === "admin" ? "default" : "secondary"}>
                    {userToView.role || "user"}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">User ID</span>
                  <span className="col-span-2 font-mono text-xs">{userToView._id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Email</span>
                  <span className="col-span-2">{userToView.email || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Phone</span>
                  <span className="col-span-2">{userToView.phone || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Address</span>
                  <span className="col-span-2">{userToView.address || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Joined</span>
                  <span className="col-span-2">{new Date(userToView._creationTime).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Verified</span>
                  <span className="col-span-2">
                    {userToView.emailVerificationTime ? "Email Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}