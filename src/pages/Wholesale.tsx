import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Categories as requested
const CATEGORIES = [
  "Dilution",
  "Mother Tincture",
  "Biochemics",
  "Bio Combinations",
  "Triturations",
  "Patent"
];

export default function Wholesale() {
  const products = useQuery(api.products.getProducts);
  const addToCart = useMutation(api.cart.addToCart);
  const seed = useMutation(api.products.seedProducts);

  // Local state for quantities: { [productId]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    seed();
  }, []);

  if (products === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  // Group products by Brand -> Category
  const groupedProducts = products.reduce((acc, product) => {
    const brand = product.brand || "Other Brands";
    if (!acc[brand]) {
      acc[brand] = {};
      CATEGORIES.forEach(cat => acc[brand][cat] = []);
    }

    // Determine category bucket
    let categoryBucket = "Other";
    
    // Logic to map product to requested categories
    if (product.category === "Patent") categoryBucket = "Patent";
    else if (product.category === "Biochemics") categoryBucket = "Biochemics";
    else if (product.category === "Bio Combinations") categoryBucket = "Bio Combinations";
    else if (product.forms.includes("Dilution")) categoryBucket = "Dilution";
    else if (product.potencies.includes("Mother Tincture")) categoryBucket = "Mother Tincture";
    else if (product.forms.includes("Trituration") || product.forms.includes("Tablets")) categoryBucket = "Triturations";
    else {
        // Fallback logic if not explicitly matched
        if (product.forms.some(f => f.toLowerCase().includes("dilution"))) categoryBucket = "Dilution";
        else if (product.name.toLowerCase().includes("bio")) categoryBucket = "Biochemics";
        else categoryBucket = "Patent"; // Default to Patent if unsure for now
    }

    // Only add if it matches one of our target categories
    if (CATEGORIES.includes(categoryBucket)) {
        acc[brand][categoryBucket].push(product);
    }

    return acc;
  }, {} as Record<string, Record<string, typeof products>>);

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = async (product: any) => {
    const qty = quantities[product._id] || 1;
    setAddingToCart(prev => ({ ...prev, [product._id]: true }));
    
    try {
      // Defaulting potency/form for quick add. In a real wholesale app, 
      // you might want selectors for these if the product has multiple variants.
      // For this UI, we'll pick the first available or a default.
      const potency = product.potencies[0] || "N/A";
      const form = product.forms[0] || "N/A";

      await addToCart({
        productId: product._id,
        potency,
        form,
        quantity: qty
      });
      
      toast.success(`Added ${qty} ${product.name} to cart`);
      setQuantities(prev => ({ ...prev, [product._id]: 1 })); // Reset quantity
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-12 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Wholesale Ordering</h1>
          <p className="text-muted-foreground text-lg">
            Bulk order homeopathic medicines from top brands.
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {Object.entries(groupedProducts).map(([brand, categories]) => (
            <AccordionItem key={brand} value={brand} className="border rounded-xl px-4 bg-card shadow-sm">
              <AccordionTrigger className="text-xl font-semibold hover:no-underline py-6">
                {brand}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <Accordion type="single" collapsible className="w-full pl-4 border-l-2 border-muted ml-2">
                  {CATEGORIES.map((category) => {
                    const categoryProducts = categories[category];
                    if (!categoryProducts || categoryProducts.length === 0) return null;

                    return (
                      <AccordionItem key={category} value={`${brand}-${category}`} className="border-b-0 mb-2">
                        <AccordionTrigger className="text-lg font-medium text-lime-700 hover:text-lime-800 hover:no-underline py-3">
                          {category}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 mt-2">
                            {categoryProducts.map((product) => (
                              <div key={product._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-base">{product.name}</h4>
                                    {product.availability === "out_of_stock" && (
                                        <Badge variant="destructive" className="text-[10px] h-4 px-1">Out of Stock</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                                  <p className="text-sm font-bold mt-1">₹{product.basePrice}</p>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  <div className="flex items-center bg-background rounded-md border shadow-sm h-9">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-full w-9 rounded-none rounded-l-md"
                                      onClick={() => handleQuantityChange(product._id, -1)}
                                      disabled={product.availability === "out_of_stock"}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <div className="w-10 text-center font-medium text-sm">
                                      {quantities[product._id] || 1}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-full w-9 rounded-none rounded-r-md"
                                      onClick={() => handleQuantityChange(product._id, 1)}
                                      disabled={product.availability === "out_of_stock"}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <Button 
                                    size="sm" 
                                    className="bg-[#A6FF00] text-black hover:bg-[#98f000] font-semibold h-9 px-4"
                                    onClick={() => handleAddToCart(product)}
                                    disabled={addingToCart[product._id] || product.availability === "out_of_stock"}
                                  >
                                    {addingToCart[product._id] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        Add <ShoppingCart className="ml-2 h-3.5 w-3.5" />
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
