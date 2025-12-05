import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Search, Trash2, Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminProducts() {
  const products = useQuery(api.products.getProducts);
  const createProduct = useMutation(api.products.createProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createProduct({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        imageUrl: formData.get("imageUrl") as string,
        basePrice: parseFloat(formData.get("basePrice") as string),
        potencies: (formData.get("potencies") as string).split(",").map(s => s.trim()),
        forms: (formData.get("forms") as string).split(",").map(s => s.trim()),
        symptomsTags: (formData.get("symptomsTags") as string).split(",").map(s => s.trim()),
      });
      toast.success("Product created successfully");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any) => {
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Arnica Montana" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input id="basePrice" name="basePrice" type="number" step="0.01" required placeholder="12.99" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required placeholder="Product description..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" required placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="potencies">Potencies (comma separated)</Label>
                <Input id="potencies" name="potencies" required placeholder="30C, 200C, 1M" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forms">Forms (comma separated)</Label>
                <Input id="forms" name="forms" required placeholder="Dilution, Globules, Drops" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptomsTags">Tags (comma separated)</Label>
                <Input id="symptomsTags" name="symptomsTags" required placeholder="fever, pain, flu" />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Product
              </Button>
            </form>
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
                onChange={(e) => setSearch(e.target.value)}
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
              {filteredProducts?.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} alt={product.name} className="h-8 w-8 rounded object-cover bg-secondary" />
                      {product.name}
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
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
