import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, User, FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface PrescriptionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: any;
  onStatusUpdate: (id: Id<"prescriptions">, status: "pending" | "reviewed" | "processed" | "rejected", notes?: string) => void;
}

export function PrescriptionReviewDialog({
  open,
  onOpenChange,
  prescription,
  onStatusUpdate
}: PrescriptionReviewDialogProps) {
  const [pharmacistNotes, setPharmacistNotes] = useState("");

  useEffect(() => {
    if (prescription) {
      setPharmacistNotes(prescription.pharmacistNotes || "");
    }
  }, [prescription]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Prescription Details
            {prescription && getStatusBadge(prescription.status)}
          </DialogTitle>
          <DialogDescription>
            Review patient details, prescription image, and update status.
          </DialogDescription>
        </DialogHeader>
        
        {prescription && (
          <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg">
               {prescription.user ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={prescription.user.image} />
                    <AvatarFallback>{prescription.user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-lg">{prescription.patientName || prescription.guestInfo?.name || "Registered User"}</p>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                     <span>{prescription.patientPhone || prescription.guestInfo?.phone || "-"}</span>
                     <span>•</span>
                     <span>{prescription.guestInfo?.email || prescription.user?.email || "-"}</span>
                  </div>
                  {prescription.user && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">Registered Member</Badge>
                  )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Submitted On</Label>
                <div className="flex items-center gap-1 font-medium">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  {new Date(prescription._creationTime).toLocaleString()}
                </div>
              </div>
              {prescription.user?.address && (
                <div>
                  <Label className="text-xs text-muted-foreground">Shipping Address</Label>
                  <p className="font-medium text-sm">{prescription.user.address}</p>
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Patient Notes</Label>
              <div className="bg-muted p-3 rounded-md text-sm mt-1 border border-border/50">
                {prescription.notes || "No notes provided."}
              </div>
            </div>

            <div className="flex justify-center py-2">
              <Button variant="outline" onClick={() => prescription.imageUrl && window.open(prescription.imageUrl, '_blank')} className="w-full" disabled={!prescription.imageUrl}>
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
              onClick={() => onStatusUpdate(prescription._id, "rejected", pharmacistNotes)}
            >
              Reject
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onStatusUpdate(prescription._id, "reviewed", pharmacistNotes)}
            >
              Mark Reviewed
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onStatusUpdate(prescription._id, "processed", pharmacistNotes)}
            >
              Process
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
