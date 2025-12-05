import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminOrders() {
  const orders = useQuery(api.orders.getAllOrders);
  const updateStatus = useMutation(api.orders.updateOrderStatus);

  const handleStatusChange = async (orderId: Id<"orders">, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus });
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders and shipments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-xs">{order._id}</TableCell>
                  <TableCell>{new Date(order._creationTime).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">User {order.userId.slice(0, 8)}...</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">{order.shippingAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items.length} items
                      <div className="text-xs text-muted-foreground">
                        {order.items.map(i => i.name).join(", ").slice(0, 30)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.status} 
                      onValueChange={(val) => handleStatusChange(order._id, val)}
                    >
                      <SelectTrigger className={`w-[130px] h-8 text-xs ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
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
