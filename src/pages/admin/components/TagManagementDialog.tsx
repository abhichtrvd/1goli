import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Tag, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagManagementDialogProps {
  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PREDEFINED_TAGS = ["VIP", "New", "Inactive", "Premium", "Verified", "Wholesale", "Retail"];

export function TagManagementDialog({ user, open, onOpenChange, onSuccess }: TagManagementDialogProps) {
  const addTag = useMutation(api.users.addUserTag);
  const removeTag = useMutation(api.users.removeUserTag);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userTags = user?.tags || [];

  const handleAddTag = async (tag: string) => {
    if (!user || !tag.trim()) return;

    setIsSubmitting(true);
    try {
      await addTag({
        userId: user._id as Id<"users">,
        tag: tag.trim(),
      });
      toast.success(`Tag "${tag}" added successfully`);
      setNewTag("");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to add tag");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await removeTag({
        userId: user._id as Id<"users">,
        tag,
      });
      toast.success(`Tag "${tag}" removed successfully`);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove tag");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomTag = () => {
    if (newTag.trim()) {
      handleAddTag(newTag.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleClose = () => {
    setNewTag("");
    onOpenChange(false);
  };

  const availablePredefinedTags = PREDEFINED_TAGS.filter((tag) => !userTags.includes(tag));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage User Tags
          </DialogTitle>
          <DialogDescription>
            Add or remove tags for {user?.name || user?.email || "this user"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Tags */}
          <div className="space-y-2">
            <Label>Current Tags</Label>
            {userTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userTags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No tags assigned</p>
            )}
          </div>

          {/* Add Custom Tag */}
          <div className="space-y-2">
            <Label htmlFor="newTag">Add Custom Tag</Label>
            <div className="flex gap-2">
              <Input
                id="newTag"
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
              />
              <Button
                onClick={handleAddCustomTag}
                disabled={!newTag.trim() || isSubmitting}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Predefined Tags */}
          {availablePredefinedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Add</Label>
              <div className="flex flex-wrap gap-2">
                {availablePredefinedTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTag(tag)}
                    disabled={isSubmitting}
                    className="h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-muted/50 border rounded-lg">
            <p className="text-xs text-muted-foreground">
              Tags help you organize and segment users for targeted messaging, filtering, and reporting.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
