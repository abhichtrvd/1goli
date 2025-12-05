import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Loader2, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const product = useQuery(api.products.getProduct, { id: id as Id<"products"> });
  const addToCart = useMutation(api.cart.addToCart);

  const [selectedPotency, setSelectedPotency] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  if (product === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (product === null) {
    return <div>Product not found</div>;
  }

  // Dynamic price calculation logic
  const getPrice = () => {
    let price = product.basePrice;
    if (selectedPotency === "Mother Tincture") price += 5;
    if (selectedPotency === "1M") price += 2;
    if (selectedForm === "Drops") price += 3;
    return price.toFixed(2);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart({
        productId: product._id,
        potency: selectedPotency,
        form: selectedForm,
        quantity: 1,
      });
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Section */}
          <div className="rounded-2xl overflow-hidden bg-white border shadow-sm">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover aspect-square"
            />
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-2">
              <Badge variant="outline" className="text-primary border-primary/20 mb-2">
                Homeopathic Medicine
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{product.name}</h1>
            <div className="flex flex-wrap gap-2 mb-6">
              {product.symptomsTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="prose prose-sm text-muted-foreground mb-8 leading-relaxed">
              <h3 className="text-foreground font-semibold mb-2">Indications</h3>
              <p>{product.description}</p>
            </div>

            <Card className="mt-auto border-primary/10 shadow-md bg-secondary/30">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        Potency
                        <span className="text-xs text-muted-foreground font-normal">(Strength)</span>
                      </label>
                      <Select value={selectedPotency} onValueChange={setSelectedPotency}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.potencies.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        Form
                        <span className="text-xs text-muted-foreground font-normal">(Type)</span>
                      </label>
                      <Select value={selectedForm} onValueChange={setSelectedForm}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.forms.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-3xl font-bold text-primary">${getPrice()}</p>
                  </div>
                </div>
                
                {/* Desktop Add to Cart */}
                <Button 
                  className="w-full h-12 text-lg hidden md:flex" 
                  disabled={!selectedPotency || !selectedForm || isAdding}
                  onClick={handleAddToCart}
                >
                  {isAdding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">${getPrice()}</p>
          </div>
          <Button 
            className="flex-1 h-12" 
            disabled={!selectedPotency || !selectedForm || isAdding}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}