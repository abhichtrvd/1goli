import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface UserTableProps {
  users: any[];
  selectedIds: Id<"users">[];
  currentUser: any;
  onSelect: (id: Id<"users">, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRoleChange: (userId: Id<"users">, newRole: "admin" | "user" | "member") => void;
  onViewDetails: (user: any) => void;
  onDeleteUser: (userId: Id<"users">) => void;
  status: string;
  loadMore: (numItems: number) => void;
  isLoading: boolean;
}

export function UserTable({
  users,
  selectedIds,
  currentUser,
  onSelect,
  onSelectAll,
  onRoleChange,
  onViewDetails,
  onDeleteUser,
  status,
  loadMore,
  isLoading
}: UserTableProps) {
  const allSelected = users && users.length > 0 && users.every(u => selectedIds.includes(u._id));

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
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
                  onCheckedChange={(checked) => onSelect(user._id, checked as boolean)}
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
                  onValueChange={(val: any) => onRoleChange(user._id, val)}
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
                    <DropdownMenuItem onClick={() => onViewDetails(user)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDeleteUser(user._id)}
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
    </div>
  );
}
