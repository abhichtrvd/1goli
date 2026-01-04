import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserDetailsDialogProps {
  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information for {user?.name || "Anonymous User"}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.image} />
                <AvatarFallback className="text-lg">{user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user.name || "Anonymous"}</h3>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role || "user"}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground font-medium">User ID</span>
                <span className="col-span-2 font-mono text-xs">{user._id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Email</span>
                <span className="col-span-2">{user.email || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Phone</span>
                <span className="col-span-2">{user.phone || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Address</span>
                <span className="col-span-2">{user.address || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Joined</span>
                <span className="col-span-2">{new Date(user._creationTime).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Verified</span>
                <span className="col-span-2">
                  {user.emailVerificationTime ? "Email Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
