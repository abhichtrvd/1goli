import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSubmit: (data: { refundAmount: number; refundReason: string; status?: string; refundId?: string }) => Promise<void>;
}

export function RefundDialog({ open, onOpenChange, order, onSubmit }: RefundDialogProps) {
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [refundId, setRefundId] = useState("");
  const [status, setStatus] = useState<string>("approved");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNewRefund = !order?.refundStatus || order?.refundStatus === "none";
  const canProcess = order?.refundStatus === "requested";

  const handleSubmit = async () => {
    if (!refundAmount || !refundReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        refundAmount: parseFloat(refundAmount),
        refundReason,
        ...(canProcess ? { status, refundId } : {}),
      });

      setRefundAmount("");
      setRefundReason("");
      setRefundId("");
      setStatus("approved");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNewRefund ? "Request Refund" : canProcess ? "Process Refund" : "Refund Details"}
          </DialogTitle>
          <DialogDescription>
            {isNewRefund
              ? "Initiate a refund request for this order"
              : canProcess
              ? "Process the pending refund request"
              : "View refund information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="refundAmount">Refund Amount</Label>
            <Input
              id="refundAmount"
              type="number"
              step="0.01"
              placeholder={order?.total ? `Max: ${order.total}` : "0.00"}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              disabled={!isNewRefund}
            />
          </div>

          <div>
            <Label htmlFor="refundReason">Reason</Label>
            <Textarea
              id="refundReason"
              placeholder="Explain the reason for the refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              disabled={!isNewRefund}
              rows={3}
            />
          </div>

          {canProcess && (
            <>
              <div>
                <Label htmlFor="status">Action</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="processed">Process (Complete)</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="refundId">Refund Transaction ID</Label>
                <Input
                  id="refundId"
                  placeholder="REFUND-12345"
                  value={refundId}
                  onChange={(e) => setRefundId(e.target.value)}
                />
              </div>
            </>
          )}

          {order?.refundStatus && order.refundStatus !== "none" && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">Current Status: {order.refundStatus}</div>
              {order.refundAmount && <div>Amount: ${order.refundAmount.toFixed(2)}</div>}
              {order.refundReason && <div>Reason: {order.refundReason}</div>}
              {order.refundId && <div>ID: {order.refundId}</div>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {(isNewRefund || canProcess) && (
            <Button onClick={handleSubmit} disabled={!refundAmount || !refundReason || isSubmitting}>
              {isSubmitting ? "Processing..." : isNewRefund ? "Request Refund" : "Process"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
