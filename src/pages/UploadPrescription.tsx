import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";

export default function UploadPrescription() {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const generateUploadUrl = useMutation(api.prescriptions.generateUploadUrl);
  const submitPrescription = useMutation(api.prescriptions.submitPrescription);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validation
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Invalid file type. Please upload JPG, PNG, or PDF.");
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!isAuthenticated && (!guestName || !guestPhone)) {
      toast.error("Please provide your name and phone number");
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }
      
      const { storageId } = await result.json();
      
      // 3. Submit prescription record
      await submitPrescription({
        imageStorageId: storageId,
        notes: notes,
        guestInfo: !isAuthenticated ? {
          name: guestName,
          phone: guestPhone,
        } : undefined,
      });

      setIsSuccess(true);
      toast.success("Prescription uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload prescription. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Upload Prescription</CardTitle>
            <CardDescription>
              Upload your homeopath's prescription and our pharmacists will review it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Prescription Sent!</h3>
                <p className="text-muted-foreground">
                  Your prescription has been sent to our pharmacist for review. We will notify you once the medicines are added to your cart.
                </p>
                <div className="flex gap-4 pt-4">
                  <Button onClick={() => {
                    setIsSuccess(false);
                    setFile(null);
                    setNotes("");
                  }} variant="outline">
                    Upload Another
                  </Button>
                  <Link to="/">
                    <Button>Back to Home</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-6">
                {!isAuthenticated && (
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>You are uploading as a guest. Please provide contact details.</span>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="guestName">Full Name</Label>
                      <Input 
                        id="guestName" 
                        value={guestName} 
                        onChange={(e) => setGuestName(e.target.value)} 
                        required 
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="guestPhone">Phone Number</Label>
                      <Input 
                        id="guestPhone" 
                        value={guestPhone} 
                        onChange={(e) => setGuestPhone(e.target.value)} 
                        required 
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="prescription">Prescription Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                    <Input 
                      id="prescription" 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      required
                    />
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or PDF (MAX. 5MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any specific instructions..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!file || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : "Submit Prescription"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}