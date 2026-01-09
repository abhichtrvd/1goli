import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Copy, CheckCircle2, Mail, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordResetDialogProps {
  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordResetDialog({ user, open, onOpenChange }: PasswordResetDialogProps) {
  const generateToken = useMutation(api.users.generateResetToken);
  const [resetData, setResetData] = useState<{ token: string; expiry: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateToken = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const result = await generateToken({ userId: user._id as Id<"users"> });
      setResetData({ token: result.token, expiry: result.expiry });
      toast.success("Password reset token generated successfully");
    } catch (error) {
      toast.error("Failed to generate reset token");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (resetData) {
      const resetUrl = `${window.location.origin}/reset-password?token=${resetData.token}`;
      navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      toast.success("Reset URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setResetData(null);
    setCopied(false);
    onOpenChange(false);
  };

  const resetUrl = resetData ? `${window.location.origin}/reset-password?token=${resetData.token}` : "";
  const expiryDate = resetData ? new Date(resetData.expiry).toLocaleString() : "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Generate a password reset link for {user?.name || user?.email || "this user"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!resetData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <Mail className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">User Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "No email address"}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>A secure reset token will be generated that:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Expires in 24 hours</li>
                  <li>Can be used once to reset the password</li>
                  <li>Should be sent to the user via email</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">Token Generated</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Expires: {expiryDate}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reset URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={resetUrl}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToken}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this URL with the user to reset their password.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Security Note:</strong> This link should be sent directly to the user via a secure channel. Anyone with this link can reset the password.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!resetData ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerateToken} disabled={isGenerating || !user?.email}>
                {isGenerating ? "Generating..." : "Generate Reset Link"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
