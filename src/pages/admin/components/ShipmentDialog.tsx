import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSubmit: (data: {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: number;
  }) => Promise<void>;
}

export function ShipmentDialog({ open, onOpenChange, order, onSubmit }: ShipmentDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.trackingNumber || "");
      setTrackingUrl(order.trackingUrl || "");
      setCarrier(order.carrier || "");
      if (order.estimatedDelivery) {
        setEstimatedDelivery(new Date(order.estimatedDelivery));
      }
    }
  }, [order]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
        carrier: carrier || undefined,
        estimatedDelivery: estimatedDelivery ? estimatedDelivery.getTime() : undefined,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const carriers = [
    "FedEx", "UPS", "USPS", "DHL", "Amazon Logistics",
    "Canada Post", "Royal Mail", "Australia Post", "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Shipment Tracking</DialogTitle>
          <DialogDescription>
            Update shipment and tracking information for this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier..." />
              </SelectTrigger>
              <SelectContent>
                {carriers.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              placeholder="1Z999AA10123456784"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="trackingUrl">Tracking URL</Label>
            <div className="flex gap-2">
              <Input
                id="trackingUrl"
                type="url"
                placeholder="https://..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
              {trackingUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(trackingUrl, '_blank')}
                  title="Open tracking link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label>Estimated Delivery</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {estimatedDelivery ? format(estimatedDelivery, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={estimatedDelivery}
                  onSelect={setEstimatedDelivery}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {order?.shippedAt && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">Shipped: {new Date(order.shippedAt).toLocaleString()}</div>
              {order.deliveredAt && (
                <div>Delivered: {new Date(order.deliveredAt).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
