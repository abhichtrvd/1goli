import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Mail, MessageSquare, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkMessageDialogProps {
  users: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MESSAGE_TEMPLATES = {
  welcome: {
    label: "Welcome Message",
    subject: "Welcome to Our Platform!",
    body: "Dear {name},\n\nWelcome to our platform! We're excited to have you on board.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe Team",
  },
  promotion: {
    label: "Promotional Offer",
    subject: "Special Offer Just for You!",
    body: "Dear {name},\n\nWe have an exclusive offer for our valued customers!\n\n[Add your promotional details here]\n\nThis offer is valid for a limited time only.\n\nBest regards,\nThe Team",
  },
  warning: {
    label: "Account Warning",
    subject: "Important: Account Notice",
    body: "Dear {name},\n\nThis is an important notice regarding your account.\n\n[Add specific warning details here]\n\nPlease take action to avoid any service interruption.\n\nBest regards,\nThe Team",
  },
  announcement: {
    label: "General Announcement",
    subject: "Important Announcement",
    body: "Dear {name},\n\nWe have an important update to share with you.\n\n[Add your announcement here]\n\nThank you for being a valued member of our community.\n\nBest regards,\nThe Team",
  },
  custom: {
    label: "Custom Message",
    subject: "",
    body: "",
  },
};

export function BulkMessageDialog({ users, open, onOpenChange }: BulkMessageDialogProps) {
  const [template, setTemplate] = useState<keyof typeof MESSAGE_TEMPLATES>("custom");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"email" | "sms">("email");
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateChange = (value: keyof typeof MESSAGE_TEMPLATES) => {
    setTemplate(value);
    setSubject(MESSAGE_TEMPLATES[value].subject);
    setMessage(MESSAGE_TEMPLATES[value].body);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (messageType === "email" && !subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }

    // In a real implementation, this would call a mutation to send messages
    // For now, we'll just show a success message
    toast.success(`${messageType === "email" ? "Email" : "SMS"} will be sent to ${users.length} users`, {
      description: "This is a mock implementation. Integrate with your email/SMS service.",
    });

    handleClose();
  };

  const handleClose = () => {
    setTemplate("custom");
    setSubject("");
    setMessage("");
    setMessageType("email");
    setShowPreview(false);
    onOpenChange(false);
  };

  const previewMessage = (user: any) => {
    return message.replace(/{name}/g, user?.name || "User");
  };

  const recipientsWithEmail = users.filter((u) => u.email).length;
  const recipientsWithPhone = users.filter((u) => u.phone).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {messageType === "email" ? (
              <Mail className="h-5 w-5" />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
            Send Bulk Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {users.length} selected user{users.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message Type */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={(val) => setMessageType(val as "email" | "sms")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  Email ({recipientsWithEmail} recipients)
                </SelectItem>
                <SelectItem value="sms">
                  SMS ({recipientsWithPhone} recipients)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MESSAGE_TEMPLATES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject (Email only) */}
          {messageType === "email" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={messageType === "email" ? 10 : 5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use {"{name}"} to personalize with the recipient's name
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>

            {showPreview && users.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                <div className="text-sm font-medium">Preview for: {users[0].name || users[0].email}</div>
                {messageType === "email" && (
                  <div className="text-sm">
                    <strong>Subject:</strong> {subject}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                  <strong>Message:</strong>
                  <div className="mt-2 p-2 bg-background rounded border">
                    {previewMessage(users[0])}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> This is a mock implementation. To enable actual email/SMS delivery, integrate with services like SendGrid, Twilio, or AWS SES in your backend.
            </AlertDescription>
          </Alert>

          {/* Recipients Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {messageType === "email" ? (
                <>
                  <strong>{recipientsWithEmail}</strong> out of <strong>{users.length}</strong> selected users have email addresses and will receive this message.
                  {recipientsWithEmail < users.length && (
                    <span className="block mt-1">
                      {users.length - recipientsWithEmail} user(s) without email will be skipped.
                    </span>
                  )}
                </>
              ) : (
                <>
                  <strong>{recipientsWithPhone}</strong> out of <strong>{users.length}</strong> selected users have phone numbers and will receive this message.
                  {recipientsWithPhone < users.length && (
                    <span className="block mt-1">
                      {users.length - recipientsWithPhone} user(s) without phone will be skipped.
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSend}>
            Send to {messageType === "email" ? recipientsWithEmail : recipientsWithPhone} Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
