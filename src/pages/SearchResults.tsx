import { useSearchParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  
  const products = useQuery(api.products.searchProducts, { query });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            Showing results for "<span className="font-medium text-foreground">{query}</span>"
          </p>
        </div>

        {products === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[280px] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-border/50">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No remedies found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any products matching "{query}".
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Home
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="p-4 h-full flex flex-col">
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
                    <Badge variant="secondary" className="mb-2 bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 rounded-md px-1.5 py-0 text-[10px] font-normal truncate max-w-full inline-block">
                      {product.category || "Homeopathy"}
                    </Badge>
                    <h4 className="text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1" title={product.name}>{product.name}</h4>
                    <p className="text-muted-foreground line-clamp-1 text-xs mt-1">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <span className="text-sm font-medium text-lime-600">₹{product.basePrice}</span>
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
  );
}