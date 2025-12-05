import { Navbar } from "@/components/Navbar";
import { AIWidget } from "@/components/AIWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const products = useQuery(api.products.searchProducts, { query: searchQuery });
  const seed = useMutation(api.products.seedProducts);
  const navigate = useNavigate();

  // Trigger seed on load if empty (simplified for this demo)
  // In production, this would be a script
  useEffect(() => {
    seed();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-secondary/30 py-12 md:py-20">
        <div className="container px-4 mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 tracking-tight">
            Natural Healing, <br className="hidden md:block" />
            Powered by Intelligence.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find the right homeopathic remedy for your symptoms instantly with our AI-powered search.
          </p>
          
          <div className="max-w-xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 text-lg bg-white shadow-sm border-primary/20 focus-visible:ring-primary"
                placeholder="Search symptoms (e.g., 'back pain', 'flu')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 container px-4 py-12 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            {searchQuery ? "Search Results" : "Featured Remedies"}
          </h2>
        </div>

        {products === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[300px] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No remedies found for "{searchQuery}".</p>
            <p className="text-sm text-muted-foreground mt-2">Try searching for symptoms like "fever", "stress", or "injury".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/10 group cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
                <div className="aspect-square overflow-hidden bg-secondary/20 relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-primary">{product.name}</CardTitle>
                    <span className="font-bold text-foreground">${product.basePrice}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.symptomsTags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50 text-secondary-foreground hover:bg-secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AIWidget />
    </div>
  );
}