import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductTableProps {
  products: any[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  onView: (product: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: Id<"products">) => void;
  selectedIds?: Id<"products">[];
  onSelect?: (id: Id<"products">, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

export function ProductTable({ 
  products, 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  onView, 
  onEdit, 
  onDelete,
  selectedIds = [],
  onSelect,
  onSelectAll
}: ProductTableProps) {
  const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p._id));

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelect && (
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll && onSelectAll(checked as boolean)}
                />
              </TableHead>
            )}
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Potencies</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product._id}>
              {onSelect && (
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(product._id)}
                    onCheckedChange={(checked) => onSelect(product._id, checked as boolean)}
                  />
                </TableCell>
              )}
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
              <TableCell>₹{product.basePrice}</TableCell>
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
                  <Button variant="ghost" size="icon" onClick={() => onView(product)}>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(product._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </div>
  );
}