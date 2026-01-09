import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, Loader2, CheckCircle2, XCircle, Ban, Key, Mail, Tag as TagIcon, ShieldAlert } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

interface UserTableProps {
  users: any[];
  selectedIds: Id<"users">[];
  currentUser: any;
  onSelect: (id: Id<"users">, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRoleChange: (userId: Id<"users">, newRole: "admin" | "user" | "member") => void;
  onViewDetails: (user: any) => void;
  onDeleteUser: (userId: Id<"users">) => void;
  onResetPassword?: (user: any) => void;
  onSuspendUser?: (user: any) => void;
  onManageTags?: (user: any) => void;
  onVerifyEmail?: (userId: Id<"users">) => void;
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
  onResetPassword,
  onSuspendUser,
  onManageTags,
  onVerifyEmail,
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
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <UserRow
              key={user._id}
              user={user}
              isSelected={selectedIds.includes(user._id)}
              currentUser={currentUser}
              onSelect={onSelect}
              onRoleChange={onRoleChange}
              onViewDetails={onViewDetails}
              onDeleteUser={onDeleteUser}
              onResetPassword={onResetPassword}
              onSuspendUser={onSuspendUser}
              onManageTags={onManageTags}
              onVerifyEmail={onVerifyEmail}
            />
          ))}
          {users?.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

interface UserRowProps {
  user: any;
  isSelected: boolean;
  currentUser: any;
  onSelect: (id: Id<"users">, checked: boolean) => void;
  onRoleChange: (userId: Id<"users">, newRole: "admin" | "user" | "member") => void;
  onViewDetails: (user: any) => void;
  onDeleteUser: (userId: Id<"users">) => void;
  onResetPassword?: (user: any) => void;
  onSuspendUser?: (user: any) => void;
  onManageTags?: (user: any) => void;
  onVerifyEmail?: (userId: Id<"users">) => void;
}

function UserRow({
  user,
  isSelected,
  currentUser,
  onSelect,
  onRoleChange,
  onViewDetails,
  onDeleteUser,
  onResetPassword,
  onSuspendUser,
  onManageTags,
  onVerifyEmail,
}: UserRowProps) {
  return (
    <TableRow className={user.suspended ? "bg-red-50/30 dark:bg-red-900/10" : ""}>
      <TableCell>
        <Checkbox
          checked={isSelected}
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
        <div className="flex gap-1">
          {user.suspended ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              <Ban className="h-3 w-3" />
              Suspended
            </Badge>
          ) : user.emailVerified ? (
            <Badge variant="outline" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs">
              <XCircle className="h-3 w-3" />
              Unverified
            </Badge>
          )}
        </div>
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
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {user.tags && user.tags.length > 0 ? (
            user.tags.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
          {user.tags && user.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{user.tags.length - 2}
            </Badge>
          )}
        </div>
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
            {onResetPassword && (
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <Key className="mr-2 h-4 w-4" /> Reset Password
              </DropdownMenuItem>
            )}
            {onVerifyEmail && !user.emailVerified && user.email && (
              <DropdownMenuItem onClick={() => onVerifyEmail(user._id)}>
                <Mail className="mr-2 h-4 w-4" /> Verify Email
              </DropdownMenuItem>
            )}
            {onSuspendUser && (
              <DropdownMenuItem onClick={() => onSuspendUser(user)}>
                {user.suspended ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Activate User
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Suspend User
                  </>
                )}
              </DropdownMenuItem>
            )}
            {onManageTags && (
              <DropdownMenuItem onClick={() => onManageTags(user)}>
                <TagIcon className="mr-2 h-4 w-4" /> Manage Tags
              </DropdownMenuItem>
            )}
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
  );
}