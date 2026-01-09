import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SettingsQuickActionsSection } from "./components/SettingsQuickActionsSection";
import { SettingsHealthConcernsSection } from "./components/SettingsHealthConcernsSection";
import { SettingsFeatureCardsSection } from "./components/SettingsFeatureCardsSection";
import { cn } from "@/lib/utils";
import { Loader2, Save, Upload, X, Eye, EyeOff, Plus, Send, Trash2, Key } from "lucide-react";
import { useAdminSettings } from "./hooks/useAdminSettings";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import { uploadFile, validateImageFile } from "@/lib/fileUpload";
import { toast } from "sonner";

export default function AdminSettings() {
  const {
    formData,
    setFormData,
    isSubmitting,
    urlErrors,
    isLoading,
    handleChange,
    handleSwitchChange,
    handleQuickActionsChange,
    handleHealthConcernsChange,
    handleFeatureCardsChange,
    clearUrlError,
    handleSubmit,
  } = useAdminSettings();

  const generateUploadUrl = useMutation(api.settings.generateUploadUrl);
  const sendTestEmail = useMutation(api.settings.sendTestEmail);
  const testWebhook = useMutation(api.settings.testWebhook);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    smtp: false,
    razorpay: false,
    stripe: false,
  });
  const [newApiKey, setNewApiKey] = useState({ label: "", key: "" });
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) return;

    setIsUploadingLogo(true);
    try {
      const result = await uploadFile(file, generateUploadUrl);
      if (result) {
        setFormData({
          ...formData,
          logoUrl: result.url,
          logoStorageId: result.storageId,
        });
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      console.error("Logo upload error:", error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({
      ...formData,
      logoUrl: undefined,
      logoStorageId: undefined,
    });
  };

  const handleAddApiKey = () => {
    if (!newApiKey.label.trim() || !newApiKey.key.trim()) {
      toast.error("Both label and key are required");
      return;
    }

    const apiKeys = formData.apiKeys || [];
    apiKeys.push({
      label: newApiKey.label,
      key: newApiKey.key,
      createdAt: Date.now(),
    });

    setFormData({ ...formData, apiKeys });
    setNewApiKey({ label: "", key: "" });
    toast.success("API key added");
  };

  const handleRemoveApiKey = (index: number) => {
    const apiKeys = [...(formData.apiKeys || [])];
    apiKeys.splice(index, 1);
    setFormData({ ...formData, apiKeys });
    toast.success("API key removed");
  };

  const handleSendTestEmail = async () => {
    if (!formData.smtpHost || !formData.smtpPort || !formData.smtpUsername || !formData.smtpPassword || !formData.smtpFromAddress) {
      toast.error("Please fill in all SMTP configuration fields");
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const result = await sendTestEmail({
        to: formData.supportEmail,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpUsername: formData.smtpUsername,
        smtpPassword: formData.smtpPassword,
        smtpFromAddress: formData.smtpFromAddress,
        smtpFromName: formData.smtpFromName,
      });
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleTestWebhook = async (event: string, url: string) => {
    if (!url.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }

    setTestingWebhook(event);
    try {
      const result = await testWebhook({ url, event });
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to test webhook");
    } finally {
      setTestingWebhook(null);
    }
  };

  if (isLoading) {
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
              <CardTitle>Logo & Branding</CardTitle>
              <CardDescription>Upload and manage your site logo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Site Logo</Label>
                {formData.logoUrl ? (
                  <div className="flex items-center gap-4">
                    <img src={formData.logoUrl} alt="Site Logo" className="h-20 w-20 object-contain border rounded" />
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
                      <X className="h-4 w-4 mr-2" />
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="max-w-xs"
                    />
                    {isUploadingLogo && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Recommended: PNG or SVG, max 5MB</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Server Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for sending emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    name="smtpHost"
                    value={formData.smtpHost || ""}
                    onChange={handleChange}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    value={formData.smtpPort || ""}
                    onChange={handleChange}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    name="smtpUsername"
                    value={formData.smtpUsername || ""}
                    onChange={handleChange}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      name="smtpPassword"
                      type={showPasswords.smtp ? "text" : "password"}
                      value={formData.smtpPassword || ""}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, smtp: !showPasswords.smtp })}
                    >
                      {showPasswords.smtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpFromAddress">From Email Address</Label>
                  <Input
                    id="smtpFromAddress"
                    name="smtpFromAddress"
                    type="email"
                    value={formData.smtpFromAddress || ""}
                    onChange={handleChange}
                    placeholder="noreply@1goli.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpFromName">From Name</Label>
                  <Input
                    id="smtpFromName"
                    name="smtpFromName"
                    value={formData.smtpFromName || ""}
                    onChange={handleChange}
                    placeholder="1goli Support"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
              >
                {isSendingTestEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Manage API keys for third-party integrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {formData.apiKeys && formData.apiKeys.length > 0 ? (
                  <div className="space-y-2">
                    {formData.apiKeys.map((apiKey, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{apiKey.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {apiKey.key.substring(0, 20)}...
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveApiKey(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No API keys configured yet.</p>
                )}

                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Add New API Key</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Label (e.g., Stripe API)"
                      value={newApiKey.label}
                      onChange={(e) => setNewApiKey({ ...newApiKey, label: e.target.value })}
                    />
                    <Input
                      placeholder="API Key"
                      value={newApiKey.key}
                      onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddApiKey}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add API Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Configure webhook URLs for different events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookOrderCreated">Order Created</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookOrderCreated"
                      value={formData.webhooks?.orderCreated || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        webhooks: { ...formData.webhooks, orderCreated: e.target.value }
                      })}
                      placeholder="https://your-domain.com/webhooks/order-created"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook("orderCreated", formData.webhooks?.orderCreated || "")}
                      disabled={testingWebhook === "orderCreated"}
                    >
                      {testingWebhook === "orderCreated" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookOrderShipped">Order Shipped</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookOrderShipped"
                      value={formData.webhooks?.orderShipped || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        webhooks: { ...formData.webhooks, orderShipped: e.target.value }
                      })}
                      placeholder="https://your-domain.com/webhooks/order-shipped"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook("orderShipped", formData.webhooks?.orderShipped || "")}
                      disabled={testingWebhook === "orderShipped"}
                    >
                      {testingWebhook === "orderShipped" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookOrderDelivered">Order Delivered</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookOrderDelivered"
                      value={formData.webhooks?.orderDelivered || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        webhooks: { ...formData.webhooks, orderDelivered: e.target.value }
                      })}
                      placeholder="https://your-domain.com/webhooks/order-delivered"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook("orderDelivered", formData.webhooks?.orderDelivered || "")}
                      disabled={testingWebhook === "orderDelivered"}
                    >
                      {testingWebhook === "orderDelivered" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUserRegistered">User Registered</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookUserRegistered"
                      value={formData.webhooks?.userRegistered || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        webhooks: { ...formData.webhooks, userRegistered: e.target.value }
                      })}
                      placeholder="https://your-domain.com/webhooks/user-registered"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook("userRegistered", formData.webhooks?.userRegistered || "")}
                      disabled={testingWebhook === "userRegistered"}
                    >
                      {testingWebhook === "userRegistered" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security options for your admin panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  checked={formData.enable2FA || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable2FA: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                <Textarea
                  id="ipWhitelist"
                  value={formData.ipWhitelist?.join("\n") || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    ipWhitelist: e.target.value.split("\n").filter(ip => ip.trim())
                  })}
                  placeholder="Enter one IP address per line&#10;192.168.1.1&#10;10.0.0.1"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  One IP address per line. Leave empty to allow all IPs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    name="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.sessionTimeout || ""}
                    onChange={handleChange}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">Default: 30 minutes</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordChangeInterval">Password Change Interval (days)</Label>
                  <Input
                    id="passwordChangeInterval"
                    name="passwordChangeInterval"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.passwordChangeInterval || ""}
                    onChange={handleChange}
                    placeholder="90"
                  />
                  <p className="text-xs text-muted-foreground">0 = never expire</p>
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
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment gateways and payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentGateway">Payment Gateway</Label>
                <Input
                  id="paymentGateway"
                  name="paymentGateway"
                  value={formData.paymentGateway || ""}
                  onChange={handleChange}
                  placeholder="razorpay, stripe, paypal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                  <Input
                    id="razorpayKeyId"
                    name="razorpayKeyId"
                    value={formData.razorpayKeyId || ""}
                    onChange={handleChange}
                    placeholder="rzp_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                  <Input
                    id="razorpayKeySecret"
                    name="razorpayKeySecret"
                    type="password"
                    value={formData.razorpayKeySecret || ""}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                  <Input
                    id="stripePublishableKey"
                    name="stripePublishableKey"
                    value={formData.stripePublishableKey || ""}
                    onChange={handleChange}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                  <Input
                    id="stripeSecretKey"
                    name="stripeSecretKey"
                    type="password"
                    value={formData.stripeSecretKey || ""}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Enabled Payment Methods</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableCOD"
                      checked={formData.enableCOD || false}
                      onCheckedChange={(checked) => setFormData({...formData, enableCOD: checked === true})}
                    />
                    <Label htmlFor="enableCOD" className="font-normal">Cash on Delivery (COD)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableUPI"
                      checked={formData.enableUPI || false}
                      onCheckedChange={(checked) => setFormData({...formData, enableUPI: checked === true})}
                    />
                    <Label htmlFor="enableUPI" className="font-normal">UPI Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableCard"
                      checked={formData.enableCard || false}
                      onCheckedChange={(checked) => setFormData({...formData, enableCard: checked === true})}
                    />
                    <Label htmlFor="enableCard" className="font-normal">Card Payment</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax & Currency Settings</CardTitle>
              <CardDescription>Configure tax rates and currency preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxEnabled"
                  checked={formData.taxEnabled || false}
                  onCheckedChange={(checked) => setFormData({...formData, taxEnabled: checked === true})}
                />
                <Label htmlFor="taxEnabled">Enable Tax Calculation</Label>
              </div>

              {formData.taxEnabled && (
                <div className="space-y-4 pl-6 border-l-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxName">Tax Name</Label>
                      <Input
                        id="taxName"
                        name="taxName"
                        value={formData.taxName || ""}
                        onChange={handleChange}
                        placeholder="GST, VAT, Sales Tax"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        name="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.taxRate || ""}
                        onChange={handleChange}
                        placeholder="18"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Tax Registration Number</Label>
                    <Input
                      id="taxNumber"
                      name="taxNumber"
                      value={formData.taxNumber || ""}
                      onChange={handleChange}
                      placeholder="GSTIN or Tax ID"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Code</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={formData.currency || "INR"}
                    onChange={handleChange}
                    placeholder="INR, USD, EUR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    name="currencySymbol"
                    value={formData.currencySymbol || "₹"}
                    onChange={handleChange}
                    placeholder="₹, $, €"
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