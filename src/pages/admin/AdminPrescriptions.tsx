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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MoreHorizontal, FileText, CheckCircle, XCircle, Clock, Eye, Search, ArrowUpDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminPrescriptions() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.prescriptions.getPaginatedPrescriptions,
    { 
      status: statusFilter,
      search: debouncedSearch || undefined,
      sortOrder: sortOrder,
    },
    { initialNumItems: 10 }
  );

  const updateStatus = useMutation(api.prescriptions.updatePrescriptionStatus);
  
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [pharmacistNotes, setPharmacistNotes] = useState("");

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

      <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={5} className="h-24 text-center">
                  No prescriptions found.
                </TableCell>
              </TableRow>
            ) : (
              results?.map((prescription) => (
                <TableRow key={prescription._id}>
                  <TableCell>
                    {new Date(prescription._creationTime).toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      {new Date(prescription._creationTime).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {prescription.patientName || prescription.guestInfo?.name || "Registered User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {prescription.patientPhone || prescription.guestInfo?.phone || "View details"}
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Patient Name</Label>
                  <p className="font-medium">{selectedPrescription.patientName || selectedPrescription.guestInfo?.name || "Registered User"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedPrescription.patientPhone || selectedPrescription.guestInfo?.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedPrescription.guestInfo?.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted On</Label>
                  <div className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(selectedPrescription._creationTime).toLocaleString()}
                  </div>
                </div>
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