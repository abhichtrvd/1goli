import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Search, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, ExternalLink, Eye, Upload, X } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminProducts() {
  const products = useQuery(api.products.getProducts);
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Temporary state for inputs to show badges
  const [potenciesInput, setPotenciesInput] = useState("");
  const [formsInput, setFormsInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    let imageStorageId = undefined;
    if (selectedImage) {
      try {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await result.json();
        imageStorageId = storageId;
      } catch (error) {
        toast.error("Failed to upload image");
        setIsSubmitting(false);
        return;
      }
    }

    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      imageStorageId: imageStorageId,
      basePrice: parseFloat(formData.get("basePrice") as string),
      category: formData.get("category") as string,
      availability: formData.get("availability") as string,
      potencies: (formData.get("potencies") as string).split(",").map(s => s.trim()).filter(Boolean),
      forms: (formData.get("forms") as string).split(",").map(s => s.trim()).filter(Boolean),
      symptomsTags: (formData.get("symptomsTags") as string).split(",").map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editingProduct) {
        await updateProduct({
          id: editingProduct._id,
          ...productData,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct(productData);
        toast.success("Product created successfully");
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      setSelectedImage(null);
    } catch (error) {
      console.error(error);
      toast.error(editingProduct ? "Failed to update product" : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setPotenciesInput(product.potencies.join(", "));
    setFormsInput(product.forms.join(", "));
    setTagsInput(product.symptomsTags.join(", "));
    setImagePreview(product.imageUrl || "");
    setSelectedImage(null);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setPotenciesInput("");
    setFormsInput("");
    setTagsInput("");
    setImagePreview("");
    setSelectedImage(null);
    setIsDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" required defaultValue={editingProduct?.name} placeholder="e.g. Arnica Montana" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input id="basePrice" name="basePrice" type="number" step="0.01" required defaultValue={editingProduct?.basePrice} placeholder="12.99" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingProduct?.category || "Classical"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Classical">Classical</SelectItem>
                      <SelectItem value="Patent">Patent</SelectItem>
                      <SelectItem value="Biochemic">Biochemic</SelectItem>
                      <SelectItem value="Personal Care">Personal Care</SelectItem>
                      <SelectItem value="Mother Tincture">Mother Tincture</SelectItem>
                      <SelectItem value="Bach Flower">Bach Flower</SelectItem>
                      <SelectItem value="Bio-Combinations">Bio-Combinations</SelectItem>
                      <SelectItem value="Triturations">Triturations</SelectItem>
                      <SelectItem value="Drops">Drops</SelectItem>
                      <SelectItem value="Syrups">Syrups</SelectItem>
                      <SelectItem value="Ointments">Ointments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select name="availability" defaultValue={editingProduct?.availability || "in_stock"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required defaultValue={editingProduct?.description} placeholder="Product description..." />
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input 
                        id="imageFile" 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or use URL</span>
                      </div>
                    </div>
                    <Input 
                      id="imageUrl" 
                      name="imageUrl" 
                      value={selectedImage ? "" : imagePreview}
                      onChange={(e) => {
                        setImagePreview(e.target.value);
                        setSelectedImage(null);
                      }}
                      placeholder="https://..." 
                      disabled={!!selectedImage}
                    />
                  </div>
                  <div className="h-24 w-24 rounded-md border bg-secondary/20 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <button 
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setSelectedImage(null);
                          }}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No Image</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="potencies">Potencies</Label>
                  <Input 
                    id="potencies" 
                    name="potencies" 
                    required 
                    value={potenciesInput}
                    onChange={(e) => setPotenciesInput(e.target.value)}
                    placeholder="30C, 200C, 1M" 
                  />
                  <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
                    {potenciesInput.split(",").map(s => s.trim()).filter(Boolean).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forms">Forms</Label>
                  <Input 
                    id="forms" 
                    name="forms" 
                    required 
                    value={formsInput}
                    onChange={(e) => setFormsInput(e.target.value)}
                    placeholder="Dilution, Globules" 
                  />
                  <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
                    {formsInput.split(",").map(s => s.trim()).filter(Boolean).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptomsTags">Tags</Label>
                <Input 
                  id="symptomsTags" 
                  name="symptomsTags" 
                  required 
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="fever, pain, flu" 
                />
                <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
                  {tagsInput.split(",").map(s => s.trim()).filter(Boolean).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Product Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            {viewingProduct && (
              <div className="grid md:grid-cols-2 gap-8 mt-4">
                <div className="aspect-square bg-secondary/20 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={viewingProduct.imageUrl} alt={viewingProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">{viewingProduct.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-2xl font-semibold text-primary">${viewingProduct.basePrice}</p>
                      {viewingProduct.availability === "out_of_stock" && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                      {viewingProduct.category && (
                        <Badge variant="outline">{viewingProduct.category}</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{viewingProduct.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Available Potencies</h3>
                      <div className="flex flex-wrap gap-1">
                        {viewingProduct.potencies.map((p: string) => (
                          <Badge key={p} variant="secondary">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Available Forms</h3>
                      <div className="flex flex-wrap gap-1">
                        {viewingProduct.forms.map((f: string) => (
                          <Badge key={f} variant="secondary">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {viewingProduct.symptomsTags.map((t: string) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Product ID: {viewingProduct._id}</p>
                    <p className="text-xs text-muted-foreground">Created: {new Date(viewingProduct._creationTime).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Potencies</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts?.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} alt={product.name} className="h-8 w-8 rounded object-cover bg-secondary" />
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <Link to={`/product/${product._id}`} target="_blank" className="text-xs text-primary flex items-center hover:underline">
                          View on site <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{product.category || "Classical"}</Badge>
                  </TableCell>
                  <TableCell>${product.basePrice}</TableCell>
                  <TableCell>
                    {product.availability === "out_of_stock" ? (
                      <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                    ) : product.availability === "discontinued" ? (
                      <Badge variant="secondary" className="text-[10px]">Discontinued</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px]">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>{product.potencies.join(", ")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openViewDialog(product)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}