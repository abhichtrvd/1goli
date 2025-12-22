import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SettingsQuickActionsSection } from "./components/SettingsQuickActionsSection";
import { SettingsHealthConcernsSection } from "./components/SettingsHealthConcernsSection";
import { SettingsFeatureCardsSection } from "./components/SettingsFeatureCardsSection";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DEFAULT_FEATURE_CARDS,
  DEFAULT_HEALTH_CONCERNS,
  DEFAULT_QUICK_ACTIONS,
  DEFAULT_FEATURED_BRANDS,
  type FeatureCardSetting,
  type HealthConcernSetting,
  type QuickActionSetting,
} from "@/data/siteDefaults";
import { cn } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

type SettingsFormState = {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  shippingFee: number;
  freeShippingThreshold: number;
  maintenanceMode: boolean;
  bannerMessage: string;
  heroHeadline: string;
  heroDescription: string;
  address: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  featuredBrands: string;
  quickActions: QuickActionSetting[];
  healthConcerns: HealthConcernSetting[];
  featureCards: FeatureCardSetting[];
};

type UrlErrorMap = Record<string, string>;

const SOCIAL_URL_FIELDS: Array<keyof SettingsFormState> = [
  "facebookUrl",
  "twitterUrl",
  "instagramUrl",
  "linkedinUrl",
];

