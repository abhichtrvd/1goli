import { useSearchParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const CATEGORIES = [
  "Dilution",
  "Mother Tincture",
  "Biochemics",
  "Bio Combinations",
  "Triturations",
  "Patent",
  "Cosmetics"
];

const BRANDS = [
  "Dr. Reckeweg", 
  "SBL World Class", 
  "Schwabe India", 
  "Adel Pekana", 
  "Bakson's", 
  "Bjain Pharma"
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const navigate = useNavigate();
  
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  
  const brandsArg = selectedBrand !== "all" ? [selectedBrand] : undefined;
  const products = useQuery(api.products.searchProducts, { query, category, brands: brandsArg });

  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", value);
    }
    setSearchParams(newParams);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    newParams.delete("q");
    setSearchParams(newParams);
    setSelectedBrand("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {category ? `${category} Remedies` : "Search Results"}
            </h1>
            <p className="text-muted-foreground">
              {query && (
                <span>
                  Results for "<span className="font-medium text-foreground">{query}</span>"
                </span>
              )}
              {query && category && <span> in </span>}
              {category && (
                <span className="font-medium text-foreground">{category}</span>
              )}
              {!query && !category && "Showing all products"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(query || category || selectedBrand !== "all") && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {products === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="h-[200px] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-border/50">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No remedies found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any products matching your criteria.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border flex flex-col h-full"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="p-2.5 h-full flex flex-col">
                  <div className="relative aspect-square w-full flex items-center justify-center bg-secondary rounded-lg overflow-hidden mb-2">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                        <Activity className="h-5 w-5 mb-1" />
                        <span className="text-[9px]">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-1.5 flex-1">
                    <div className="flex flex-wrap gap-1 mb-1">
                      <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 rounded-md px-1.5 py-0 text-[9px] font-normal truncate max-w-full inline-block">
                        {product.category || "Homeopathy"}
                      </Badge>
                      {product.brand && (
                        <Badge variant="outline" className="text-muted-foreground border-border rounded-md px-1.5 py-0 text-[9px] font-normal truncate max-w-full inline-block">
                          {product.brand}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2" title={product.name}>{product.name}</h4>
                    <p className="text-muted-foreground line-clamp-1 text-[9px] mt-0.5">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border/50">
                    <span className="text-xs font-medium text-lime-600">₹{product.basePrice}</span>
                    <Button size="icon" className="h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                      <ShoppingCart className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}