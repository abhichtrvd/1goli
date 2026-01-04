import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Filter, Search, Loader2, Download, Upload, FileSpreadsheet } from "lucide-react";
import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { OrderTable } from "./components/OrderTable";
import { OrderDetailsDialog } from "./components/OrderDetailsDialog";
import { Switch } from "@/components/ui/switch";
import { downloadCSV } from "./utils/csvHelpers";
import { parseOrderCSV } from "./utils/orderUtils";
import { ImportResultsDialog } from "./components/ImportResultsDialog";
import { OrderStatusDialog } from "./components/OrderStatusDialog";
import { GenericBulkUpdateDialog } from "./components/GenericBulkUpdateDialog";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const { results: orders, status, loadMore, isLoading } = usePaginatedQuery(
    api.orders.getPaginatedOrders,
    { search: search || undefined },
    { initialNumItems: 10 }
  );
  
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const bulkUpdateStatus = useMutation(api.orders.bulkUpdateOrderStatus);
  const importOrders = useMutation(api.orders.importOrders);
  
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

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ imported: number; failed: number; errors: { row: number; error: string }[] } | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);

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

    downloadCSV(csvContent, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDownloadTemplate = () => {
    const headers = ["External ID (Optional)", "Email", "Shipping Address", "Payment Method", "Status", "Total", "Items (Name:SKU:Qty:Price;...)"];
    const sampleRow = [
      "ORD-001",
      "customer@example.com",
      "123 Main St, City, Country",
      "Credit Card",
      "pending",
      "50.00",
      "Vitamin C:VITC001:1:20.00; Zinc::2:15.00"
    ];
    const csvContent = [
      headers.join(","),
      sampleRow.join(",")
    ].join("\n");

    downloadCSV(csvContent, "orders_import_template.csv");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size too large. Please upload a file smaller than 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const ordersToImport = parseOrderCSV(text);

        if (ordersToImport.length === 0) {
          toast.error("No valid orders found in CSV");
          return;
        }

        const result = await importOrders({ orders: ordersToImport, dryRun: isDryRun });
        setImportResults(result);
        setIsResultDialogOpen(true);
        
        if (result.failed === 0) {
          toast.success(`${isDryRun ? 'Dry run' : 'Import'} completed successfully`);
        } else {
          toast.warning(`${isDryRun ? 'Dry run' : 'Import'} completed with ${result.failed} errors`);
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to import orders. Check CSV format.");
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and shipments.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileUpload}
          />
          <div className="flex items-center space-x-2 mr-2">
            <Switch 
              id="dry-run-mode" 
              checked={isDryRun}
              onCheckedChange={setIsDryRun}
            />
            <Label htmlFor="dry-run-mode">Dry Run</Label>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate} title="Download Template">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Template
          </Button>
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isDryRun ? 'Test Import' : 'Import CSV'}
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID, name, email..." 
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
              <GenericBulkUpdateDialog 
                open={isBulkDialogOpen}
                onOpenChange={setIsBulkDialogOpen}
                triggerLabel={`Update Selected (${selectedIds.length})`}
                title="Bulk Update Status"
                label="New Status"
                value={bulkStatus}
                onValueChange={setBulkStatus}
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "Processing", value: "processing" },
                  { label: "Shipped", value: "shipped" },
                  { label: "Delivered", value: "delivered" },
                ]}
                onSubmit={handleBulkUpdateSubmit}
                submitLabel={`Update ${selectedIds.length} Orders`}
              />
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

      <ImportResultsDialog 
        open={isResultDialogOpen}
        onOpenChange={setIsResultDialogOpen}
        results={importResults}
        isDryRun={isDryRun}
      />

      <OrderDetailsDialog 
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <OrderStatusDialog 
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        status={newStatus}
        onStatusChange={setNewStatus}
        note={statusNote}
        onNoteChange={setStatusNote}
        onSubmit={handleStatusUpdateSubmit}
      />
    </div>
  );
}