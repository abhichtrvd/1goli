import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare } from "lucide-react";

interface GenericBulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel: React.ReactNode;
  title: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  onSubmit: () => void;
  submitLabel: string;
}

export function GenericBulkUpdateDialog({
  open,
  onOpenChange,
  triggerLabel,
  title,
  label,
  value,
  onValueChange,
  options,
  onSubmit,
  submitLabel
}: GenericBulkUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <CheckSquare className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onSubmit} className="w-full">
            {submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
