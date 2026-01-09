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

  // Payment settings
  paymentGateway?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  enableCOD?: boolean;
  enableUPI?: boolean;
  enableCard?: boolean;

  // Tax settings
  taxEnabled?: boolean;
  taxName?: string;
  taxRate?: number;
  taxNumber?: string;

  // Currency settings
  currency?: string;
  currencySymbol?: string;

  // Logo/Branding
  logoUrl?: string;
  logoStorageId?: string;

  // Email Server Configuration
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromAddress?: string;
  smtpFromName?: string;

  // API Key Management
  apiKeys?: Array<{
    label: string;
    key: string;
    createdAt: number;
  }>;

  // Webhook Configuration
  webhooks?: {
    orderCreated?: string;
    orderShipped?: string;
    orderDelivered?: string;
    userRegistered?: string;
  };

  // Security Settings
  enable2FA?: boolean;
  ipWhitelist?: string[]; // Will be displayed as newline-separated text
  sessionTimeout?: number;
  passwordChangeInterval?: number;
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
        ((settings.quickActions ?? defaults.quickActions).map((action: any) => ({ ...action })) as QuickActionSetting[]),
      healthConcerns:
        ((settings.healthConcerns ?? defaults.healthConcerns).map((concern: any) => ({ ...concern })) as HealthConcernSetting[]),
      featureCards:
        ((settings.featureCards ?? defaults.featureCards).map((card: any) => ({ ...card })) as FeatureCardSetting[]),
      paymentGateway: settings.paymentGateway,
      razorpayKeyId: settings.razorpayKeyId,
      razorpayKeySecret: settings.razorpayKeySecret,
      stripePublishableKey: settings.stripePublishableKey,
      stripeSecretKey: settings.stripeSecretKey,
      enableCOD: settings.enableCOD,
      enableUPI: settings.enableUPI,
      enableCard: settings.enableCard,
      taxEnabled: settings.taxEnabled,
      taxName: settings.taxName,
      taxRate: settings.taxRate,
      taxNumber: settings.taxNumber,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      logoUrl: settings.logoUrl,
      logoStorageId: settings.logoStorageId,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUsername: settings.smtpUsername,
      smtpPassword: settings.smtpPassword,
      smtpFromAddress: settings.smtpFromAddress,
      smtpFromName: settings.smtpFromName,
      apiKeys: settings.apiKeys,
      webhooks: settings.webhooks,
      enable2FA: settings.enable2FA,
      ipWhitelist: settings.ipWhitelist,
      sessionTimeout: settings.sessionTimeout,
      passwordChangeInterval: settings.passwordChangeInterval,
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
        paymentGateway: formData.paymentGateway || undefined,
        razorpayKeyId: formData.razorpayKeyId || undefined,
        razorpayKeySecret: formData.razorpayKeySecret || undefined,
        stripePublishableKey: formData.stripePublishableKey || undefined,
        stripeSecretKey: formData.stripeSecretKey || undefined,
        enableCOD: formData.enableCOD,
        enableUPI: formData.enableUPI,
        enableCard: formData.enableCard,
        taxEnabled: formData.taxEnabled,
        taxName: formData.taxName || undefined,
        taxRate: formData.taxRate ? Number(formData.taxRate) : undefined,
        taxNumber: formData.taxNumber || undefined,
        currency: formData.currency || undefined,
        currencySymbol: formData.currencySymbol || undefined,
        logoUrl: formData.logoUrl || undefined,
        logoStorageId: formData.logoStorageId as any,
        smtpHost: formData.smtpHost || undefined,
        smtpPort: formData.smtpPort ? Number(formData.smtpPort) : undefined,
        smtpUsername: formData.smtpUsername || undefined,
        smtpPassword: formData.smtpPassword || undefined,
        smtpFromAddress: formData.smtpFromAddress || undefined,
        smtpFromName: formData.smtpFromName || undefined,
        apiKeys: formData.apiKeys || undefined,
        webhooks: formData.webhooks || undefined,
        enable2FA: formData.enable2FA,
        ipWhitelist: formData.ipWhitelist || undefined,
        sessionTimeout: formData.sessionTimeout ? Number(formData.sessionTimeout) : undefined,
        passwordChangeInterval: formData.passwordChangeInterval ? Number(formData.passwordChangeInterval) : undefined,
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
    setFormData,
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
