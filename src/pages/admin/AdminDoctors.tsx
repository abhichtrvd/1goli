import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Trash2, Edit, Loader2, Search, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminDoctors() {
  const [search, setSearch] = useState("");
  const { results: doctors, status, loadMore, isLoading } = usePaginatedQuery(
    api.consultations.getPaginatedDoctors,
    { search: search || undefined },
    { initialNumItems: 10 }
  );

  const createDoctor = useMutation(api.consultations.createDoctor);
  const updateDoctor = useMutation(api.consultations.updateDoctor);
  const deleteDoctor = useMutation(api.consultations.deleteDoctor);
  const bulkDeleteDoctors = useMutation(api.consultations.bulkDeleteDoctors);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Id<"consultationDoctors">[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const doctorData = {
      name: formData.get("name") as string,
      specialization: formData.get("specialization") as string,
      clinicCity: formData.get("clinicCity") as string,
      clinicAddress: formData.get("clinicAddress") as string,
      experienceYears: Number(formData.get("experienceYears")),
      credentials: formData.get("credentials") as string,
      clinicPhone: formData.get("clinicPhone") as string,
      bio: formData.get("bio") as string,
      // Defaults for complex fields for now
      availability: ["Mon-Sat 10AM-8PM"],
      languages: ["English", "Hindi"],
      services: ["General Consultation"],
      consultationModes: [
          { mode: "Video", price: 500, durationMinutes: 20, description: "Online Video Consultation" },
          { mode: "Clinic", price: 800, durationMinutes: 30, description: "In-person Visit" }
      ],
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=500&auto=format&fit=crop" // Placeholder
    };

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

    const headers = ["Name", "Specialization", "City", "Experience", "Clinic Address", "Phone"];
    const csvContent = [
      headers.join(","),
      ...doctors.map(d => [
        `"${d.name.replace(/"/g, '""')}"`,
        `"${d.specialization.replace(/"/g, '""')}"`,
        `"${d.clinicCity.replace(/"/g, '""')}"`,
        d.experienceYears,
        `"${d.clinicAddress.replace(/"/g, '""')}"`,
        `"${d.clinicPhone.replace(/"/g, '""')}"`
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">Manage your panel of homeopaths.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingDoctor(null)}>
                <Plus className="mr-2 h-4 w-4" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingDoctor ? "Update Doctor" : "Create Doctor"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search doctors..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
    </div>
  );
}