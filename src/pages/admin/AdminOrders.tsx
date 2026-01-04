import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Filter, Search, Loader2, Download, CheckSquare, Upload, FileSpreadsheet } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { OrderTable } from "./components/OrderTable";
import { OrderDetailsDialog } from "./components/OrderDetailsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "orders_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseCSVLine = (line: string): string[] => {
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Handle escaped quotes
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    row.push(currentValue.trim());
    return row;
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
        const lines = text.split(/\r\n|\n/); // Handle both line endings
        const ordersToImport = [];
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const row = parseCSVLine(lines[i]);

          // Support both new format (7 cols) and old format (6 cols)
          // New: External ID, Email, Address, Payment, Status, Total, Items
          // Old: Email, Address, Payment, Status, Total, Items
          
          let externalId, email, shippingAddress, paymentMethod, status, total, itemsString;

          if (row.length >= 7) {
             externalId = row[0];
             email = row[1];
             shippingAddress = row[2];
             paymentMethod = row[3];
             status = row[4];
             total = parseFloat(row[5]);
             itemsString = row[6];
          } else if (row.length >= 6) {
             externalId = undefined;
             email = row[0];
             shippingAddress = row[1];
             paymentMethod = row[2];
             status = row[3];
             total = parseFloat(row[4]);
             itemsString = row[5];
          } else {
            continue;
          }

          // Parse items string: "Name:SKU:Qty:Price; Name2:SKU2:Qty2:Price2"
          // Backward compatibility: "Name:Qty:Price" (3 parts) vs "Name:SKU:Qty:Price" (4 parts)
          const items = itemsString.split(';').map(itemStr => {
            const parts = itemStr.split(':').map(p => p.trim());
            
            if (parts.length === 4) {
              // New format with SKU
              return {
                productName: parts[0],
                sku: parts[1] || undefined,
                quantity: parseInt(parts[2]) || 1,
                price: parseFloat(parts[3]) || 0
              };
            } else if (parts.length === 3) {
              // Old format without SKU
              return {
                productName: parts[0],
                sku: undefined,
                quantity: parseInt(parts[1]) || 1,
                price: parseFloat(parts[2]) || 0
              };
            }
            return null;
          }).filter(item => item !== null);

          if (email && items.length > 0) {
            ordersToImport.push({
              externalId: externalId || undefined,
              email,
              shippingAddress,
              paymentMethod,
              status,
              total,
              items: items as any[],
              date: new Date().toISOString()
            });
          }
        }

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

      {/* Import Results Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isDryRun ? 'Dry Run Results' : 'Import Results'}</DialogTitle>
            <DialogDescription>
              Summary of the {isDryRun ? 'simulated ' : ''}order import operation.
            </DialogDescription>
          </DialogHeader>
          
          {importResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/50">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">{importResults.imported}</span>
                  <span className="text-sm text-green-600 dark:text-green-400">{isDryRun ? 'Valid Rows' : 'Imported'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
                  <span className="text-2xl font-bold text-red-700 dark:text-red-300">{importResults.failed}</span>
                  <span className="text-sm text-red-600 dark:text-red-400">Failed</span>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Error Log</Label>
                  <ScrollArea className="h-[300px] w-full rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Row #</TableHead>
                          <TableHead>Error Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResults.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{error.row}</TableCell>
                            <TableCell className="text-destructive">{error.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsResultDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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