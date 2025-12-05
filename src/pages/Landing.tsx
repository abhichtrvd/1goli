import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const products = useQuery(api.products.searchProducts, { query: searchQuery });
  const seed = useMutation(api.products.seedProducts);
  const navigate = useNavigate();

  useEffect(() => {
    seed();
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-20 md:pt-32 md:pb-32 text-center px-4 bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground mb-4">
            1g<span className="relative inline-block"><span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"><span className="w-[0.35em] h-[0.35em] bg-[#A6FF00] rounded-full translate-y-[0.1em]" /></span><span className="relative z-10">o</span></span>li.
          </h1>
          <h2 className="text-3xl md:text-5xl font-medium text-muted-foreground mb-8 tracking-tight">
            Pure. Potent. Personalized.
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              className="rounded-full px-8 h-12 text-lg bg-primary hover:bg-primary/90 text-white shadow-none"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Remedies
            </Button>
            <Button 
              variant="link" 
              size="lg" 
              className="text-primary text-lg hover:underline flex items-center gap-1"
            >
              Consult a Homeopath <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative max-w-2xl mx-auto mt-12">
             <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-1000" />
              <div className="relative bg-white/50 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-2 flex items-center">
                <Search className="ml-4 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="border-none shadow-none bg-transparent h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/70"
                  placeholder="Search remedies or symptoms (e.g., 'flu', 'arnica')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Products Grid - Bento Style */}
      <section id="products" className="py-20 bg-secondary/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-12 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {searchQuery ? "Search Results" : "Featured Remedies"}
            </h3>
            <p className="text-muted-foreground text-lg">
              Trusted formulations for your holistic health.
            </p>
          </div>

          {products === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-xl">No remedies found for "{searchQuery}".</p>
              <Button variant="link" onClick={() => setSearchQuery("")} className="mt-4">Clear Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white dark:bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-border/50"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <div className="p-8 h-full flex flex-col">
                    <div className="mb-6">
                      <Badge variant="secondary" className="mb-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-3 font-normal">
                        New
                      </Badge>
                      <h4 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">{product.name}</h4>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="mt-auto relative aspect-square w-full flex items-center justify-center bg-secondary/30 rounded-2xl overflow-hidden mb-6">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <span className="text-lg font-medium">From ${product.basePrice}</span>
                      <Button size="sm" className="rounded-full px-6 bg-primary text-white hover:bg-primary/90">
                        Buy
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-background">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Intelligent Homeopathy.
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Our AI analyzes your symptoms to recommend the perfect remedy. 
            Safe, effective, and personalized just for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-secondary rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group">
               <div className="z-10">
                 <h4 className="text-2xl font-semibold mb-2">Symptom Search</h4>
                 <p className="text-muted-foreground">Find what you need, instantly.</p>
               </div>
               <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-full" />
               <Search className="absolute bottom-8 right-8 h-32 w-32 text-primary/10 group-hover:text-primary/20 transition-colors duration-500" />
            </div>
            <div className="bg-black text-white rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group">
               <div className="z-10">
                 <h4 className="text-2xl font-semibold mb-2">Expert AI</h4>
                 <p className="text-gray-400">Guidance available 24/7.</p>
               </div>
               <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent" />
               <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}