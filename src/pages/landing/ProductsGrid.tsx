import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Loader2, ArrowUpDown, Activity, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router";

interface ProductsGridProps {
  selectedBrand: string | undefined;
  setSelectedBrand: (brand: string | undefined) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  products: any[] | undefined;
  status: string;
  loadMore: (numItems: number) => void;
  isLoading: boolean;
}

export function ProductsGrid({
  selectedBrand,
  setSelectedBrand,
  sortBy,
  setSortBy,
  products,
  status,
  loadMore,
  isLoading
}: ProductsGridProps) {
  const navigate = useNavigate();

  return (
    <section id="products" className="py-20 bg-secondary">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {selectedBrand ? `${selectedBrand} Remedies` : "Popular Homeopathic Remedies"}
            </h3>
            <p className="text-muted-foreground text-lg">
              Trusted formulations for your holistic health.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedBrand && (
              <Button variant="ghost" onClick={() => setSelectedBrand(undefined)} className="text-muted-foreground hover:text-foreground">
                Clear Filter
              </Button>
            )}
            
            {!selectedBrand && (
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-card">
                  <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {products === undefined ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[240px] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xl">No remedies found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {products.map((product, index) => (
                  <CarouselItem key={product._id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="group relative bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border h-full"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      <div className="p-3 h-full flex flex-col">
                        <div className="relative aspect-square w-full flex items-center justify-center bg-secondary rounded-lg overflow-hidden mb-2">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                              <Activity className="h-6 w-6 mb-1" />
                              <span className="text-[10px]">No Image</span>
                            </div>
                          )}
                          <Badge variant="secondary" className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm text-black text-[9px] px-1.5 py-0 h-4">
                            New
                          </Badge>
                          {product.stock !== undefined && product.stock <= 0 && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <Badge variant="destructive">Out of Stock</Badge>
                            </div>
                          )}
                        </div>

                        <div className="mb-1">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {product.brand && (
                              <Badge variant="outline" className="text-muted-foreground border-border rounded-md px-1.5 py-0 text-[9px] font-normal truncate max-w-full inline-block">
                                {product.brand}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold mb-0.5 group-hover:text-primary transition-colors line-clamp-1" title={product.name}>{product.name}</h4>
                          
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex items-center bg-green-700 text-white px-1 py-0 rounded-[2px] text-[9px] font-bold">
                              {product.averageRating ? product.averageRating.toFixed(1) : "0.0"} <Star className="h-2 w-2 ml-0.5 fill-current" />
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              ({product.ratingCount || 0})
                            </span>
                          </div>

                          <p className="text-muted-foreground line-clamp-1 text-[10px]">
                            {product.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                          <span className="text-xs font-bold text-lime-600">₹{product.basePrice}</span>
                          <Button 
                            size="sm" 
                            className="rounded-full px-3 h-6 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={product.stock !== undefined && product.stock <= 0}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-4" />
                <CarouselNext className="-right-4" />
              </div>
            </Carousel>
            
            {status === "CanLoadMore" && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => loadMore(10)} 
                  disabled={isLoading}
                  className="rounded-full px-8"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load More Remedies
                </Button>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-12 text-center">
           <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => navigate('/search')}>
             View All Remedies
           </Button>
        </div>
      </div>
    </section>
  );
}