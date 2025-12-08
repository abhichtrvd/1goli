import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  HeartPulse,
  IndianRupee,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Video,
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  Banknote,
  Search
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  preferredDate: "",
  preferredSlot: "",
  concern: "",
  consultationMode: "",
  paymentMethod: "pay_at_clinic"
};

export default function ConsultHomeopath() {
  const [citySearch, setCitySearch] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCity(citySearch), 500);
    return () => clearTimeout(timer);
  }, [citySearch]);

  const doctors = useQuery(api.consultations.listDoctors, { city: debouncedCity });
  const seedDoctors = useMutation(api.consultations.seedDoctors);
  const bookAppointment = useMutation(api.consultations.bookAppointment);
  
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    seedDoctors();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBookClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      consultationMode: doctor.consultationModes[0]?.mode || ""
    }));
    setShowBookingDialog(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name || !formData.phone || !formData.preferredDate || !formData.preferredSlot || !formData.consultationMode) {
      toast.error("Please fill all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedMode = selectedDoctor.consultationModes.find((m: any) => m.mode === formData.consultationMode);
      const amount = selectedMode ? selectedMode.price : 0;

      await bookAppointment({
        doctorId: selectedDoctor._id,
        patientName: formData.name,
        phone: formData.phone,
        email: formData.email,
        preferredDate: formData.preferredDate,
        preferredSlot: formData.preferredSlot,
        concern: formData.concern,
        consultationMode: formData.consultationMode,
        amount: amount,
        paymentMethod: formData.paymentMethod
      });

      setBookingSuccess(true);
      toast.success("Appointment booked successfully!");
      setTimeout(() => {
        setShowBookingDialog(false);
        setBookingSuccess(false);
        setFormData(initialForm);
        setSelectedDoctor(null);
      }, 3000);
    } catch (error) {
      toast.error("Failed to book appointment. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (doctors === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading doctors...</div>;
  }

  return (
    <div className="bg-gradient-to-b from-background via-secondary/30 to-background text-foreground min-h-screen">
      <section className="container max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Consult Top <span className="text-lime-600">Homeopaths</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Expert guidance for chronic conditions. Choose from our verified specialists for personalized holistic care.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by City (e.g. Hyderabad, Mumbai)..." 
              className="pl-9 h-12 rounded-full shadow-sm border-lime-200 focus-visible:ring-lime-500 bg-white dark:bg-secondary/50"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            {debouncedCity ? `Doctors in "${debouncedCity}"` : "Suggested Doctors"}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No doctors found in this city. Try searching for another location.
            </div>
          ) : (
            doctors.map((doctor) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow border-border/60">
                  <div className="relative h-32 bg-secondary/50">
                    <img 
                      src={doctor.imageUrl} 
                      alt={doctor.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-black hover:bg-white shadow-sm text-[10px] px-1.5 h-5">
                        <Star className="h-3 w-3 text-amber-500 mr-1 fill-amber-500" />
                        {doctor.rating}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base leading-tight">{doctor.name}</CardTitle>
                        <CardDescription className="text-lime-600 font-medium mt-0.5 text-[10px]">
                          {doctor.specialization}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2 flex-1">
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {doctor.bio}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>{doctor.experienceYears}+ Years</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{doctor.totalConsultations}+</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{doctor.clinicCity}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {doctor.services.slice(0, 2).map((service: string) => (
                        <Badge key={service} variant="secondary" className="text-[9px] font-normal px-1.5 h-4">
                          {service}
                        </Badge>
                      ))}
                      {doctor.services.length > 2 && (
                        <Badge variant="secondary" className="text-[9px] font-normal px-1.5 h-4">
                          +{doctor.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 pt-0">
                    <Button size="sm" className="w-full bg-[#A6FF00] text-black hover:bg-[#98f000] h-8 text-[10px] font-semibold" onClick={() => handleBookClick(doctor)}>
                      Book Appointment
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {bookingSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
              <p className="text-muted-foreground">
                Your appointment with {selectedDoctor?.name} has been scheduled. <br/>
                We have sent the details to your phone number.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Book Appointment</DialogTitle>
                <DialogDescription>
                  with {selectedDoctor?.name} • {selectedDoctor?.specialization}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Patient Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Full Name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+91 98765 43210" required />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Preferred Date *</Label>
                    <Input id="date" type="date" value={formData.preferredDate} onChange={(e) => handleChange("preferredDate", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slot">Preferred Time Slot *</Label>
                    <Select value={formData.preferredSlot} onValueChange={(val) => handleChange("preferredSlot", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</SelectItem>
                        <SelectItem value="Afternoon (12PM - 4PM)">Afternoon (12PM - 4PM)</SelectItem>
                        <SelectItem value="Evening (4PM - 8PM)">Evening (4PM - 8PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Consultation Mode *</Label>
                  <RadioGroup value={formData.consultationMode} onValueChange={(val) => handleChange("consultationMode", val)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDoctor?.consultationModes.map((mode: any) => (
                      <div key={mode.mode} className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${formData.consultationMode === mode.mode ? 'border-lime-500 bg-lime-50/50' : 'border-border'}`}>
                        <RadioGroupItem value={mode.mode} id={mode.mode} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={mode.mode} className="font-semibold cursor-pointer">{mode.mode}</Label>
                          <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                          <p className="text-sm font-bold text-lime-700 mt-1">₹{mode.price}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concern">Health Concern (Optional)</Label>
                  <Textarea id="concern" value={formData.concern} onChange={(e) => handleChange("concern", e.target.value)} placeholder="Briefly describe your symptoms..." />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup value={formData.paymentMethod} onValueChange={(val) => handleChange("paymentMethod", val)} className="grid grid-cols-2 gap-4">
                    <div className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer ${formData.paymentMethod === 'pay_at_clinic' ? 'border-lime-500 bg-lime-50/50' : ''}`}>
                      <RadioGroupItem value="pay_at_clinic" id="pay_at_clinic" />
                      <Label htmlFor="pay_at_clinic" className="cursor-pointer flex items-center gap-2">
                        <Banknote className="h-4 w-4" /> Pay at Clinic
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer ${formData.paymentMethod === 'online' ? 'border-lime-500 bg-lime-50/50' : ''}`}>
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Pay Online
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full h-12 text-lg bg-[#A6FF00] text-black hover:bg-[#98f000]" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : `Confirm Booking • ₹${selectedDoctor?.consultationModes.find((m: any) => m.mode === formData.consultationMode)?.price || 0}`}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}