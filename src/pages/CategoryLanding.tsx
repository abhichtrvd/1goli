import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Activity, ShoppingCart, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const BRANDS = [
  "Dr. Reckeweg", 
  "SBL World Class", 
  "Schwabe India", 
  "Adel Pekana", 
  "Bakson's", 
  "Bjain Pharma",
  "Boiron"
];

export default function CategoryLanding() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  
  // Decode category from URL if needed, though react-router usually handles it
  const decodedCategory = category ? decodeURIComponent(category) : "";
  
  const products = useQuery(api.products.searchProducts, { 
    category: decodedCategory,
    brands: selectedBrands.length > 0 ? selectedBrands : undefined
  });

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand]);
    } else {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    }
  };

  const clearFilters = () => {
    setSelectedBrands([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 py-12 md:py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Badge className="mb-4 bg-lime-100 text-lime-800 hover:bg-lime-200 border-lime-200">
              Category
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
              {decodedCategory}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore our wide range of {decodedCategory} products. 
              Authentic remedies from trusted global brands.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                {selectedBrands.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Brands</h4>
                <div className="space-y-3">
                  {BRANDS.map((brand) => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`brand-${brand}`} 
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`brand-${brand}`} 
                        className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {brand}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </span>
                  {selectedBrands.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {selectedBrands.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Brands</h4>
                    <div className="space-y-3">
                      {BRANDS.map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`mobile-brand-${brand}`} 
                            checked={selectedBrands.includes(brand)}
                            onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                          />
                          <Label htmlFor={`mobile-brand-${brand}`}>{brand}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {products ? (
                  <>Showing <span className="font-medium text-foreground">{products.length}</span> results</>
                ) : (
                  "Loading products..."
                )}
              </p>
            </div>

            {products === undefined ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-[320px] bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-border/50">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or check back later.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border flex flex-col"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="relative aspect-square w-full flex items-center justify-center bg-secondary rounded-xl overflow-hidden mb-3">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                            <Activity className="h-8 w-8 mb-1" />
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground text-[10px] px-1.5 py-0 h-5 font-normal truncate">
                            {product.brand || "Generic"}
                          </Badge>
                        </div>
                        <h4 className="text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1" title={product.name}>
                          {product.name}
                        </h4>
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                        <span className="text-sm font-bold text-lime-600">₹{product.basePrice}</span>
                        <Button size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
