import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Eye, User, Clock, CheckCircle, XCircle, Trash2, AlertTriangle, Pill } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { getExpiryStatus } from "../utils/prescriptionUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrescriptionTableProps {
  results: any[];
  selectedIds: Id<"prescriptions">[];
  onSelect: (id: Id<"prescriptions">, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewImage: (url: string) => void;
  onReview: (prescription: any) => void;
  onDelete: (id: Id<"prescriptions">) => void;
}

export function PrescriptionTable({
  results,
  selectedIds,
  onSelect,
  onSelectAll,
  onViewImage,
  onReview,
  onDelete
}: PrescriptionTableProps) {
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
    <TooltipProvider>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={results && results.length > 0 && results.every(p => selectedIds.includes(p._id))}
                  onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
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
                    onCheckedChange={(checked) => onSelect(prescription._id, checked as boolean)}
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
                <TableCell className="max-w-[250px]">
                  <div className="space-y-1">
                    {prescription.notes && (
                      <div className="text-sm truncate">{prescription.notes}</div>
                    )}
                    {prescription.medicines && prescription.medicines.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            <Pill className="h-3 w-3" />
                            <span>{prescription.medicines.length} medicine{prescription.medicines.length > 1 ? 's' : ''}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            {prescription.medicines.map((med: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <strong>{med.name}</strong> - {med.dosage}, {med.frequency}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {prescription.expiryDate && (() => {
                      const expiryStatus = getExpiryStatus(prescription.expiryDate);
                      return (
                        <div className={`flex items-center gap-1 text-xs ${
                          expiryStatus.status === 'expired' ? 'text-red-600' :
                          expiryStatus.status === 'warning' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {expiryStatus.status !== 'valid' && <AlertTriangle className="h-3 w-3" />}
                          <span>{expiryStatus.message}</span>
                        </div>
                      );
                    })()}
                  </div>
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
                      <DropdownMenuItem onClick={() => onViewImage(prescription.imageUrl)} disabled={!prescription.imageUrl}>
                        <FileText className="mr-2 h-4 w-4" /> View Image
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReview(prescription)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details & Update
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(prescription._id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
    </TooltipProvider>
  );
}
