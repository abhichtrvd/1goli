import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Search, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, ExternalLink, Eye } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

export default function AdminProducts() {
  const products = useQuery(api.products.getProducts);
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  
  const [search, setSearch] = useState("");
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

  const itemsPerPage = 5;

  const filteredProducts = products?.filter(p => {
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.symptomsTags.some(tag => tag.toLowerCase().includes(searchLower))
    );
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
    
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      basePrice: parseFloat(formData.get("basePrice") as string),
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
    } catch (error) {
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
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setPotenciesInput("");
    setFormsInput("");
    setTagsInput("");
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
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required defaultValue={editingProduct?.description} placeholder="Product description..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" required defaultValue={editingProduct?.imageUrl} placeholder="https://..." />
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
                    <p className="text-2xl font-semibold text-primary mt-2">${viewingProduct.basePrice}</p>
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
          <div className="flex items-center justify-between">
            <CardTitle>All Products</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-8" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Potencies</TableHead>
                <TableHead>Tags</TableHead>
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
                  <TableCell>${product.basePrice}</TableCell>
                  <TableCell>{product.potencies.join(", ")}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.symptomsTags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TableCell>
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