import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Filter, Search, Loader2, Download, CheckSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { OrderTable } from "./components/OrderTable";
import { OrderDetailsDialog } from "./components/OrderDetailsDialog";

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
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

  const openDetailsDialog = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
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
          <OrderTable 
            orders={filteredOrders || []}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onViewDetails={openDetailsDialog}
            onQuickStatusUpdate={openStatusDialog}
          />

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

      {/* Detailed Order View Dialog */}
      <OrderDetailsDialog 
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      {/* Quick Status Update Dialog */}
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