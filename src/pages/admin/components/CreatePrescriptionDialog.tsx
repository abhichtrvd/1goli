import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, X, Plus, Upload, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Medicine, validateMedicineList, validateMedicine } from "../utils/prescriptionUtils";
import { Id } from "@/convex/_generated/dataModel";

interface CreatePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePrescriptionDialog({ open, onOpenChange }: CreatePrescriptionDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>();
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"pending" | "reviewed" | "processed" | "rejected">("pending");
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [medicineWarnings, setMedicineWarnings] = useState<string[]>([""]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<Id<"consultationDoctors"> | undefined>();
  const [diagnosis, setDiagnosis] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createPrescription = useMutation(api.prescriptions.adminCreatePrescription);
  const generateUploadUrl = useMutation(api.prescriptions.generateUploadUrl);
  const users = useQuery(api.prescriptions.getUsersForPrescription);
  const doctors = useQuery(api.prescriptions.getDoctorsForPrescription);

  // Update patient details when user is selected
  useEffect(() => {
    if (selectedUserId && users) {
      const user = users.find((u: any) => u._id === selectedUserId);
      if (user) {
        setPatientName(user.name || "");
        setPatientPhone(user.phone || "");
        setPatientEmail(user.email || "");
      }
    }
  }, [selectedUserId, users]);

  const resetForm = () => {
    setSelectedUserId(undefined);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setNotes("");
    setStatus("pending");
    setMedicines([{ name: "", dosage: "", frequency: "", duration: "" }]);
    setMedicineWarnings([""]);
    setSelectedDoctorId(undefined);
    setDiagnosis("");
    setExpiryDate(undefined);
    setImageFile(null);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }]);
    setMedicineWarnings([...medicineWarnings, ""]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
      setMedicineWarnings(medicineWarnings.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);

    // Validate medicine name
    if (field === "name" && value.trim()) {
      const validation = validateMedicine(value);
      const warnings = [...medicineWarnings];
      warnings[index] = validation.isValid ? "" : (validation.suggestion || "");
      setMedicineWarnings(warnings);
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      toast.error("Patient name is required");
      return;
    }

    if (!patientPhone.trim()) {
      toast.error("Patient phone is required");
      return;
    }

    // Filter out empty medicines
    const validMedicines = medicines.filter(m => m.name.trim() || m.dosage.trim() || m.frequency.trim());

    // Validate medicines if any exist
    if (validMedicines.length > 0) {
      const validation = validateMedicineList(validMedicines);
      if (!validation.valid) {
        toast.error(validation.errors[0]);
        return;
      }
    }

    setIsUploading(true);
    try {
      let imageStorageId: Id<"_storage"> | undefined;

      // Upload image if provided
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const { storageId } = await result.json();
        imageStorageId = storageId;
      }

      await createPrescription({
        userId: selectedUserId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        medicines: validMedicines.length > 0 ? validMedicines : undefined,
        doctorId: selectedDoctorId,
        diagnosis: diagnosis.trim() || undefined,
        expiryDate: expiryDate ? expiryDate.getTime() : undefined,
        imageStorageId,
      });

      toast.success("Prescription created successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create prescription");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label>Select Patient (Optional)</Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => setSelectedUserId(value as Id<"users">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a patient or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Enter Manually</SelectItem>
                {users?.map((user: any) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} - {user.email || user.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                placeholder="John Doe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={!!selectedUserId && selectedUserId !== "manual"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientPhone">Patient Phone *</Label>
              <Input
                id="patientPhone"
                placeholder="+1234567890"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                disabled={!!selectedUserId && selectedUserId !== "manual"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientEmail">Patient Email (Optional)</Label>
            <Input
              id="patientEmail"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              disabled={!!selectedUserId && selectedUserId !== "manual"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the prescription..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Prescription Image (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {imageFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setImageFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {imageFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Medicines</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedicine}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Medicine
              </Button>
            </div>

            <div className="space-y-3">
              {medicines.map((medicine, index) => (
                <div key={index} className="border p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medicine {index + 1}</span>
                    {medicines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedicine(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Medicine name"
                    value={medicine.name}
                    onChange={(e) => updateMedicine(index, "name", e.target.value)}
                  />
                  {medicineWarnings[index] && (
                    <div className="flex items-start gap-2 text-amber-600 text-xs">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{medicineWarnings[index]}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Dosage (e.g., 500mg)"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                    />
                    <Input
                      placeholder="Frequency (e.g., 2x daily)"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                    />
                    <Input
                      placeholder="Duration (e.g., 7 days)"
                      value={medicine.duration || ""}
                      onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label>Doctor (Optional)</Label>
            <Select
              value={selectedDoctorId}
              onValueChange={(value) => setSelectedDoctorId(value as Id<"consultationDoctors">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors?.map((doctor: any) => (
                  <SelectItem key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis (Optional)</Label>
            <Textarea
              id="diagnosis"
              placeholder="Enter diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Prescription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
