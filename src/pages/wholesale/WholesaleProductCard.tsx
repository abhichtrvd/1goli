import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";

interface WholesaleProductCardProps {
  product: any;
  category: string;
  quantity: number;
  selection: { potency?: string; packingSize?: string };
  isAddingToCart: boolean;
  onQuantityChange: (delta: number) => void;
  onSelectionChange: (field: 'potency' | 'packingSize', value: string) => void;
  onAddToCart: () => void;
}

const DILUTION_POTENCIES = ["1x", "2x", "3x", "6ch", "30ch", "200ch", "1000ch", "1m", "lm", "cm"];

export function WholesaleProductCard({
  product,
  category,
  quantity,
  selection,
  isAddingToCart,
  onQuantityChange,
  onSelectionChange,
  onAddToCart
}: WholesaleProductCardProps) {
  const availablePackingSizes = product.packingSizes || ["30ml", "100ml", "450ml"];
  const availablePotencies = category === "Dilution" ? DILUTION_POTENCIES : (product.potencies || []);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base">{product.name}</h4>
            {product.availability === "out_of_stock" && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1">Out of Stock</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
        </div>
        <p className="text-sm font-bold">₹{product.basePrice}</p>
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Potency Selection */}
        {category === "Mother Tincture" ? (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Potency</span>
            <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm font-medium text-muted-foreground border border-transparent">
              Q (Mother Tincture)
            </div>
          </div>
        ) : (category !== "Patent" && category !== "Cosmetics") && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Potency</span>
            <Select
              value={selection.potency || (category === "Dilution" ? "30ch" : availablePotencies[0])}
              onValueChange={(val) => onSelectionChange('potency', val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Potency" />
              </SelectTrigger>
              <SelectContent>
                {availablePotencies.map((p: string) => (
                  <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Packing Size Selection */}
        <div className="space-y-1 col-span-1">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pack Size</span>
          <Select
            value={selection.packingSize || availablePackingSizes[0]}
            onValueChange={(val) => onSelectionChange('packingSize', val)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select Size" />
            </SelectTrigger>
            <SelectContent>
              {availablePackingSizes.map((s: string) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center bg-background rounded-md border shadow-sm h-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-full w-8 rounded-none rounded-l-md"
            onClick={() => onQuantityChange(-1)}
            disabled={product.availability === "out_of_stock"}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <div className="w-8 text-center font-medium text-xs">
            {quantity}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-full w-8 rounded-none rounded-r-md"
            onClick={() => onQuantityChange(1)}
            disabled={product.availability === "out_of_stock"}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          size="sm"
          className="bg-[#A6FF00] text-black hover:bg-[#98f000] font-semibold h-8 px-4 text-xs"
          onClick={onAddToCart}
          disabled={isAddingToCart || product.availability === "out_of_stock"}
        >
          {isAddingToCart ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              Add <ShoppingCart className="ml-2 h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
