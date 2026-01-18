import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Trash2, Edit, Loader2, Search, Download, Upload, FileSpreadsheet, ImageIcon, X, Calendar } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { parseDoctorCSV } from "./utils/doctorUtils";
import { ImportResultsDialog } from "./components/ImportResultsDialog";
import { AppointmentCalendarDialog } from "./components/AppointmentCalendarDialog";

export default function AdminDoctors() {
  const [search, setSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [experienceFilter, setExperienceFilter] = useState<string>("");

  const { results: doctors, status, loadMore, isLoading } = usePaginatedQuery(
    api.consultations.getPaginatedDoctors,
    {
      search: search || undefined,
      specialization: specializationFilter && specializationFilter !== "all" ? specializationFilter : undefined,
      city: cityFilter && cityFilter !== "all" ? cityFilter : undefined,
      experienceRange: experienceFilter && experienceFilter !== "all" ? experienceFilter : undefined,
    },
    { initialNumItems: 10 }
  );

  const specializations = useQuery(api.consultations.getSpecializations);
  const cities = useQuery(api.consultations.getCities);

  const createDoctor = useMutation(api.consultations.createDoctor);
  const updateDoctor = useMutation(api.consultations.updateDoctor);
  const deleteDoctor = useMutation(api.consultations.deleteDoctor);
  const bulkDeleteDoctors = useMutation(api.consultations.bulkDeleteDoctors);
  const importDoctors = useMutation(api.consultations.importDoctors);
  const generateUploadUrl = useMutation(api.consultations.generateUploadUrl);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Id<"consultationDoctors">[]>([]);

  // Image upload state
  const [uploadedImageId, setUploadedImageId] = useState<Id<"_storage"> | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ imported: number; updated: number; failed: number; errors: { row: number; error: string }[] } | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  // Appointment calendar state
  const [appointmentCalendarOpen, setAppointmentCalendarOpen] = useState(false);
  const [selectedDoctorForCalendar, setSelectedDoctorForCalendar] = useState<{ id: Id<"consultationDoctors">; name: string } | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      setUploadedImageId(storageId);

      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    }
  };

  const handleRemoveImage = () => {
    setUploadedImageId(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Parse comma-separated values
    const availability = (formData.get("availability") as string)
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    const languages = (formData.get("languages") as string)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const services = (formData.get("services") as string)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Parse consultation modes
    const videoPrice = Number(formData.get("videoPrice")) || 500;
    const clinicPrice = Number(formData.get("clinicPrice")) || 800;

    const doctorData: any = {
      name: formData.get("name") as string,
      specialization: formData.get("specialization") as string,
      clinicCity: formData.get("clinicCity") as string,
      clinicAddress: formData.get("clinicAddress") as string,
      experienceYears: Number(formData.get("experienceYears")),
      credentials: formData.get("credentials") as string,
      clinicPhone: formData.get("clinicPhone") as string,
      bio: formData.get("bio") as string,
      availability: availability.length > 0 ? availability : ["Mon-Sat 10AM-8PM"],
      languages: languages.length > 0 ? languages : ["English", "Hindi"],
      services: services.length > 0 ? services : ["General Consultation"],
      consultationModes: [
          { mode: "Video", price: videoPrice, durationMinutes: 20, description: "Online Video Consultation" },
          { mode: "Clinic", price: clinicPrice, durationMinutes: 30, description: "In-person Visit" }
      ],
    };

    // Add image data
    if (uploadedImageId) {
      doctorData.imageStorageId = uploadedImageId;
    } else if (formData.get("imageUrl")) {
      doctorData.imageUrl = formData.get("imageUrl") as string;
    } else if (!editingDoctor) {
      doctorData.imageUrl = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=500&auto=format&fit=crop";
    }

    try {
      if (editingDoctor) {
        await updateDoctor({
          id: editingDoctor._id,
          ...doctorData,
        });
        toast.success("Doctor updated");
      } else {
        await createDoctor(doctorData);
        toast.success("Doctor created");
      }
      setIsDialogOpen(false);
      setEditingDoctor(null);
      setUploadedImageId(null);
      setImagePreview(null);
    } catch (error) {
      toast.error("Failed to save doctor");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"consultationDoctors">) => {
    if (confirm("Delete this doctor?")) {
      await deleteDoctor({ id });
      toast.success("Doctor deleted");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} doctors?`)) {
      try {
        await bulkDeleteDoctors({ ids: selectedIds });
        toast.success(`${selectedIds.length} doctors deleted`);
        setSelectedIds([]);
      } catch (error) {
        toast.error("Failed to delete doctors");
      }
    }
  };

  const handleSelect = (id: Id<"consultationDoctors">, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && doctors) {
      const newIds = doctors.map(d => d._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    } else if (doctors) {
      const pageIds = doctors.map(d => d._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleExportCSV = () => {
    if (!doctors || doctors.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Name", "Specialization", "Credentials", "Experience", "City", "Clinic Address", "Phone", "Bio", "Availability", "Languages", "Services", "Image URL"];
    const csvContent = [
      headers.join(","),
      ...doctors.map(d => [
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.specialization.replace(/"/g, '""')}"`,
        `"${d.credentials.replace(/"/g, '""')}"`,
        d.experienceYears,
        `"${d.clinicCity.replace(/"/g, '""')}"`,
        `"${d.clinicAddress.replace(/"/g, '""')}"`,
        `"${d.clinicPhone.replace(/"/g, '""')}"`,
        `"${d.bio.replace(/"/g, '""')}"`,
        `"${(d.availability || []).join(';').replace(/"/g, '""')}"`,
        `"${(d.languages || []).join(',').replace(/"/g, '""')}"`,
        `"${(d.services || []).join(',').replace(/"/g, '""')}"`,
        `"${d.imageUrl || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `doctors_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Name", "Specialization", "Credentials", "Experience", "City", "Clinic Address", "Phone", "Bio", "Availability (Optional)", "Languages (Optional)", "Services (Optional)", "Image URL (Optional)"];
    const sampleRow = [
      "Dr. John Smith",
      "General Medicine",
      "MBBS, MD",
      "10",
      "Mumbai",
      "123 Health Street, Mumbai",
      "+91 9876543210",
      "Experienced doctor specializing in general medicine",
      "Mon-Sat 9AM-6PM",
      "English,Hindi,Marathi",
      "General Consultation,Health Checkup",
      "https://example.com/doctor.jpg"
    ];
    const csvContent = [
      headers.join(","),
      sampleRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "doctors_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        const doctorsToImport = parseDoctorCSV(text);

        if (doctorsToImport.length === 0) {
          toast.error("No valid doctors found in CSV");
          return;
        }

        const result = await importDoctors({ doctors: doctorsToImport });
        setImportResults(result);
        setIsResultDialogOpen(true);

        if (result.failed === 0) {
          toast.success(`Import completed successfully: ${result.imported} created, ${result.updated} updated`);
        } else {
          toast.warning(`Import completed with ${result.failed} errors`);
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to import doctors. Check CSV format.");
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
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">Manage your panel of homeopaths.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={handleDownloadTemplate} title="Download Template">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Template
          </Button>
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingDoctor(null);
              setUploadedImageId(null);
              setImagePreview(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDoctor(null);
                setUploadedImageId(null);
                setImagePreview(null);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required defaultValue={editingDoctor?.name} placeholder="Dr. Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" name="specialization" required defaultValue={editingDoctor?.specialization} placeholder="e.g. Dermatology" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credentials">Credentials</Label>
                    <Input id="credentials" name="credentials" required defaultValue={editingDoctor?.credentials} placeholder="BHMS, MD" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Experience (Years)</Label>
                    <Input id="experienceYears" name="experienceYears" type="number" required defaultValue={editingDoctor?.experienceYears} />
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="clinicCity">City</Label>
                    <Input id="clinicCity" name="clinicCity" required defaultValue={editingDoctor?.clinicCity} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Clinic Address</Label>
                    <Input id="clinicAddress" name="clinicAddress" required defaultValue={editingDoctor?.clinicAddress} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="clinicPhone">Phone</Label>
                    <Input id="clinicPhone" name="clinicPhone" required defaultValue={editingDoctor?.clinicPhone} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" name="bio" required defaultValue={editingDoctor?.bio} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="availability">Availability (Separate with semicolons)</Label>
                    <Input
                      id="availability"
                      name="availability"
                      defaultValue={editingDoctor?.availability?.join('; ')}
                      placeholder="Mon-Sat 10AM-8PM; Sun 10AM-2PM"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="languages">Languages (Comma-separated)</Label>
                    <Input
                      id="languages"
                      name="languages"
                      defaultValue={editingDoctor?.languages?.join(', ')}
                      placeholder="English, Hindi, Marathi"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="services">Services (Comma-separated)</Label>
                    <Input
                      id="services"
                      name="services"
                      defaultValue={editingDoctor?.services?.join(', ')}
                      placeholder="General Consultation, Health Checkup"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoPrice">Video Consultation Price (₹)</Label>
                    <Input
                      id="videoPrice"
                      name="videoPrice"
                      type="number"
                      defaultValue={editingDoctor?.consultationModes?.find((m: any) => m.mode === "Video")?.price || 500}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPrice">Clinic Visit Price (₹)</Label>
                    <Input
                      id="clinicPrice"
                      name="clinicPrice"
                      type="number"
                      defaultValue={editingDoctor?.consultationModes?.find((m: any) => m.mode === "Clinic")?.price || 800}
                      placeholder="800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Doctor Image</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {uploadedImageId ? "Change Image" : "Upload Image"}
                      </Button>
                    </div>
                    {imagePreview && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {editingDoctor?.imageUrl && !imagePreview && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={editingDoctor.imageUrl}
                          alt="Current"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Upload a profile image or use the URL field below
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      defaultValue={editingDoctor?.imageUrl}
                      placeholder="https://example.com/doctor-image.jpg"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingDoctor ? "Update Doctor" : "Create Doctor"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {specializations?.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities?.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={experienceFilter} onValueChange={setExperienceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Experience</SelectItem>
            <SelectItem value="0-5">Less than 5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10+">More than 10 years</SelectItem>
          </SelectContent>
        </Select>

        {(specializationFilter || cityFilter || experienceFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSpecializationFilter("");
              setCityFilter("");
              setExperienceFilter("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Doctors</CardTitle>
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={doctors && doctors.length > 0 && doctors.every(d => selectedIds.includes(d._id))}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors?.map((doctor) => (
                <TableRow key={doctor._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(doctor._id)}
                      onCheckedChange={(checked) => handleSelect(doctor._id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.clinicCity}</TableCell>
                  <TableCell>{doctor.experienceYears} Years</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDoctorForCalendar({ id: doctor._id, name: doctor.name });
                          setAppointmentCalendarOpen(true);
                        }}
                        title="View Appointments"
                      >
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingDoctor(doctor);
                        setIsDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doctor._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {doctors?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No doctors found.
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

      <ImportResultsDialog
        open={isResultDialogOpen}
        onOpenChange={setIsResultDialogOpen}
        results={importResults}
        isDryRun={false}
      />

      {selectedDoctorForCalendar && (
        <AppointmentCalendarDialog
          open={appointmentCalendarOpen}
          onOpenChange={setAppointmentCalendarOpen}
          doctorId={selectedDoctorForCalendar.id}
          doctorName={selectedDoctorForCalendar.name}
        />
      )}
    </div>
  );
}