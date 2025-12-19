import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
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

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Id<"users">[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("");

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "user" | "member") => {
    try {
      await updateRole({ id: userId, role: newRole });
      toast.success("User role updated");
    } catch (error) {
      toast.error("Failed to update role");
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
      await bulkUpdateRole({
        ids: selectedIds,
        role: bulkRole as any
      });
      toast.success(`Updated ${selectedIds.length} users`);
      setIsBulkDialogOpen(false);
      setSelectedIds([]);
      setBulkRole("");
    } catch (error) {
      toast.error("Failed to update users");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user roles and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
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
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
}