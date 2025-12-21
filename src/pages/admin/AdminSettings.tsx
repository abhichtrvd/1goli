import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function AdminSettings() {
  const settings = useQuery(api.settings.getSettings);
  const updateSettings = useMutation(api.settings.updateSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState({
    siteName: "1goli",
    supportEmail: "support@1goli.com",
    supportPhone: "+91 98765 43210",
    shippingFee: 50,
    freeShippingThreshold: 500,
    maintenanceMode: false,
    bannerMessage: "",
    heroHeadline: "Homoeopathy, Simplified by 1goli",
    heroDescription: "India's trusted Homeopathic Pharmacy. Authentic remedies, expert guidance, and doorstep delivery.",
    address: "123 Wellness Street, Health City, India 400001",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    featuredBrands: "Dr. Reckeweg, SBL World Class, Schwabe India, Adel Pekana, Bakson's, Bjain Pharma",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        siteName: settings.siteName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        shippingFee: settings.shippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        maintenanceMode: settings.maintenanceMode,
        bannerMessage: settings.bannerMessage || "",
        heroHeadline: settings.heroHeadline || "Homoeopathy, Simplified by 1goli",
        heroDescription: settings.heroDescription || "India's trusted Homeopathic Pharmacy. Authentic remedies, expert guidance, and doorstep delivery.",
        address: settings.address || "123 Wellness Street, Health City, India 400001",
        facebookUrl: settings.facebookUrl || "",
        twitterUrl: settings.twitterUrl || "",
        instagramUrl: settings.instagramUrl || "",
        linkedinUrl: settings.linkedinUrl || "",
        featuredBrands: settings.featuredBrands ? settings.featuredBrands.join(", ") : "Dr. Reckeweg, SBL World Class, Schwabe India, Adel Pekana, Bakson's, Bjain Pharma",
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, maintenanceMode: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSettings({
        ...formData,
        shippingFee: Number(formData.shippingFee),
        freeShippingThreshold: Number(formData.freeShippingThreshold),
        featuredBrands: formData.featuredBrands.split(",").map(b => b.trim()).filter(b => b.length > 0),
      });
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage global site configuration.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic details about the store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input 
                    id="siteName" 
                    name="siteName" 
                    value={formData.siteName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input 
                    id="supportEmail" 
                    name="supportEmail" 
                    type="email" 
                    value={formData.supportEmail} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input 
                    id="supportPhone" 
                    name="supportPhone" 
                    value={formData.supportPhone} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Customize the main landing page banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroHeadline">Headline</Label>
                <Input 
                  id="heroHeadline" 
                  name="heroHeadline" 
                  value={formData.heroHeadline} 
                  onChange={handleChange} 
                  placeholder="Homoeopathy, Simplified by 1goli"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroDescription">Description</Label>
                <Textarea 
                  id="heroDescription" 
                  name="heroDescription" 
                  value={formData.heroDescription} 
                  onChange={handleChange} 
                  placeholder="India's trusted Homeopathic Pharmacy..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Brands</CardTitle>
              <CardDescription>Manage brands shown on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featuredBrands">Brands List (comma separated)</Label>
                <Textarea 
                  id="featuredBrands" 
                  name="featuredBrands" 
                  value={formData.featuredBrands} 
                  onChange={handleChange} 
                  placeholder="Dr. Reckeweg, SBL World Class, Schwabe India..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Links to your social media profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input 
                    id="facebookUrl" 
                    name="facebookUrl" 
                    value={formData.facebookUrl} 
                    onChange={handleChange} 
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input 
                    id="twitterUrl" 
                    name="twitterUrl" 
                    value={formData.twitterUrl} 
                    onChange={handleChange} 
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram URL</Label>
                  <Input 
                    id="instagramUrl" 
                    name="instagramUrl" 
                    value={formData.instagramUrl} 
                    onChange={handleChange} 
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input 
                    id="linkedinUrl" 
                    name="linkedinUrl" 
                    value={formData.linkedinUrl} 
                    onChange={handleChange} 
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping & Delivery</CardTitle>
              <CardDescription>Configure shipping costs and thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingFee">Standard Shipping Fee (₹)</Label>
                  <Input 
                    id="shippingFee" 
                    name="shippingFee" 
                    type="number" 
                    min="0"
                    value={formData.shippingFee} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
                  <Input 
                    id="freeShippingThreshold" 
                    name="freeShippingThreshold" 
                    type="number" 
                    min="0"
                    value={formData.freeShippingThreshold} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Control site availability and announcements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable the public site for maintenance. Admin access remains.
                  </p>
                </div>
                <Switch 
                  checked={formData.maintenanceMode} 
                  onCheckedChange={handleSwitchChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerMessage">Announcement Banner</Label>
                <Textarea 
                  id="bannerMessage" 
                  name="bannerMessage" 
                  value={formData.bannerMessage} 
                  onChange={handleChange} 
                  placeholder="e.g., 'Diwali Sale is Live! Get 20% off.'"
                />
                <p className="text-xs text-muted-foreground">Leave empty to hide the banner.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}