import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, Clock, Package, Truck, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from "lucide-react";

export default function AdminOrders() {
  const orders = useQuery(api.orders.getAllOrders);
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const itemsPerPage = 10;

  const handleStatusChange = async (orderId: Id<"orders">, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus });
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full border border-yellow-200 text-xs font-medium">
            <Clock className="h-3 w-3" /> Pending
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs font-medium">
            <Package className="h-3 w-3" /> Processing
          </div>
        );
      case 'shipped':
        return (
          <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 text-xs font-medium">
            <Truck className="h-3 w-3" /> Shipped
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full border border-green-200 text-xs font-medium">
            <CheckCircle className="h-3 w-3" /> Delivered
          </div>
        );
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  const filteredOrders = orders?.filter(order => 
    statusFilter === "all" ? true : order.status === statusFilter
  );

  // Pagination
  const totalPages = Math.ceil((filteredOrders?.length || 0) / itemsPerPage);
  const paginatedOrders = filteredOrders?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and shipments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders?.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-xs">{order._id.slice(-6)}</TableCell>
                  <TableCell>{new Date(order._creationTime).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{order.userName}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">{order.userContact}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{order.shippingAddress}</span>
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
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(val) => handleStatusChange(order._id, val)}
                      >
                        <SelectTrigger className="w-[24px] h-[24px] p-0 border-none shadow-none hover:bg-secondary/50 rounded-full flex items-center justify-center">
                          <span className="sr-only">Change status</span>
                          <Filter className="h-3 w-3 text-muted-foreground" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Order Details #{order._id}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-8 mt-4">
                          <div>
                            <h3 className="font-semibold mb-2">Customer & Shipping</h3>
                            <div className="p-4 bg-secondary/30 rounded-lg text-sm space-y-2">
                              <p><span className="text-muted-foreground">Name:</span> {order.userName}</p>
                              <p><span className="text-muted-foreground">Contact:</span> {order.userContact}</p>
                              <p><span className="text-muted-foreground">User ID:</span> {order.userId}</p>
                              <div className="border-t border-border/50 my-2 pt-2">
                                <p className="text-muted-foreground mb-1">Shipping Address:</p>
                                <p className="whitespace-pre-wrap font-medium">{order.shippingAddress}</p>
                              </div>
                            </div>
                            
                            <h3 className="font-semibold mt-6 mb-2">Order Status</h3>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              <span className="text-xs text-muted-foreground">
                                Updated: {new Date(order._creationTime).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">Order Items</h3>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item: any, idx: number) => (
                                    <TableRow key={idx}>
                                      <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.potency} - {item.form}</div>
                                      </TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell colSpan={2} className="font-bold text-right">Total</TableCell>
                                    <TableCell className="font-bold text-right">${order.total.toFixed(2)}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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