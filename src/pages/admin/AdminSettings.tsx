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
import { Loader2, Save } from "lucide-react";
import { useAdminSettings } from "./hooks/useAdminSettings";

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