import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface ScheduledPrice {
  price: number;
  startDate: number;
  endDate?: number;
  isActive: boolean;
}

interface ScheduledPricesSectionProps {
  productId?: Id<"products">;
  scheduledPrices?: ScheduledPrice[];
}

export function ScheduledPricesSection({ productId, scheduledPrices = [] }: ScheduledPricesSectionProps) {
  const addScheduledPrice = useMutation(api.products_admin.addScheduledPrice);
  const removeScheduledPrice = useMutation(api.products_admin.removeScheduledPrice);

  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!productId) {
      toast.error("Save the product first before adding scheduled prices");
      return;
    }

    if (!price || !startDate) {
      toast.error("Please enter price and start date");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const startDateMs = new Date(startDate).getTime();
    const endDateMs = endDate ? new Date(endDate).getTime() : undefined;

    if (endDateMs && endDateMs <= startDateMs) {
      toast.error("End date must be after start date");
      return;
    }

    setIsAdding(true);
    try {
      await addScheduledPrice({
        productId,
        price: priceNum,
        startDate: startDateMs,
        endDate: endDateMs,
      });
      toast.success("Scheduled price added");
      setPrice("");
      setStartDate("");
      setEndDate("");
    } catch (error) {
      toast.error("Failed to add scheduled price");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (index: number) => {
    if (!productId) return;

    try {
      await removeScheduledPrice({ productId, index });
      toast.success("Scheduled price removed");
    } catch (error) {
      toast.error("Failed to remove scheduled price");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Scheduled Prices</h3>
      </div>

      {!productId && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
          Save the product first to add scheduled prices
        </div>
      )}

      {productId && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="scheduledPrice" className="text-xs">
                New Price
              </Label>
              <Input
                id="scheduledPrice"
                type="number"
                step="0.01"
                placeholder="₹ 99.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">
                End Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={isAdding}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Scheduled Price
          </Button>
        </div>
      )}

      {scheduledPrices.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Current Schedules</Label>
          {scheduledPrices.map((scheduled, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">₹{scheduled.price}</span>
                  <Badge variant={scheduled.isActive ? "default" : "secondary"}>
                    {scheduled.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Starts: {formatDate(scheduled.startDate)}
                  {scheduled.endDate && ` • Ends: ${formatDate(scheduled.endDate)}`}
                </div>
              </div>
              {productId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
