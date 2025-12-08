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
import { Minus, Plus, ShoppingCart, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Categories as requested
const CATEGORIES = [
  "Dilution",
  "Mother Tincture",
  "Biochemics",
  "Bio Combinations",
  "Triturations",
  "Patent",
  "Cosmetics"
];

// Specific potencies for Dilutions as requested
const DILUTION_POTENCIES = ["1x", "2x", "3x", "6ch", "30ch", "200ch", "1000ch", "1m", "lm", "cm"];

export default function Wholesale() {
  const products = useQuery(api.products.getProducts);
  const addToCart = useMutation(api.cart.addToCart);
  const seed = useMutation(api.products.seedProducts);

  const [searchQuery, setSearchQuery] = useState("");

  // Local state for quantities: { [productId]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  
  // Local state for selections: { [productId]: { potency: string, packingSize: string } }
  const [selections, setSelections] = useState<Record<string, { potency: string, packingSize: string }>>({});

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

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by Brand -> Category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
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
    else if (product.category === "Personal Care") categoryBucket = "Cosmetics";
    else if (product.forms.includes("Dilution") || product.potencies.some(p => p.includes("C") || p.includes("M"))) categoryBucket = "Dilution";
    else if (product.potencies.includes("Mother Tincture") || product.potencies.includes("Q")) categoryBucket = "Mother Tincture";
    else if (product.forms.includes("Trituration") || product.forms.includes("Tablets")) categoryBucket = "Triturations";
    else {
        // Fallback logic
        if (product.forms.some(f => f.toLowerCase().includes("dilution"))) categoryBucket = "Dilution";
        else if (product.name.toLowerCase().includes("bio")) categoryBucket = "Biochemics";
        else categoryBucket = "Patent"; 
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

  const handleSelectionChange = (productId: string, field: 'potency' | 'packingSize', value: string) => {
    setSelections(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleAddToCart = async (product: any, category: string) => {
    const qty = quantities[product._id] || 1;
    
    // Determine Potency and Packing Size based on category and selection
    let potency = "N/A";
    let packingSize = "Standard";

    const selection = selections[product._id] || {};

    if (category === "Mother Tincture") {
        potency = "Q";
        packingSize = selection.packingSize || (product.packingSizes && product.packingSizes[0]) || "30ml";
    } else if (category === "Dilution") {
        potency = selection.potency || DILUTION_POTENCIES[4]; // Default to 30ch
        packingSize = selection.packingSize || (product.packingSizes && product.packingSizes[0]) || "30ml";
    } else if (category === "Patent" || category === "Cosmetics") {
        potency = "N/A"; // Or use variant if applicable
        packingSize = selection.packingSize || (product.packingSizes && product.packingSizes[0]) || "Standard";
    } else {
        // Biochemics, Bio Combinations, Triturations
        potency = selection.potency || (product.potencies && product.potencies[0]) || "6X";
        packingSize = selection.packingSize || (product.packingSizes && product.packingSizes[0]) || "25g";
    }

    setAddingToCart(prev => ({ ...prev, [product._id]: true }));
    
    try {
      await addToCart({
        productId: product._id,
        potency,
        form: category, // Using category as form for now to simplify
        packingSize,
        quantity: qty
      });
      
      toast.success(`Added ${qty} ${product.name} (${potency}, ${packingSize}) to cart`);
      setQuantities(prev => ({ ...prev, [product._id]: 1 })); 
    } catch (error) {
      toast.error("Failed to add to cart");
      console.error(error);
    } finally {
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-12 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Wholesale Ordering</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Bulk order homeopathic medicines from top brands.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for medicines (e.g. Arnica)..." 
              className="pl-9 bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {Object.keys(groupedProducts).length === 0 ? (
           <div className="text-center py-12 text-muted-foreground">
             No products found matching "{searchQuery}"
           </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {Object.entries(groupedProducts).map(([brand, categories]) => {
              // Check if brand has any products in any category
              const hasProducts = Object.values(categories).some(list => list && list.length > 0);
              if (!hasProducts) return null;

              return (
                <AccordionItem key={brand} value={brand} className="border rounded-xl px-4 bg-card shadow-sm">
                  <AccordionTrigger className="text-xl font-semibold hover:no-underline py-6">
                    {brand}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6">
                    <Accordion type="single" collapsible className="w-full pl-2 md:pl-4 border-l-2 border-muted ml-1 md:ml-2">
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
                                {categoryProducts.map((product) => {
                                    const selection = selections[product._id] || {};
                                    const availablePackingSizes = product.packingSizes || ["30ml", "100ml", "450ml"];
                                    const availablePotencies = category === "Dilution" ? DILUTION_POTENCIES : (product.potencies || []);

                                    return (
                                      <div key={product._id} className="flex flex-col gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
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
                                                        onValueChange={(val) => handleSelectionChange(product._id, 'potency', val)}
                                                    >
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Select Potency" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availablePotencies.map(p => (
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
                                                    onValueChange={(val) => handleSelectionChange(product._id, 'packingSize', val)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Select Size" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availablePackingSizes.map(s => (
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
                                              onClick={() => handleQuantityChange(product._id, -1)}
                                              disabled={product.availability === "out_of_stock"}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                            <div className="w-8 text-center font-medium text-xs">
                                              {quantities[product._id] || 1}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-full w-8 rounded-none rounded-r-md"
                                              onClick={() => handleQuantityChange(product._id, 1)}
                                              disabled={product.availability === "out_of_stock"}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          </div>

                                          <Button 
                                            size="sm" 
                                            className="bg-[#A6FF00] text-black hover:bg-[#98f000] font-semibold h-8 px-4 text-xs"
                                            onClick={() => handleAddToCart(product, category)}
                                            disabled={addingToCart[product._id] || product.availability === "out_of_stock"}
                                          >
                                            {addingToCart[product._id] ? (
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
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}