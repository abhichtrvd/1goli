import { useSearchParams, useNavigate } from "react-router";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart, Filter, X, Check, ArrowUpDown, ChevronLeft, ChevronRight, Star, Info } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const POTENCIES = [
  "Mother Tincture",
  "30C",
  "200C",
  "1M",
  "10M",
  "3X",
  "6X",
  "12X",
  "CM"
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
  const [selectedPotencies, setSelectedPotencies] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, category, selectedBrands, selectedForms, selectedUses, selectedPotencies, priceRange, inStockOnly, sortBy]);

  // Strategy: Use usePaginatedQuery for browsing (no text query) and useQuery for text search
  const isSearchMode = query.length > 0;

  // 1. Search Mode Query
  const searchResults = useQuery(api.products.searchProducts, isSearchMode ? { 
    query, 
    category, 
    brands: selectedBrands.length > 0 ? selectedBrands : undefined,
    forms: selectedForms.length > 0 ? selectedForms : undefined,
    symptoms: selectedUses.length > 0 ? selectedUses : undefined,
    potencies: selectedPotencies.length > 0 ? selectedPotencies : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    inStockOnly: inStockOnly ? true : undefined,
    sort: sortBy !== "relevance" ? sortBy : undefined
  } : "skip");

  // 2. Browsing Mode Query (Paginated)
  const { results: paginatedResults, status, loadMore, isLoading } = usePaginatedQuery(
    api.products.getPaginatedProducts,
    !isSearchMode ? {
      category,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      forms: selectedForms.length > 0 ? selectedForms : undefined,
      symptoms: selectedUses.length > 0 ? selectedUses : undefined,
      potencies: selectedPotencies.length > 0 ? selectedPotencies : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
      inStockOnly: inStockOnly ? true : undefined,
      sort: sortBy !== "relevance" ? sortBy : undefined
    } : "skip",
    { initialNumItems: ITEMS_PER_PAGE }
  );

  // 3. Get Total Count for Browsing Mode
  const totalCount = useQuery(api.products.getProductsCount, !isSearchMode ? {
    category,
    brands: selectedBrands.length > 0 ? selectedBrands : undefined,
    forms: selectedForms.length > 0 ? selectedForms : undefined,
    symptoms: selectedUses.length > 0 ? selectedUses : undefined,
    potencies: selectedPotencies.length > 0 ? selectedPotencies : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    inStockOnly: inStockOnly ? true : undefined,
  } : "skip");

  // Determine which products to display
  let displayProducts: any[] = [];
  let totalItems = 0;
  let totalPages = 0;
  let showLoadMore = false;

  if (isSearchMode) {
    // Client-side pagination for search results
    const allResults = searchResults || [];
    totalItems = allResults.length;
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    displayProducts = allResults.slice(startIndex, endIndex);
  } else {
    // Server-side pagination for browsing
    displayProducts = paginatedResults || [];
    totalItems = totalCount || 0; // Use the fetched total count
    // For infinite scroll style pagination, we don't know total pages easily without another query.
    // We will use "Load More" button instead of numbered pagination for this mode.
    showLoadMore = status === "CanLoadMore";
  }

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

  const togglePotency = (potency: string) => {
    setSelectedPotencies(prev => 
      prev.includes(potency) ? prev.filter(p => p !== potency) : [...prev, potency]
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
    setSelectedPotencies([]);
    setPriceRange([0, 5000]);
    setInStockOnly(false);
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const activeFiltersCount = 
    (category ? 1 : 0) + 
    selectedBrands.length + 
    selectedForms.length + 
    selectedUses.length +
    selectedPotencies.length +
    (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

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
        <h4 className="text-sm font-medium">Availability</h4>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="in-stock" 
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked === true)}
          />
          <Label 
            htmlFor="in-stock" 
            className="text-sm font-normal cursor-pointer leading-none"
          >
            In Stock Only
          </Label>
        </div>
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
        <h4 className="text-sm font-medium">Potency</h4>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-2">
            {POTENCIES.map((potency) => (
              <div key={potency} className="flex items-center space-x-2">
                <Checkbox 
                  id={`potency-${potency}`} 
                  checked={selectedPotencies.includes(potency)}
                  onCheckedChange={() => togglePotency(potency)}
                />
                <Label 
                  htmlFor={`potency-${potency}`} 
                  className="text-sm font-normal cursor-pointer leading-none"
                >
                  {potency}
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
              {/* Show count only if we have it loaded or in search mode */}
              {(isSearchMode && searchResults) && ` (${searchResults.length} items)`}
              {(!isSearchMode && totalCount !== undefined) && ` (${totalCount} items)`}
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
                <SelectItem value="rating_desc">Rating: High to Low</SelectItem>
                <SelectItem value="rating_asc">Rating: Low to High</SelectItem>
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
            {(isSearchMode && searchResults === undefined) || (!isSearchMode && paginatedResults === undefined) ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-[320px] bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
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
                  {displayProducts.map((product, index) => (
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
                          {product.stock <= 0 && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <Badge variant="destructive">Out of Stock</Badge>
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
                          
                          <div className="flex items-center gap-1 mb-1.5">
                            <div className="flex items-center bg-green-700 text-white px-1 py-0 rounded-[2px] text-[9px] font-bold">
                              {product.averageRating ? product.averageRating.toFixed(1) : "0.0"} <Star className="h-2 w-2 ml-0.5 fill-current" />
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              ({product.ratingCount || 0} reviews)
                            </span>
                          </div>

                          {/* Enhanced Product Details */}
                          <div className="space-y-1.5 mb-2">
                            {product.forms && product.forms.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.forms.slice(0, 2).map((form: string) => (
                                  <span key={form} className="text-[9px] border border-border px-1 rounded text-muted-foreground bg-background">
                                    {form}
                                  </span>
                                ))}
                                {product.forms.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">+{product.forms.length - 2}</span>
                                )}
                              </div>
                            )}

                            {product.potencies && product.potencies.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.potencies.slice(0, 2).map((pot: string) => (
                                  <span key={pot} className="text-[9px] border border-border px-1 rounded text-muted-foreground bg-background">
                                    {pot}
                                  </span>
                                ))}
                                {product.potencies.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">+{product.potencies.length - 2}</span>
                                )}
                              </div>
                            )}
                            
                            {product.symptomsTags && product.symptomsTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.symptomsTags.slice(0, 2).map((tag: string) => (
                                  <span key={tag} className="text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 px-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {product.symptomsTags.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">+{product.symptomsTags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                          <span className="text-sm font-bold text-lime-600">₹{product.basePrice}</span>
                          <Button 
                            size="icon" 
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            disabled={product.stock <= 0}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {isSearchMode ? (
                  totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                  )
                ) : (
                  showLoadMore && (
                    <div className="flex justify-center pt-4 pb-8">
                      <Button 
                        variant="outline" 
                        onClick={() => loadMore(ITEMS_PER_PAGE)} 
                        disabled={isLoading}
                        className="rounded-full px-8"
                      >
                        {isLoading ? <Activity className="h-4 w-4 animate-spin mr-2" /> : null}
                        Load More Products
                      </Button>
                    </div>
                  )
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