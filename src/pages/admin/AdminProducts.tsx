import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductForm } from "./components/ProductForm";
import { ProductTable } from "./components/ProductTable";
import { ProductViewDialog } from "./components/ProductViewDialog";

export default function AdminProducts() {
  const products = useQuery(api.products.getProducts);
  const deleteProduct = useMutation(api.products.deleteProduct);
  
  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [potencyFilter, setPotencyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 5;

  // Derive unique options from data for dynamic filters
  const uniqueCategories = Array.from(new Set(products?.map(p => p.category).filter(Boolean))).sort();
  const uniqueForms = Array.from(new Set(products?.flatMap(p => p.forms).filter(Boolean))).sort();
  const uniquePotencies = Array.from(new Set(products?.flatMap(p => p.potencies).filter(Boolean))).sort();
  const uniqueTags = Array.from(new Set(products?.flatMap(p => p.symptomsTags).filter(Boolean))).sort();

  const filteredProducts = products?.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.symptomsTags.some(tag => tag.toLowerCase().includes(searchLower))
    );
    const matchesForm = formFilter === "all" || p.forms.some(f => f.toLowerCase() === formFilter.toLowerCase());
    const matchesPotency = potencyFilter === "all" || p.potencies.some(pot => pot.toLowerCase() === potencyFilter.toLowerCase());
    const matchesCategory = categoryFilter === "all" || (p.category && p.category.toLowerCase() === categoryFilter.toLowerCase());
    const matchesAvailability = availabilityFilter === "all" || p.availability === availabilityFilter;
    const matchesTag = tagFilter === "all" || p.symptomsTags.some(t => t.toLowerCase() === tagFilter.toLowerCase());
    
    const price = p.basePrice;
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    const matchesPrice = price >= min && price <= max;
    
    return matchesSearch && matchesForm && matchesPotency && matchesCategory && matchesPrice && matchesAvailability && matchesTag;
  });

  // Pagination
  const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
  const paginatedProducts = filteredProducts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openViewDialog = (product: any) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: Id<"products">) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct({ id });
        toast.success("Product deleted");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <ProductForm 
              initialData={editingProduct} 
              onSuccess={() => {
                setIsDialogOpen(false);
                setEditingProduct(null);
              }} 
            />
          </DialogContent>
        </Dialog>

        <ProductViewDialog 
          product={viewingProduct} 
          open={isViewDialogOpen} 
          onOpenChange={setIsViewDialogOpen} 
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Products</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat: any) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>

              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by Form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {uniqueForms.map((form: any) => (
                    <SelectItem key={form} value={form}>{form}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={potencyFilter} onValueChange={setPotencyFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by Potency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Potencies</SelectItem>
                  {uniquePotencies.map((pot: any) => (
                    <SelectItem key={pot} value={pot}>{pot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {uniqueTags.map((tag: any) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Min Price" 
                  className="w-24"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number" 
                  placeholder="Max Price" 
                  className="w-24"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-8" 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductTable 
            products={paginatedProducts || []}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            onView={openViewDialog}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}