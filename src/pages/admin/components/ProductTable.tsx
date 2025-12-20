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
import { Edit, Trash2, Eye, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";

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
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(product._id)}
                      onCheckedChange={(checked) => onSelect(product._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
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
              ))
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