import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, MoreHorizontal, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductTableProps {
  products: any[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  onView: (product: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: Id<"products">) => void;
  selectedIds: Id<"products">[];
  onSelect: (id: Id<"products">, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export function ProductTable({
  products,
  currentPage,
  totalPages,
  setCurrentPage,
  onView,
  onEdit,
  onDelete,
  selectedIds,
  onSelect,
  onSelectAll
}: ProductTableProps) {
  const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p._id));
  const syncImage = useAction(api.productActions.syncProductImage);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncImage = async (product: any) => {
    if (!product.imageUrl) return;
    setSyncingId(product._id);
    try {
      const result = await syncImage({ id: product._id, imageUrl: product.imageUrl });
      if (result.success) {
        toast.success("Image synced successfully");
      } else {
        toast.error("Failed to sync image");
      }
    } catch (error) {
      toast.error("Error syncing image");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const needsSync = product.imageUrl && !product.imageStorageId;
                return (
                <TableRow key={product._id} className={needsSync ? "bg-destructive/10" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(product._id)}
                      onCheckedChange={(checked) => onSelect(product._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{product.name}</span>
                        {needsSync && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-3 w-3 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Image URL exists but not synced to storage</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {product.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.brand || "-"}</TableCell>
                  <TableCell>₹{product.basePrice}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        product.availability === "in_stock" ? "default" : 
                        product.availability === "out_of_stock" ? "destructive" : "secondary"
                      }
                      className={
                        product.availability === "in_stock" ? "bg-green-600 hover:bg-green-700" : ""
                      }
                    >
                      {product.availability === "in_stock" ? "In Stock" : 
                       product.availability === "out_of_stock" ? "Out of Stock" : "Discontinued"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(product)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {needsSync && (
                          <DropdownMenuItem onClick={() => handleSyncImage(product)} disabled={syncingId === product._id}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncingId === product._id ? "animate-spin" : ""}`} /> 
                            {syncingId === product._id ? "Syncing..." : "Sync Image"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDelete(product._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}