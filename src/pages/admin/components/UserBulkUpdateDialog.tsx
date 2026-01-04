import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare } from "lucide-react";

interface UserBulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  role: string;
  onRoleChange: (value: string) => void;
  onSubmit: () => void;
}

export function UserBulkUpdateDialog({
  open,
  onOpenChange,
  selectedCount,
  role,
  onRoleChange,
  onSubmit
}: UserBulkUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <CheckSquare className="mr-2 h-4 w-4" /> Update Selected ({selectedCount})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Role</Label>
            <Select value={role} onValueChange={onRoleChange}>
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
          <Button onClick={onSubmit} className="w-full">
            Update {selectedCount} Users
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