const isValidUrl = (value: string, options?: { allowRelative?: boolean }) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (options?.allowRelative && trimmed.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const createDefaultState = (): SettingsFormState => ({
  siteName: "1goli",
  supportEmail: "support@1goli.com",
  supportPhone: "+91 98765 43210",
  shippingFee: 50,
  freeShippingThreshold: 500,
  maintenanceMode: false,
  bannerMessage: "",
  heroHeadline: "Homoeopathy, Simplified by 1goli",
  heroDescription:
    "India's trusted Homeopathic Pharmacy. Authentic remedies, expert guidance, and doorstep delivery.",
  address: "123 Wellness Street, Health City, India 400001",
  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  featuredBrands:
    "Dr. Reckeweg, SBL World Class, Schwabe India, Adel Pekana, Bakson's, Bjain Pharma",
  quickActions: DEFAULT_QUICK_ACTIONS.map((action) => ({ ...action })),
  healthConcerns: DEFAULT_HEALTH_CONCERNS.map((concern) => ({ ...concern })),
  featureCards: DEFAULT_FEATURE_CARDS.map((card) => ({ ...card })),
});

export default function AdminSettings() {
  const settings = useQuery(api.settings.getSettings);
  const updateSettings = useMutation(api.settings.updateSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SettingsFormState>(() => createDefaultState());
  const [urlErrors, setUrlErrors] = useState<UrlErrorMap>({});

  useEffect(() => {
    if (!settings) return;

    const defaults = createDefaultState();

    setFormData({
      siteName: settings.siteName ?? defaults.siteName,
      supportEmail: settings.supportEmail ?? defaults.supportEmail,
      supportPhone: settings.supportPhone ?? defaults.supportPhone,
      shippingFee: settings.shippingFee ?? defaults.shippingFee,
      freeShippingThreshold: settings.freeShippingThreshold ?? defaults.freeShippingThreshold,
      maintenanceMode: settings.maintenanceMode ?? defaults.maintenanceMode,
      bannerMessage: settings.bannerMessage ?? "",
      heroHeadline: settings.heroHeadline ?? defaults.heroHeadline,
      heroDescription: settings.heroDescription ?? defaults.heroDescription,
      address: settings.address ?? defaults.address,
      facebookUrl: settings.facebookUrl ?? "",
      twitterUrl: settings.twitterUrl ?? "",
      instagramUrl: settings.instagramUrl ?? "",
      linkedinUrl: settings.linkedinUrl ?? "",
      featuredBrands:
        settings.featuredBrands?.join(", ") ?? defaults.featuredBrands,
      quickActions:
        ((settings.quickActions ?? defaults.quickActions).map((action) => ({ ...action })) as QuickActionSetting[]),
      healthConcerns:
        ((settings.healthConcerns ?? defaults.healthConcerns).map((concern) => ({ ...concern })) as HealthConcernSetting[]),
      featureCards:
        ((settings.featureCards ?? defaults.featureCards).map((card) => ({ ...card })) as FeatureCardSetting[]),
    });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (SOCIAL_URL_FIELDS.includes(name as keyof SettingsFormState)) {
      clearUrlError(name);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, maintenanceMode: checked }));
  };

  const clearUrlError = (key: string) => {
    setUrlErrors((prev) => {
      if (!prev[key]) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleQuickActionsChange = (actions: QuickActionSetting[]) => {
    setFormData((prev) => ({ ...prev, quickActions: actions }));
  };

  const handleHealthConcernsChange = (concerns: HealthConcernSetting[]) => {
    setFormData((prev) => ({ ...prev, healthConcerns: concerns }));
  };

  const handleFeatureCardsChange = (cards: FeatureCardSetting[]) => {
    setFormData((prev) => ({ ...prev, featureCards: cards }));
  };

  const validateUrls = () => {
    const errors: UrlErrorMap = {};

    SOCIAL_URL_FIELDS.forEach((field) => {
      const value = (formData[field] as string | undefined)?.trim();
      if (value && !isValidUrl(value)) {
        errors[field] = "Enter a valid https:// link.";
      }
    });

    formData.quickActions.forEach((action, index) => {
      const href = action.href.trim();
      if (href && !isValidUrl(href, { allowRelative: true })) {
        errors[`quickAction-${index}`] = "Use https:// URL or an internal path starting with /.";
      }
    });

    formData.featureCards.forEach((card, index) => {
      const href = card.href.trim();
      if (href && !isValidUrl(href, { allowRelative: true })) {
        errors[`featureCard-${index}`] = "Use https:// URL or an internal path starting with /.";
      }
    });

    setUrlErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrls()) {
      toast.error("Please correct the highlighted URLs before saving.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSettings({
        siteName: formData.siteName,
        supportEmail: formData.supportEmail,
        supportPhone: formData.supportPhone,
        shippingFee: Number(formData.shippingFee),
        freeShippingThreshold: Number(formData.freeShippingThreshold),
        maintenanceMode: formData.maintenanceMode,
        bannerMessage: formData.bannerMessage || undefined,
        heroHeadline: formData.heroHeadline || undefined,
        heroDescription: formData.heroDescription || undefined,
        address: formData.address || undefined,
        facebookUrl: formData.facebookUrl.trim() || undefined,
        twitterUrl: formData.twitterUrl.trim() || undefined,
        instagramUrl: formData.instagramUrl.trim() || undefined,
        linkedinUrl: formData.linkedinUrl.trim() || undefined,
        featuredBrands: formData.featuredBrands
          .split(",")
          .map((b) => b.trim())
          .filter((b) => b.length > 0),
        quickActions: formData.quickActions,
        healthConcerns: formData.healthConcerns,
        featureCards: formData.featureCards,
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

          <SettingsQuickActionsSection
            quickActions={formData.quickActions}
            onChange={handleQuickActionsChange}
            errors={urlErrors}
            onClearError={clearUrlError}
          />

          <SettingsHealthConcernsSection
            healthConcerns={formData.healthConcerns}
            onChange={handleHealthConcernsChange}
          />

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
                    className={cn(urlErrors.facebookUrl && "border-destructive focus-visible:ring-destructive/60")}
                    aria-invalid={Boolean(urlErrors.facebookUrl)}
                  />
                  {urlErrors.facebookUrl ? (
                    <p className="text-xs text-destructive">{urlErrors.facebookUrl}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input
                    id="twitterUrl"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                    className={cn(urlErrors.twitterUrl && "border-destructive focus-visible:ring-destructive/60")}
                    aria-invalid={Boolean(urlErrors.twitterUrl)}
                  />
                  {urlErrors.twitterUrl ? (
                    <p className="text-xs text-destructive">{urlErrors.twitterUrl}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram URL</Label>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    placeholder="https://instagram.com/..."
                    className={cn(urlErrors.instagramUrl && "border-destructive focus-visible:ring-destructive/60")}
                    aria-invalid={Boolean(urlErrors.instagramUrl)}
                  />
                  {urlErrors.instagramUrl ? (
                    <p className="text-xs text-destructive">{urlErrors.instagramUrl}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/..."
                    className={cn(urlErrors.linkedinUrl && "border-destructive focus-visible:ring-destructive/60")}
                    aria-invalid={Boolean(urlErrors.linkedinUrl)}
                  />
                  {urlErrors.linkedinUrl ? (
                    <p className="text-xs text-destructive">{urlErrors.linkedinUrl}</p>
                  ) : null}
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

          <SettingsFeatureCardsSection
            featureCards={formData.featureCards}
            onChange={handleFeatureCardsChange}
            errors={urlErrors}
            onClearError={clearUrlError}
          />

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