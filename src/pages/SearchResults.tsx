import { useSearchParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart, Filter, X, Check, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

const FORMS = [
  "Dilution",
  "Drops",
  "Tablets",
  "Ointment",
  "Syrup",
  "Mother Tincture",
  "Cream",
  "Gel"
];

const USES = [
  "Hair Fall",
  "Skin Care",
  "Digestion",
  "Fever",
  "Cough",
  "Cold",
  "Pain",
  "Immunity",
  "Injury",
  "Arthritis",
  "Acidity",
  "Headache"
];

const ITEMS_PER_PAGE = 12;

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const navigate = useNavigate();
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedUses, setSelectedUses] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, category, selectedBrands, selectedForms, selectedUses, priceRange, sortBy]);

  const products = useQuery(api.products.searchProducts, { 
    query, 
    category, 
    brands: selectedBrands.length > 0 ? selectedBrands : undefined,
    forms: selectedForms.length > 0 ? selectedForms : undefined,
    symptoms: selectedUses.length > 0 ? selectedUses : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    sort: sortBy !== "relevance" ? sortBy : undefined
  });

  // Client-side pagination logic
  const totalItems = products?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products?.slice(startIndex, endIndex);

  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", value);
    }
    setSearchParams(newParams);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleForm = (form: string) => {
    setSelectedForms(prev => 
      prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]
    );
  };

  const toggleUse = (use: string) => {
    setSelectedUses(prev => 
      prev.includes(use) ? prev.filter(u => u !== use) : [...prev, use]
    );
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    newParams.delete("q");
    setSearchParams(newParams);
    setSelectedBrands([]);
    setSelectedForms([]);
    setSelectedUses([]);
    setPriceRange([0, 5000]);
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const activeFiltersCount = 
    (category ? 1 : 0) + 
    selectedBrands.length + 
    selectedForms.length + 
    selectedUses.length +
    (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {activeFiltersCount} Active
            </Badge>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters} 
            className="w-full text-muted-foreground h-8 mb-2"
          >
            Clear All
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Category</h4>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cat-all" 
                checked={!category}
                onCheckedChange={() => handleCategoryChange("all")}
              />
              <Label 
                htmlFor="cat-all" 
                className="text-sm font-normal cursor-pointer leading-none"
              >
                All Categories
              </Label>
            </div>
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center space-x-2">
                <Checkbox 
                  id={`cat-${cat}`} 
                  checked={category === cat}
                  onCheckedChange={() => handleCategoryChange(cat)}
                />
                <Label 
                  htmlFor={`cat-${cat}`} 
                  className="text-sm font-normal cursor-pointer leading-none"
                >
                  {cat}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Price Range</h4>
          <span className="text-xs text-muted-foreground">₹{priceRange[0]} - ₹{priceRange[1]}+</span>
        </div>
        <div className="px-2">
          <Slider
            defaultValue={[0, 5000]}
            value={[priceRange[0], priceRange[1]]}
            max={5000}
            step={100}
            onValueChange={(val) => setPriceRange([val[0], val[1]])}
            className="py-4"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Brands</h4>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-2">
            {BRANDS.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox 
                  id={`brand-${brand}`} 
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => toggleBrand(brand)}
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
        </ScrollArea>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Product Form</h4>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-2">
            {FORMS.map((form) => (
              <div key={form} className="flex items-center space-x-2">
                <Checkbox 
                  id={`form-${form}`} 
                  checked={selectedForms.includes(form)}
                  onCheckedChange={() => toggleForm(form)}
                />
                <Label 
                  htmlFor={`form-${form}`} 
                  className="text-sm font-normal cursor-pointer leading-none"
                >
                  {form}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Uses / Symptoms</h4>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-2">
            {USES.map((use) => (
              <div key={use} className="flex items-center space-x-2">
                <Checkbox 
                  id={`use-${use}`} 
                  checked={selectedUses.includes(use)}
                  onCheckedChange={() => toggleUse(use)}
                />
                <Label 
                  htmlFor={`use-${use}`} 
                  className="text-sm font-normal cursor-pointer leading-none"
                >
                  {use}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
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
              {products && ` (${products.length} items)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
                <SelectItem value="name_desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - Products Grid */}
          <div className="flex-1 order-2 lg:order-1">
            {products === undefined ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-[280px] bg-muted animate-pulse rounded-xl" />
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {currentProducts?.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border flex flex-col h-full"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      <div className="p-3 h-full flex flex-col">
                        <div className="relative aspect-square w-full flex items-center justify-center bg-secondary rounded-lg overflow-hidden mb-3">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                              <Activity className="h-6 w-6 mb-1" />
                              <span className="text-[10px]">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="mb-2 flex-1">
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground hover:bg-secondary/80 rounded-md px-1.5 py-0 text-[10px] font-normal truncate max-w-full inline-block">
                              {product.category || "Homeopathy"}
                            </Badge>
                            {product.brand && (
                              <Badge variant="outline" className="text-muted-foreground border-border rounded-md px-1.5 py-0 text-[10px] font-normal truncate max-w-full inline-block">
                                {product.brand}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1" title={product.name}>{product.name}</h4>
                          <p className="text-muted-foreground line-clamp-2 text-[10px]">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                          <span className="text-sm font-bold text-lime-600">₹{product.basePrice}</span>
                          <Button size="icon" className="h-7 w-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first, last, and pages around current
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink 
                                isActive={page === currentPage}
                                onClick={() => setCurrentPage(page)}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 || 
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Filters (Desktop) */}
          <div className="hidden lg:block w-64 flex-shrink-0 order-1 lg:order-2">
            <div className="sticky top-24 border rounded-xl p-5 bg-card shadow-sm">
              <FilterContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}