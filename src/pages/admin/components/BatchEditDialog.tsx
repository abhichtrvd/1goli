import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Id<"products">[];
  onSuccess: () => void;
}

export function BatchEditDialog({ open, onOpenChange, selectedIds, onSuccess }: BatchEditDialogProps) {
  const batchUpdate = useMutation(api.products_admin.batchUpdateProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("");
  const [discount, setDiscount] = useState("");
  const [availability, setAvailability] = useState<string>("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [minStock, setMinStock] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      toast.error("No products selected");
      return;
    }

    const updates: any = {};

    if (basePrice) updates.basePrice = parseFloat(basePrice);
    if (stock) updates.stock = parseInt(stock);
    if (discount) updates.discount = parseFloat(discount);
    if (availability) updates.availability = availability;
    if (reorderPoint) updates.reorderPoint = parseInt(reorderPoint);
    if (minStock) updates.minStock = parseInt(minStock);

    if (Object.keys(updates).length === 0) {
      toast.error("Please specify at least one field to update");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await batchUpdate({ ids: selectedIds, updates });
      toast.success(`Successfully updated ${result.updated} products`);
      onSuccess();
      onOpenChange(false);

      // Reset form
      setBasePrice("");
      setStock("");
      setDiscount("");
      setAvailability("");
      setReorderPoint("");
      setMinStock("");
    } catch (error) {
      toast.error("Failed to update products");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Edit Products</DialogTitle>
          <DialogDescription>
            Update {selectedIds.length} selected product{selectedIds.length !== 1 ? "s" : ""}. Leave fields empty to keep current values.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              placeholder="Leave empty to keep current"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              placeholder="Leave empty to keep current"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Leave empty to keep current"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger>
                <SelectValue placeholder="Leave empty to keep current" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderPoint">Reorder Point</Label>
            <Input
              id="reorderPoint"
              type="number"
              placeholder="Stock level to trigger reorder"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minStock">Minimum Stock</Label>
            <Input
              id="minStock"
              type="number"
              placeholder="Minimum stock threshold"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Products
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
