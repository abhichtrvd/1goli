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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[400px] bg-muted animate-pulse rounded-3xl" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white dark:bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-border"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="p-8 h-full flex flex-col">
                  <div className="mb-6">
                    <Badge variant="secondary" className="mb-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-3 font-normal">
                      {product.category || "Homeopathy"}
                    </Badge>
                    <h4 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">{product.name}</h4>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto relative aspect-square w-full flex items-center justify-center bg-secondary rounded-2xl overflow-hidden mb-6">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                        <Activity className="h-12 w-12 mb-2" />
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <span className="text-lg font-medium">From ${product.basePrice}</span>
                    <Button size="sm" className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                      Buy
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
