import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ProductViewDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductViewDialog({ product, open, onOpenChange }: ProductViewDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 mt-4">
          <div className="aspect-square bg-secondary/20 rounded-lg overflow-hidden flex items-center justify-center">
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-2xl font-semibold text-primary">₹{product.basePrice}</p>
                {product.availability === "out_of_stock" && (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Available Potencies</h3>
                <div className="flex flex-wrap gap-1">
                  {product.potencies.map((p: string) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Available Forms</h3>
                <div className="flex flex-wrap gap-1">
                  {product.forms.map((f: string) => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-sm">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {product.symptomsTags.map((t: string) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">Product ID: {product._id}</p>
              <p className="text-xs text-muted-foreground">Created: {new Date(product._creationTime).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
