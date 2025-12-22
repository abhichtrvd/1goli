import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Search, Download, Trash2, Upload, RefreshCw } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductForm } from "./components/ProductForm";
import { ProductTable } from "./components/ProductTable";
import { ProductViewDialog } from "./components/ProductViewDialog";

export default function AdminProducts() {
  const products = useQuery(api.products.getProducts);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const bulkDeleteProducts = useMutation(api.products.bulkDeleteProducts);
  const bulkCreateProducts = useMutation(api.products.bulkCreateProducts);
  const bulkSyncImages = useAction(api.productActions.bulkSyncImages);
  
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
  const [selectedIds, setSelectedIds] = useState<Id<"products">[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      try {
        await bulkDeleteProducts({ ids: selectedIds });
        toast.success(`${selectedIds.length} products deleted`);
        setSelectedIds([]);
      } catch (error) {
        toast.error("Failed to delete products");
      }
    }
  };

  const handleSelect = (id: Id<"products">, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && paginatedProducts) {
      const newIds = paginatedProducts.map(p => p._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    } else if (paginatedProducts) {
      const pageIds = paginatedProducts.map(p => p._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleExportCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Name", "Description", "Brand", "Category", "Base Price", "Stock", "Availability", 
      "Potencies", "Forms", "Symptoms Tags", "Image URL", "Key Benefits", 
      "Directions For Use", "Safety Information", "Ingredients"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredProducts.map(p => [
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${(p.description || "").replace(/"/g, '""')}"`,
        `"${(p.brand || "").replace(/"/g, '""')}"`,
        `"${(p.category || "").replace(/"/g, '""')}"`,
        p.basePrice,
        p.stock,
        p.availability,
        `"${(p.potencies || []).join("; ")}"`,
        `"${(p.forms || []).join("; ")}"`,
        `"${(p.symptomsTags || []).join("; ")}"`,
        `"${(p.imageUrl || "").replace(/"/g, '""')}"`,
        `"${(p.keyBenefits || []).join("; ").replace(/"/g, '""')}"`,
        `"${(p.directionsForUse || "").replace(/"/g, '""')}"`,
        `"${(p.safetyInformation || "").replace(/"/g, '""')}"`,
        `"${(p.ingredients || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const rows = text.split("\n").map(row => row.trim()).filter(row => row);
        const headers = rows[0].split(",").map(h => h.replace(/^"|"$/g, '').trim());
        
        const productsToImport = [];
        
        // Simple CSV parser (handles quoted strings roughly)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Regex to split by comma but ignore commas inside quotes
          const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
          
          if (cleanValues.length < 5) continue; // Skip invalid rows

          const product: any = {};
          headers.forEach((header, index) => {
            const value = cleanValues[index];
            if (!value) return;

            switch(header) {
              case "Name": product.name = value; break;
              case "Description": product.description = value; break;
              case "Brand": product.brand = value; break;
              case "Category": product.category = value; break;
              case "Base Price": product.basePrice = parseFloat(value); break;
              case "Stock": product.stock = parseInt(value); break;
              case "Availability": product.availability = value; break;
              case "Potencies": product.potencies = value.split(";").map(s => s.trim()).filter(Boolean); break;
              case "Forms": product.forms = value.split(";").map(s => s.trim()).filter(Boolean); break;
              case "Symptoms Tags": product.symptomsTags = value.split(";").map(s => s.trim()).filter(Boolean); break;
              case "Image URL": product.imageUrl = value; break;
              case "Key Benefits": product.keyBenefits = value.split(";").map(s => s.trim()).filter(Boolean); break;
              case "Directions For Use": product.directionsForUse = value; break;
              case "Safety Information": product.safetyInformation = value; break;
              case "Ingredients": product.ingredients = value; break;
            }
          });

          // Validation defaults
          if (!product.name) continue;
          if (!product.description) product.description = "";
          if (!product.basePrice) product.basePrice = 0;
          if (!product.stock) product.stock = 0;
          if (!product.potencies) product.potencies = [];
          if (!product.forms) product.forms = [];
          if (!product.symptomsTags) product.symptomsTags = [];

          productsToImport.push(product);
        }

        if (productsToImport.length > 0) {
          await bulkCreateProducts({ products: productsToImport });
          toast.success(`Successfully imported ${productsToImport.length} products`);
        } else {
          toast.error("No valid products found in CSV");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to import CSV");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleBulkSyncImages = async () => {
    setIsSyncing(true);
    try {
      const result = await bulkSyncImages({});
      toast.success(`Synced ${result.syncedCount} images. Failed: ${result.failedCount}`);
    } catch (error) {
      toast.error("Failed to sync images");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImportCSV}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="secondary" onClick={handleBulkSyncImages} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} /> 
            {isSyncing ? "Syncing..." : "Sync Images"}
          </Button>
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
        </div>

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
              {selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
                </Button>
              )}
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
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}