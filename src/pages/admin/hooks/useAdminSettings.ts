import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  DEFAULT_FEATURE_CARDS,
  DEFAULT_HEALTH_CONCERNS,
  DEFAULT_QUICK_ACTIONS,
  type FeatureCardSetting,
  type HealthConcernSetting,
  type QuickActionSetting,
} from "@/data/siteDefaults";
import { isValidUrl } from "@/lib/utils";

export type SettingsFormState = {
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

export type UrlErrorMap = Record<string, string>;

const SOCIAL_URL_FIELDS: Array<keyof SettingsFormState> = [
  "facebookUrl",
  "twitterUrl",
  "instagramUrl",
  "linkedinUrl",
];

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

export function useAdminSettings() {
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

  return {
    formData,
    isSubmitting,
    urlErrors,
    isLoading: settings === undefined,
    handleChange,
    handleSwitchChange,
    handleQuickActionsChange,
    handleHealthConcernsChange,
    handleFeatureCardsChange,
    clearUrlError,
    handleSubmit,
  };
}
