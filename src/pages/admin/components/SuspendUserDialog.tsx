import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SuspendUserDialogProps {
  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SUSPENSION_REASONS = [
  "Violation of Terms of Service",
  "Fraudulent Activity",
  "Abusive Behavior",
  "Spam or Malicious Content",
  "Payment Issues",
  "Security Concerns",
  "User Request",
  "Other",
];

export function SuspendUserDialog({ user, open, onOpenChange, onSuccess }: SuspendUserDialogProps) {
  const suspendUser = useMutation(api.users.suspendUser);
  const activateUser = useMutation(api.users.activateUser);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuspended = user?.suspended === true;

  const handleSubmit = async () => {
    if (!user) return;

    if (!isSuspended && !reason) {
      toast.error("Please select a reason for suspension");
      return;
    }

    if (!isSuspended && reason === "Other" && !customReason.trim()) {
      toast.error("Please provide a custom reason");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSuspended) {
        await activateUser({ userId: user._id as Id<"users"> });
        toast.success("User account activated successfully");
      } else {
        const finalReason = reason === "Other" ? customReason : reason;
        await suspendUser({
          userId: user._id as Id<"users">,
          reason: finalReason,
        });
        toast.success("User account suspended successfully");
      }
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isSuspended ? "activate" : "suspend"} user`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuspended ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Activate User Account
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-red-600" />
                Suspend User Account
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSuspended
              ? `Reactivate ${user?.name || user?.email || "this user"}'s account`
              : `Suspend ${user?.name || user?.email || "this user"}'s account`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isSuspended ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  Current Suspension Details
                </p>
                <div className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                  <p><strong>Reason:</strong> {user?.suspensionReason || "No reason provided"}</p>
                  {user?.suspendedAt && (
                    <p><strong>Suspended:</strong> {new Date(user.suspendedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Activating this account will allow the user to log in and access all features again.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Suspension Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUSPENSION_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reason === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="customReason">Custom Reason *</Label>
                  <Textarea
                    id="customReason"
                    placeholder="Provide a detailed reason for suspension..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> Suspended users will not be able to log in or access their account until reactivated.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant={isSuspended ? "default" : "destructive"}
          >
            {isSubmitting
              ? isSuspended
                ? "Activating..."
                : "Suspending..."
              : isSuspended
              ? "Activate Account"
              : "Suspend Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
