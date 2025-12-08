import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const consultationOptions = [
  {
    title: "Clinic Visit",
    price: "₹899",
    duration: "30 mins",
    includes: ["Physical examination", "Prescription & follow-up plan"],
    icon: <HeartPulse className="h-5 w-5 text-lime-600" />,
  },
  {
    title: "Video Consultation",
    price: "₹699",
    duration: "25 mins",
    includes: ["HD video session", "Digital prescription on email"],
    icon: <Video className="h-5 w-5 text-sky-500" />,
  },
  {
    title: "Follow-up Call",
    price: "₹299",
    duration: "15 mins",
    includes: ["Prescription tweaks", "Supplement guidance"],
    icon: <Phone className="h-5 w-5 text-amber-500" />,
  },
];

const reviews = [
  {
    name: "Anjali Verma",
    condition: "Thyroid imbalance",
    content:
      "Dr. Rao listens patiently and the regimen she suggested balanced my thyroid levels within 6 weeks.",
    rating: 5,
    date: "Feb 2024",
  },
  {
    name: "Rahul Sharma",
    condition: "Chronic allergies",
    content:
      "Transparent pricing, clean clinic and the video follow-ups made it easy to stay consistent.",
    rating: 4.5,
    date: "Jan 2024",
  },
  {
    name: "Priya Mehta",
    condition: "PCOS care",
    content:
      "Loved the detailed explanation of every remedy. The lifestyle plan was a life saver.",
    rating: 5,
    date: "Dec 2023",
  },
];

const faqs = [
  {
    question: "What documents do I need for the appointment?",
    answer:
      "Carry previous lab reports, current medication list, and your prescription history for a detailed assessment.",
  },
  {
    question: "How are medicines delivered?",
    answer:
      "You can pick up from the clinic immediately post consultation or opt for 24-hour doorstep delivery across India.",
  },
  {
    question: "Can I reschedule my slot?",
    answer:
      "Yes, rescheduling is free up to 6 hours before the appointment. Use the confirmation email link or call us directly.",
  },
];

const stats = [
  { label: "Years of experience", value: "14+", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "Consultations", value: "12k+", icon: <Users className="h-5 w-5" /> },
  { label: "Patient rating", value: "4.9/5", icon: <Star className="h-5 w-5" /> },
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  preferredDate: "",
  preferredSlot: "",
  concern: "",
};

export default function ConsultHomeopath() {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name || !formData.phone || !formData.preferredDate || !formData.preferredSlot) {
      toast.error("Please fill all mandatory fields.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Appointment request sent! Our care team will call you within 30 minutes.");
      setFormData(initialForm);
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <div className="bg-gradient-to-b from-background via-secondary/30 to-background text-foreground">
      <section className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
            <Badge className="bg-[#A6FF00]/15 text-lime-700 gap-2 w-fit">
              <ShieldCheck className="h-4 w-4" /> Verified Homoeopath on HomeoCure
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Consult{" "}
                <span className="text-lime-600">Dr. Ananya Rao</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                MD (Hom), Senior Consultant | Holistic care for chronic lifestyle conditions, skin,
                respiratory and hormonal health. Inspired by Lybrate’s structured experience, now curated within HomeoCure.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {stats.map((item) => (
                <Card key={item.label} className="bg-card/80 border-border/60 shadow-none">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="rounded-full bg-secondary/70 p-3 text-primary">{item.icon}</div>
                    <div>
                      <p className="text-2xl font-semibold">{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["Chronic Migraine", "Thyroid", "PCOS", "Skin & Hair", "Allergies", "Child Wellness"].map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full border border-lime-200 text-lime-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <Card className="bg-black text-white rounded-3xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Same-day priority slots</CardTitle>
                <p className="text-sm text-white/70">Clinic: Jubilee Hills, Hyderabad • Video worldwide</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Starting from</p>
                    <p className="text-3xl font-semibold text-[#A6FF00]">₹699</p>
                  </div>
                  <Badge className="bg-white/10 text-white border border-white/20">Cashless Available</Badge>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Clock className="h-5 w-5" />
                  <span>Mon - Sat • 9:00 AM to 9:00 PM</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <MapPin className="h-5 w-5" />
                  <span>4th Floor, Wellness Square, Road 36</span>
                </div>
                <Button className="w-full bg-[#A6FF00] text-black hover:bg-[#98f000]" size="lg">
                  Call Care Team • +91 98210 44558
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="container max-w-6xl mx-auto px-4 pb-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Book an appointment</CardTitle>
              <p className="text-sm text-muted-foreground">Secure, encrypted form • Instant confirmation email</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Enter your full name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@domain.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Preferred Date *</label>
                    <Input type="date" value={formData.preferredDate} onChange={(e) => handleChange("preferredDate", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Preferred Slot *</label>
                  <Input
                    placeholder="e.g. 4:00 PM IST • Video Consultation"
                    value={formData.preferredSlot}
                    onChange={(e) => handleChange("preferredSlot", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Health concern</label>
                  <Textarea
                    value={formData.concern}
                    onChange={(e) => handleChange("concern", e.target.value)}
                    rows={4}
                    placeholder="Briefly describe symptoms, medications, or goals."
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Booking your slot..." : "Request Appointment"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to share your details with Dr. Rao’s clinic for medical purposes only.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultation Charges & Modes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {consultationOptions.map((option) => (
                <div key={option.title} className="rounded-2xl border border-border/60 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-secondary p-2">{option.icon}</div>
                      <p className="font-semibold">{option.title}</p>
                    </div>
                    <Badge className="bg-[#A6FF00]/20 text-lime-700 border-none">{option.price}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {option.duration}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {option.includes.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-lime-600" /> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What patients are saying</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <div key={review.name} className="rounded-2xl border border-border/70 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.condition}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      {review.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">“{review.content}”</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Clinic address & hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-lime-600 mt-1" />
                <div>
                  <p>Wellness Square, 4th Floor</p>
                  <p className="text-sm text-muted-foreground">Road No. 36, Jubilee Hills, Hyderabad</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-lime-600 mt-1" />
                <div>
                  <p>Mon - Sat: 9 AM – 9 PM</p>
                  <p className="text-sm text-muted-foreground">Sun: 10 AM – 2 PM (Video only)</p>
                </div>
              </div>
              <iframe
                title="Clinic location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.3592454573075!2d78.3995!3d17.4375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb96d9cfe8a7f1%3A0x8f47779fba399a27!2sJubilee%20Hills!5e0!3m2!1sen!2sin!4v1700000000000"
                className="w-full rounded-2xl border border-border h-60"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Need quick guidance?</CardTitle>
                <p className="text-sm text-muted-foreground">Care team responds in under 5 minutes.</p>
              </div>
              <MessageCircle className="h-8 w-8 text-lime-600" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2">
                <Phone className="h-4 w-4" /> Call +91 98210 44558
              </Button>
              <Button variant="ghost" className="w-full gap-2 text-lime-700">
                <Video className="h-4 w-4" /> Request instant video slot
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                100% refund if doctor reschedules | Prescriptions shared digitally.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="border border-border/70 rounded-2xl p-4">
                  <p className="font-semibold mb-2">{faq.question}</p>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-secondary/50 border-dashed border-2 border-lime-300">
            <CardContent className="flex flex-col gap-3 py-6 text-center">
              <IndianRupee className="h-10 w-10 mx-auto text-lime-600" />
              <p className="text-lg font-semibold">Cashless & EMI ready</p>
              <p className="text-sm text-muted-foreground">
                We support popular insurers and HSA cards for chronic care. Ask our team for paperwork.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
