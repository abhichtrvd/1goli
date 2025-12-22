import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DEFAULT_FEATURE_CARDS,
  DEFAULT_HEALTH_CONCERNS,
  DEFAULT_QUICK_ACTIONS,
  FeatureCardSetting,
  HealthConcernSetting,
  QuickActionSetting,
  DEFAULT_FEATURED_BRANDS,
} from "@/data/siteDefaults";
import { cn } from "@/lib/utils";
import { Loader2, Save, Trash2, Plus, Upload, Stethoscope, Pill, Star } from "lucide-react";

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

const QUICK_ACTION_ICON_OPTIONS = [
  { label: "Upload", value: "upload" },
  { label: "Stethoscope", value: "stethoscope" },
  { label: "Pill", value: "pill" },
  { label: "Star", value: "star" },
] as const;

const QUICK_ACTION_ACCENT_OPTIONS = [
  { label: "Lime", value: "lime" },
  { label: "Blue", value: "blue" },
  { label: "Pink", value: "pink" },
  { label: "Purple", value: "purple" },
] as const;

const HEALTH_CONCERN_ICON_OPTIONS = [
  { label: "Activity", value: "activity" },
  { label: "Heart", value: "heart" },
  { label: "Pill", value: "pill" },
  { label: "Thermometer", value: "thermometer" },
  { label: "Flask", value: "flask" },
  { label: "Stethoscope", value: "stethoscope" },
] as const;

const HEALTH_CONCERN_COLOR_OPTIONS = [
  { label: "Sunset Orange", value: "orange" },
  { label: "Rose", value: "red" },
  { label: "Lime", value: "lime" },
  { label: "Herbal Green", value: "green" },
  { label: "Lavender", value: "purple" },
  { label: "Teal", value: "teal" },
] as const;

const FEATURE_CARD_THEME_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

const cloneQuickActions = () =>
  DEFAULT_QUICK_ACTIONS.map((action) => ({ ...action }));
const cloneHealthConcerns = () =>
  DEFAULT_HEALTH_CONCERNS.map((concern) => ({ ...concern }));
const cloneFeatureCards = () =>
  DEFAULT_FEATURE_CARDS.map((card) => ({ ...card }));

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
  quickActions: cloneQuickActions(),
  healthConcerns: cloneHealthConcerns(),
  featureCards: cloneFeatureCards(),
});

export default function AdminSettings() {
  const settings = useQuery(api.settings.getSettings);
  const updateSettings = useMutation(api.settings.updateSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState<SettingsFormState>(() => createDefaultState());

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
        facebookUrl: formData.facebookUrl || undefined,
        twitterUrl: formData.twitterUrl || undefined,
        instagramUrl: formData.instagramUrl || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
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

  const updateQuickAction = <T extends keyof QuickActionSetting>(
    index: number,
    field: T,
    value: QuickActionSetting[T],
  ) => {
    setFormData((prev) => {
      const updated = [...prev.quickActions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, quickActions: updated };
    });
  };

  const addQuickAction = () => {
    setFormData((prev) => ({
      ...prev,
      quickActions: [
        ...prev.quickActions,
        {
          title: "New Action",
          description: "Describe this action",
          href: "/",
          icon: "upload",
          accent: "lime",
        },
      ],
    }));
  };

  const removeQuickAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      quickActions: prev.quickActions.filter((_, i) => i !== index),
    }));
  };

  const updateHealthConcern = <T extends keyof HealthConcernSetting>(
    index: number,
    field: T,
    value: HealthConcernSetting[T],
  ) => {
    setFormData((prev) => {
      const updated = [...prev.healthConcerns];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, healthConcerns: updated };
    });
  };

  const addHealthConcern = () => {
    setFormData((prev) => ({
      ...prev,
      healthConcerns: [
        ...prev.healthConcerns,
        {
          title: "New Concern",
          query: "New Concern",
          icon: "activity",
          color: "orange",
        },
      ],
    }));
  };

  const removeHealthConcern = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      healthConcerns: prev.healthConcerns.filter((_, i) => i !== index),
    }));
  };

  const updateFeatureCard = <T extends keyof FeatureCardSetting>(
    index: number,
    field: T,
    value: FeatureCardSetting[T],
  ) => {
    setFormData((prev) => {
      const updated = [...prev.featureCards];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, featureCards: updated };
    });
  };

  const addFeatureCard = () => {
    setFormData((prev) => ({
      ...prev,
      featureCards: [
        ...prev.featureCards,
        {
          title: "New Card",
          description: "Describe this AI capability",
          href: "/",
          theme: "light",
        },
      ],
    }));
  };

  const removeFeatureCard = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      featureCards: prev.featureCards.filter((_, i) => i !== index),
    }));
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
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Customize the action tiles shown under the hero section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.quickActions.map((action, index) => (
                <div
                  key={`quick-action-${index}`}
                  className="rounded-xl border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      Action {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuickAction(index)}
                      aria-label="Remove quick action"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={action.title}
                        onChange={(e) =>
                          updateQuickAction(index, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link</Label>
                      <Input
                        value={action.href}
                        onChange={(e) =>
                          updateQuickAction(index, "href", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={action.description}
                        onChange={(e) =>
                          updateQuickAction(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={action.icon}
                        onValueChange={(value) =>
                          updateQuickAction(
                            index,
                            "icon",
                            value as QuickActionSetting["icon"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUICK_ACTION_ICON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent</Label>
                      <Select
                        value={action.accent}
                        onValueChange={(value) =>
                          updateQuickAction(
                            index,
                            "accent",
                            value as QuickActionSetting["accent"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose accent" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUICK_ACTION_ACCENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addQuickAction}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Quick Action
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Concerns</CardTitle>
              <CardDescription>
                Control the "Shop by Health Concern" grid.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.healthConcerns.map((concern, index) => (
                <div
                  key={`health-concern-${index}`}
                  className="rounded-xl border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      Concern {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHealthConcern(index)}
                      aria-label="Remove health concern"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={concern.title}
                        onChange={(e) =>
                          updateHealthConcern(index, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Search Query</Label>
                      <Input
                        value={concern.query}
                        onChange={(e) =>
                          updateHealthConcern(index, "query", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={concern.icon}
                        onValueChange={(value) =>
                          updateHealthConcern(
                            index,
                            "icon",
                            value as HealthConcernSetting["icon"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {HEALTH_CONCERN_ICON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={concern.color}
                        onValueChange={(value) =>
                          updateHealthConcern(
                            index,
                            "color",
                            value as HealthConcernSetting["color"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose color" />
                        </SelectTrigger>
                        <SelectContent>
                          {HEALTH_CONCERN_COLOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addHealthConcern}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Health Concern
              </Button>
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

          <Card>
            <CardHeader>
              <CardTitle>AI Feature Section</CardTitle>
              <CardDescription>
                Configure the cards displayed in the AI highlight section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.featureCards.map((cardData, index) => (
                <div
                  key={`feature-card-${index}`}
                  className="rounded-xl border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Card {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeatureCard(index)}
                      aria-label="Remove feature card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={cardData.title}
                        onChange={(e) =>
                          updateFeatureCard(index, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link</Label>
                      <Input
                        value={cardData.href}
                        onChange={(e) =>
                          updateFeatureCard(index, "href", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={cardData.description}
                        onChange={(e) =>
                          updateFeatureCard(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select
                        value={cardData.theme}
                        onValueChange={(value) =>
                          updateFeatureCard(
                            index,
                            "theme",
                            value as FeatureCardSetting["theme"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {FEATURE_CARD_THEME_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addFeatureCard}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature Card
              </Button>
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