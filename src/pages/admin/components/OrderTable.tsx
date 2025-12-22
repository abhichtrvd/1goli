import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Filter, Clock, Package, Truck, CheckCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

interface OrderTableProps {
  orders: any[];
  selectedIds: Id<"orders">[];
  onSelect: (id: Id<"orders">, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewDetails: (order: any) => void;
  onQuickStatusUpdate: (order: any) => void;
}

export function OrderTable({
  orders,
  selectedIds,
  onSelect,
  onSelectAll,
  onViewDetails,
  onQuickStatusUpdate
}: OrderTableProps) {
  const allSelected = orders.length > 0 && orders.every(o => selectedIds.includes(o._id));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Package className="h-3 w-3 mr-1" /> Processing
          </Badge>
        );
      case 'shipped':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
            <Truck className="h-3 w-3 mr-1" /> Shipped
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" /> Delivered
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
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
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(order._id)}
                    onCheckedChange={(checked) => onSelect(order._id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{order._id.slice(-6)}</TableCell>
                <TableCell>{new Date(order._creationTime).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{order.userName}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{order.userContact}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.items.length} items
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {order.items.map((i: any) => i.name).join(", ")}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-bold">₹{order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onQuickStatusUpdate(order)}
                      title="Quick Status Update"
                    >
                      <Filter className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onViewDetails(order)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
