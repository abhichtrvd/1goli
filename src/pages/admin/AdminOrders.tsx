import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Filter, Clock, Package, Truck, CheckCircle, Search, Loader2, Download, CheckSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const { results: orders, status, loadMore, isLoading } = usePaginatedQuery(
    api.orders.getPaginatedOrders,
    { search: search || undefined },
    { initialNumItems: 10 }
  );
  
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const bulkUpdateStatus = useMutation(api.orders.bulkUpdateOrderStatus);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // State for status update dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Id<"orders">[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const handleStatusUpdateSubmit = async () => {
    if (!orderToUpdate || !newStatus) return;
    
    try {
      await updateStatus({ 
        orderId: orderToUpdate._id, 
        status: newStatus,
        note: statusNote 
      });
      toast.success("Order status updated");
      setIsStatusDialogOpen(false);
      setOrderToUpdate(null);
      setNewStatus("");
      setStatusNote("");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkUpdateSubmit = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return;

    try {
      await bulkUpdateStatus({
        orderIds: selectedIds,
        status: bulkStatus,
        note: "Bulk update via admin panel"
      });
      toast.success(`Updated ${selectedIds.length} orders`);
      setIsBulkDialogOpen(false);
      setSelectedIds([]);
      setBulkStatus("");
    } catch (error) {
      toast.error("Failed to update orders");
    }
  };

  const openStatusDialog = (order: any) => {
    setOrderToUpdate(order);
    setNewStatus(order.status);
    setStatusNote("");
    setIsStatusDialogOpen(true);
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

  const handleSelect = (id: Id<"orders">, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredOrders) {
      const newIds = filteredOrders.map(o => o._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    } else if (filteredOrders) {
      const pageIds = filteredOrders.map(o => o._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleExportCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Order ID", "Date", "Customer Name", "Contact", "Shipping Address", "Total", "Status", "Items"];
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map(o => [
        o._id,
        new Date(o._creationTime).toISOString(),
        `"${o.userName.replace(/"/g, '""')}"`,
        `"${o.userContact.replace(/"/g, '""')}"`,
        `"${o.shippingAddress.replace(/"/g, '""')}"`,
        o.total,
        o.status,
        `"${o.items.map((i: any) => `${i.name} (${i.quantity})`).join("; ").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and shipments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by address..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            {selectedIds.length > 0 && (
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <CheckSquare className="mr-2 h-4 w-4" /> Update Selected ({selectedIds.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Update Status</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>New Status</Label>
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleBulkUpdateSubmit} className="w-full">
                      Update {selectedIds.length} Orders
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={filteredOrders && filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o._id))}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
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
              {filteredOrders?.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(order._id)}
                      onCheckedChange={(checked) => handleSelect(order._id, checked as boolean)}
                    />
                  </TableCell>
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
                        {order.items.map((i: any) => i.name).join(", ").slice(0, 30)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">₹{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-secondary"
                        onClick={() => openStatusDialog(order)}
                      >
                        <Filter className="h-3 w-3 text-muted-foreground" />
                        <span className="sr-only">Update Status</span>
                      </Button>
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

                            {order.statusHistory && order.statusHistory.length > 0 && (
                              <div className="mt-6">
                                <h4 className="text-sm font-medium mb-3">Status History</h4>
                                <div className="relative pl-2 border-l-2 border-muted ml-2 space-y-6">
                                  {order.statusHistory.map((history: any, idx: number) => (
                                    <div key={idx} className="relative pl-4">
                                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold capitalize">{history.status}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(history.timestamp).toLocaleString()}
                                          </span>
                                        </div>
                                        {history.note && (
                                          <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                                            {history.note}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
                                      <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell colSpan={2} className="font-bold text-right">Total</TableCell>
                                    <TableCell className="font-bold text-right">₹{order.total.toFixed(2)}</TableCell>
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
              {filteredOrders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-center py-4">
            {status === "CanLoadMore" && (
              <Button
                variant="outline"
                onClick={() => loadMore(10)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load More
              </Button>
            )}
            {status === "LoadingFirstPage" && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea 
                placeholder="Add a note about this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
            <Button onClick={handleStatusUpdateSubmit} className="w-full">
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}