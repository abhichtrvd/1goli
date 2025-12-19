import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2, MoreHorizontal, FileText, CheckCircle, XCircle, Clock, Eye, Search, ArrowUpDown, Calendar as CalendarIcon, User, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminPrescriptions() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
  
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [pharmacistNotes, setPharmacistNotes] = useState("");

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
    setPharmacistNotes(prescription.pharmacistNotes || "");
    setIsReviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "reviewed": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Eye className="w-3 h-3 mr-1" /> Reviewed</Badge>;
      case "processed": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Processed</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={results && results.length > 0 && results.every(p => selectedIds.includes(p._id))}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No prescriptions found.
                </TableCell>
              </TableRow>
            ) : (
              results?.map((prescription) => (
                <TableRow key={prescription._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(prescription._id)}
                      onCheckedChange={(checked) => handleSelect(prescription._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(prescription._creationTime).toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      {new Date(prescription._creationTime).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {prescription.user ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={prescription.user.image} />
                          <AvatarFallback>{prescription.user.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {prescription.patientName || prescription.guestInfo?.name || "Registered User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {prescription.patientPhone || prescription.guestInfo?.phone || prescription.user?.email || "View details"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {prescription.notes || "-"}
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
                        <DropdownMenuItem onClick={() => prescription.imageUrl && window.open(prescription.imageUrl, '_blank')} disabled={!prescription.imageUrl}>
                          <FileText className="mr-2 h-4 w-4" /> View Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openReviewDialog(prescription)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details & Update
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

      {status === "CanLoadMore" && (
        <div className="flex justify-center py-4">
          <Button onClick={() => loadMore(10)} disabled={isLoading} variant="outline">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Prescription Details
              {selectedPrescription && getStatusBadge(selectedPrescription.status)}
            </DialogTitle>
            <DialogDescription>
              Review patient details, prescription image, and update status.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg">
                 {selectedPrescription.user ? (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedPrescription.user.image} />
                      <AvatarFallback>{selectedPrescription.user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-lg">{selectedPrescription.patientName || selectedPrescription.guestInfo?.name || "Registered User"}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                       <span>{selectedPrescription.patientPhone || selectedPrescription.guestInfo?.phone || "-"}</span>
                       <span>•</span>
                       <span>{selectedPrescription.guestInfo?.email || selectedPrescription.user?.email || "-"}</span>
                    </div>
                    {selectedPrescription.user && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">Registered Member</Badge>
                    )}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted On</Label>
                  <div className="flex items-center gap-1 font-medium">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    {new Date(selectedPrescription._creationTime).toLocaleString()}
                  </div>
                </div>
                {selectedPrescription.user?.address && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Shipping Address</Label>
                    <p className="font-medium text-sm">{selectedPrescription.user.address}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Patient Notes</Label>
                <div className="bg-muted p-3 rounded-md text-sm mt-1 border border-border/50">
                  {selectedPrescription.notes || "No notes provided."}
                </div>
              </div>

              <div className="flex justify-center py-2">
                <Button variant="outline" onClick={() => selectedPrescription.imageUrl && window.open(selectedPrescription.imageUrl, '_blank')} className="w-full" disabled={!selectedPrescription.imageUrl}>
                  <FileText className="mr-2 h-4 w-4" /> View Prescription Image
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pharmacist-notes">Pharmacist Notes (Visible to User)</Label>
                <Textarea 
                  id="pharmacist-notes" 
                  value={pharmacistNotes} 
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                  placeholder="Instructions, medicines added to cart, etc."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full justify-end">
              <Button 
                variant="destructive" 
                onClick={() => handleStatusUpdate(selectedPrescription._id, "rejected", pharmacistNotes)}
              >
                Reject
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleStatusUpdate(selectedPrescription._id, "reviewed", pharmacistNotes)}
              >
                Mark Reviewed
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusUpdate(selectedPrescription._id, "processed", pharmacistNotes)}
              >
                Process
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}