import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSubmit: (data: {
    returnReason: string;
    status: string;
    exchangeRequested?: boolean;
  }) => Promise<void>;
}

export function ReturnDialog({ open, onOpenChange, order, onSubmit }: ReturnDialogProps) {
  const [returnReason, setReturnReason] = useState("");
  const [status, setStatus] = useState("requested");
  const [exchangeRequested, setExchangeRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setReturnReason(order.returnReason || "");
      setStatus(order.returnStatus || "requested");
      setExchangeRequested(order.exchangeRequested || false);
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!returnReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        returnReason,
        status,
        exchangeRequested,
      });

      setReturnReason("");
      setStatus("requested");
      setExchangeRequested(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return / Exchange</DialogTitle>
          <DialogDescription>
            Process return or exchange request for this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Return Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processed">Processed (Complete)</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="returnReason">Reason</Label>
            <Textarea
              id="returnReason"
              placeholder="Explain the reason for return/exchange..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exchange"
              checked={exchangeRequested}
              onCheckedChange={(checked) => setExchangeRequested(checked === true)}
            />
            <Label htmlFor="exchange" className="cursor-pointer">
              This is an exchange request (not a return)
            </Label>
          </div>

          {order?.returnStatus && order.returnStatus !== "none" && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">Current Status: {order.returnStatus}</div>
              {order.returnReason && <div>Reason: {order.returnReason}</div>}
              {order.exchangeRequested && <div className="text-orange-600">Exchange requested</div>}
              {order.returnRequestedAt && (
                <div>Requested: {new Date(order.returnRequestedAt).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!returnReason || isSubmitting}>
            {isSubmitting ? "Processing..." : "Update Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
