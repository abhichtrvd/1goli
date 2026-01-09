import { useState, useRef } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ArrowUpDown, Calendar as CalendarIcon, CheckSquare, Download, Plus, Upload, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { PrescriptionTable } from "./components/PrescriptionTable";
import { PrescriptionReviewDialog } from "./components/PrescriptionReviewDialog";
import { CreatePrescriptionDialog } from "./components/CreatePrescriptionDialog";
import { parsePrescriptionCSV, generatePrescriptionCSVTemplate } from "./utils/prescriptionUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPrescriptions() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expiryFilter, setExpiryFilter] = useState<"all" | "active" | "expired">("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.prescriptions.getPaginatedPrescriptions,
    { 
      status: statusFilter,
      search: debouncedSearch || undefined,
      sortOrder: sortOrder,
      startDate: dateRange.from ? dateRange.from.getTime() : undefined,
      endDate: dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)).getTime() : undefined,
    },
    { initialNumItems: 10 }
  );

  const updateStatus = useMutation(api.prescriptions.updatePrescriptionStatus);
  const bulkUpdateStatus = useMutation(api.prescriptions.bulkUpdatePrescriptionStatus);
  const deletePrescription = useMutation(api.prescriptions.deletePrescription);
  const importPrescriptions = useMutation(api.prescriptions.importPrescriptions);

  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"prescriptions"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Id<"prescriptions">[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkNotes, setBulkNotes] = useState("");

  const handleSelect = (id: Id<"prescriptions">, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && results) {
      const newIds = results.map(p => p._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    } else if (results) {
      const pageIds = results.map(p => p._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return;
    
    try {
      await bulkUpdateStatus({
        ids: selectedIds,
        status: bulkStatus as any,
        pharmacistNotes: bulkNotes || undefined
      });
      toast.success(`Updated ${selectedIds.length} prescriptions`);
      setIsBulkDialogOpen(false);
      setSelectedIds([]);
      setBulkStatus("");
      setBulkNotes("");
    } catch (error) {
      toast.error("Failed to update prescriptions");
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Patient Name", "Patient Phone", "Status", "Notes", "Pharmacist Notes"];
    const csvContent = [
      headers.join(","),
      ...results.map(p => [
        new Date(p._creationTime).toISOString().split('T')[0],
        `"${(p.patientName || p.guestInfo?.name || "Registered User").replace(/"/g, '""')}"`,
        `"${(p.patientPhone || p.guestInfo?.phone || "").replace(/"/g, '""')}"`,
        p.status,
        `"${(p.notes || "").replace(/"/g, '""')}"`,
        `"${(p.pharmacistNotes || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prescriptions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusUpdate = async (id: Id<"prescriptions">, newStatus: "pending" | "reviewed" | "processed" | "rejected", notes?: string) => {
    try {
      await updateStatus({
        id,
        status: newStatus,
        pharmacistNotes: notes,
      });
      toast.success(`Prescription marked as ${newStatus}`);
      setIsReviewOpen(false);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openReviewDialog = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsReviewOpen(true);
  };

  // Filter results by expiry status
  const filteredResults = results?.filter(prescription => {
    if (expiryFilter === "all") return true;
    if (!prescription.expiryDate) return expiryFilter === "active"; // Treat no expiry as active

    const isExpired = Date.now() > prescription.expiryDate;
    return expiryFilter === "expired" ? isExpired : !isExpired;
  }) || [];

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePrescription({ id: deleteId });
      toast.success("Prescription deleted successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete prescription");
    }
  };

  const handleDownloadTemplate = () => {
    const template = generatePrescriptionCSVTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "prescription_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded");
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const { data, errors } = parsePrescriptionCSV(text);

      if (errors.length > 0 && data.length === 0) {
        toast.error(`CSV parsing failed: ${errors[0]}`);
        return;
      }

      if (data.length === 0) {
        toast.error("No valid data found in CSV");
        return;
      }

      const result = await importPrescriptions({ prescriptions: data });

      if (result.errors.length > 0) {
        toast.warning(
          `Imported ${result.imported} prescriptions with ${result.errors.length} errors. Check console for details.`
        );
        console.error("Import errors:", result.errors);
      } else {
        toast.success(`Successfully imported ${result.imported} prescriptions`);
      }
    } catch (error) {
      toast.error("Failed to import prescriptions");
      console.error(error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Prescription
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Import Prescriptions</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file to bulk import prescriptions
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    disabled={isImporting}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose CSV File
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDownloadTemplate}
                    className="w-full"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Filter by Date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button 
          variant={statusFilter === undefined ? "default" : "outline"} 
          onClick={() => setStatusFilter(undefined)}
          size="sm"
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "pending" ? "default" : "outline"} 
          onClick={() => setStatusFilter("pending")}
          size="sm"
          className={statusFilter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
        >
          Pending
        </Button>
        <Button 
          variant={statusFilter === "reviewed" ? "default" : "outline"} 
          onClick={() => setStatusFilter("reviewed")}
          size="sm"
          className={statusFilter === "reviewed" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          Reviewed
        </Button>
        <Button 
          variant={statusFilter === "processed" ? "default" : "outline"} 
          onClick={() => setStatusFilter("processed")}
          size="sm"
          className={statusFilter === "processed" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          Processed
        </Button>
        <Button
          variant={statusFilter === "rejected" ? "default" : "outline"}
          onClick={() => setStatusFilter("rejected")}
          size="sm"
          className={statusFilter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          Rejected
        </Button>

        {/* Expiry Filter */}
        <div className="flex items-center gap-2 ml-4 pl-4 border-l">
          <span className="text-sm text-muted-foreground">Expiry:</span>
          <Button
            variant={expiryFilter === "all" ? "default" : "outline"}
            onClick={() => setExpiryFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={expiryFilter === "active" ? "default" : "outline"}
            onClick={() => setExpiryFilter("active")}
            size="sm"
            className={expiryFilter === "active" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Active
          </Button>
          <Button
            variant={expiryFilter === "expired" ? "default" : "outline"}
            onClick={() => setExpiryFilter("expired")}
            size="sm"
            className={expiryFilter === "expired" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Expired
          </Button>
        </div>

        {(dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange({ from: undefined, to: undefined })}
            className="ml-auto text-muted-foreground"
          >
            Clear Date Filter
          </Button>
        )}
        
        {selectedIds.length > 0 && (
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="ml-auto">
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
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pharmacist Notes (Optional)</Label>
                  <Textarea 
                    placeholder="Add a note for all selected prescriptions..."
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleBulkUpdate} className="w-full">
                  Update {selectedIds.length} Prescriptions
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <PrescriptionTable
        results={filteredResults}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onViewImage={(url) => window.open(url, '_blank')}
        onReview={openReviewDialog}
        onDelete={(id) => setDeleteId(id)}
      />

      {status === "CanLoadMore" && (
        <div className="flex justify-center py-4">
          <Button onClick={() => loadMore(10)} disabled={isLoading} variant="outline">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}

      <PrescriptionReviewDialog
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        prescription={selectedPrescription}
        onStatusUpdate={handleStatusUpdate}
      />

      <CreatePrescriptionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prescription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}