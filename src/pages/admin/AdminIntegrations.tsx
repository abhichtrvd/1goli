import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Settings,
  Check,
  X,
  Plug,
  CreditCard,
  Mail,
  MessageSquare,
  BarChart3,
  Truck,
  Users,
  DollarSign,
  Power,
  PowerOff,
  ExternalLink,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

const CATEGORY_ICONS: Record<string, any> = {
  payment: CreditCard,
  shipping: Truck,
  email: Mail,
  sms: MessageSquare,
  analytics: BarChart3,
  crm: Users,
  accounting: DollarSign,
};

const CATEGORY_COLORS: Record<string, string> = {
  payment: "bg-green-500/10 text-green-700 dark:text-green-400",
  shipping: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  email: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sms: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  analytics: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  crm: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  accounting: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

export default function AdminIntegrations() {
  const integrations = useQuery(api.integrations.listAvailableIntegrations, {});
  const installedIntegrations = useQuery(api.integrations.getInstalledIntegrations);
  const installIntegration = useMutation(api.integrations.installIntegration);
  const configureIntegration = useMutation(api.integrations.configureIntegration);
  const uninstallIntegration = useMutation(api.integrations.uninstallIntegration);
  const toggleStatus = useMutation(api.integrations.toggleIntegrationStatus);
  const testConnection = useAction(api.integrations.testIntegration);
  const initializeMarketplace = useMutation(api.integrations.initializeMarketplace);

  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [additionalSettings, setAdditionalSettings] = useState("");
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const handleInitializeMarketplace = async () => {
    try {
      const result = await initializeMarketplace({});
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleViewDetails = (integration: any) => {
    setSelectedIntegration(integration);
    setIsDetailDialogOpen(true);
  };

  const handleConfigure = (integration: any) => {
    setSelectedIntegration(integration);
    if (integration.config) {
      setApiKey(integration.config.apiKey || "");
      setApiSecret(integration.config.apiSecret || "");
      setWebhookUrl(integration.config.webhookUrl || "");
      setAdditionalSettings(integration.config.settings ? JSON.stringify(integration.config.settings, null, 2) : "");
    } else {
      setApiKey("");
      setApiSecret("");
      setWebhookUrl("");
      setAdditionalSettings("");
    }
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;

    try {
      let settings;
      if (additionalSettings.trim()) {
        try {
          settings = JSON.parse(additionalSettings);
        } catch (e) {
          toast.error("Invalid JSON in additional settings");
          return;
        }
      }

      const config = {
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        webhookUrl: webhookUrl || undefined,
        settings: settings,
      };

      if (selectedIntegration.status !== "available") {
        await configureIntegration({
          integrationId: selectedIntegration._id,
          config,
        });
        toast.success("Configuration updated successfully");
      } else {
        await installIntegration({
          integrationId: selectedIntegration._id,
          config,
        });
        toast.success("Integration installed successfully");
      }

      setIsConfigDialogOpen(false);
      setSelectedIntegration(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUninstall = async (integrationId: Id<"integrations">, name: string) => {
    if (!confirm(`Are you sure you want to uninstall ${name}? This will remove all configuration.`)) return;

    try {
      await uninstallIntegration({ integrationId });
      toast.success("Integration uninstalled successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (integrationId: Id<"integrations">, currentStatus: string) => {
    try {
      const isActive = currentStatus === "active";
      await toggleStatus({ integrationId, isActive: !isActive });
      toast.success(isActive ? "Integration deactivated" : "Integration activated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTestConnection = async (integrationId: Id<"integrations">) => {
    setTestingConnectionId(integrationId);
    try {
      const result = await testConnection({ integrationId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTestingConnectionId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <Check className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary">
            <PowerOff className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );
      case "installed":
        return (
          <Badge variant="outline">
            <Check className="w-3 h-3 mr-1" />
            Installed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Available
          </Badge>
        );
    }
  };

  const filteredIntegrations = integrations?.filter((integration) => {
    if (activeTab === "all") return true;
    if (activeTab === "installed") {
      return integration.status !== "available";
    }
    return integration.category === activeTab;
  });

  const stats = {
    total: integrations?.length || 0,
    installed: installedIntegrations?.length || 0,
    active: installedIntegrations?.filter((i) => i.status === "active").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Integration Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Connect your store with 20+ powerful integrations across 7 categories
          </p>
        </div>
        {(!integrations || integrations.length === 0) && (
          <Button onClick={handleInitializeMarketplace} size="lg">
            <Plug className="w-4 h-4 mr-2" />
            Initialize Marketplace
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {integrations && integrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Integrations</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Installed</CardDescription>
              <CardTitle className="text-3xl">{stats.installed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">
            All ({integrations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="installed">
            Installed ({installedIntegrations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="w-4 h-4 mr-2" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="crm">
            <Users className="w-4 h-4 mr-2" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="accounting">
            <DollarSign className="w-4 h-4 mr-2" />
            Accounting
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {!integrations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredIntegrations && filteredIntegrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration._id}
                  integration={integration}
                  onConfigure={handleConfigure}
                  onViewDetails={handleViewDetails}
                  onUninstall={handleUninstall}
                  onToggleStatus={handleToggleStatus}
                  onTest={handleTestConnection}
                  isTesting={testingConnectionId === integration._id}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No integrations found in this category.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials and settings for {selectedIntegration?.name} integration.
              These will be securely stored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key / Client ID *</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
              />
              <p className="text-xs text-muted-foreground">
                Required for authentication
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret / Client Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret..."
              />
              <p className="text-xs text-muted-foreground">
                Optional - required for some providers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhook"
              />
              <p className="text-xs text-muted-foreground">
                Optional - for receiving webhook notifications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings">Additional Settings (JSON)</Label>
              <Textarea
                id="settings"
                value={additionalSettings}
                onChange={(e) => setAdditionalSettings(e.target.value)}
                placeholder='{"region": "us-east-1", "mode": "production"}'
                className="font-mono text-sm"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Optional - provider-specific configuration in JSON format
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                All credentials are encrypted and stored securely. Never share your API keys publicly.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} disabled={!apiKey.trim()}>
                {selectedIntegration?.status !== "available" ? "Update Configuration" : "Install & Activate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedIntegration?.logoUrl && (
                <img
                  src={selectedIntegration.logoUrl}
                  alt={selectedIntegration.name}
                  className="w-12 h-12 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {selectedIntegration?.name}
                  {selectedIntegration?.isPopular && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Popular
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedIntegration?.category}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {selectedIntegration?.description}
              </p>
            </div>

            {selectedIntegration?.supportedFeatures && selectedIntegration.supportedFeatures.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Supported Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIntegration.supportedFeatures.map((feature: string) => (
                    <Badge key={feature} variant="outline">
                      {feature.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedIntegration?.version && (
              <div>
                <h4 className="font-semibold mb-2">Version</h4>
                <Badge variant="secondary">{selectedIntegration.version}</Badge>
              </div>
            )}

            {selectedIntegration?.websiteUrl && (
              <div>
                <h4 className="font-semibold mb-2">Documentation</h4>
                <a
                  href={selectedIntegration.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Visit {selectedIntegration.name} documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {selectedIntegration?.usageCount !== undefined && selectedIntegration.usageCount > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Usage Statistics</h4>
                <p className="text-sm text-muted-foreground">
                  Used {selectedIntegration.usageCount} times
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
              {selectedIntegration?.status === "available" ? (
                <Button onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleConfigure(selectedIntegration);
                }}>
                  <Plug className="w-4 h-4 mr-2" />
                  Install
                </Button>
              ) : (
                <Button onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleConfigure(selectedIntegration);
                }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationCard({
  integration,
  onConfigure,
  onViewDetails,
  onUninstall,
  onToggleStatus,
  onTest,
  isTesting,
  getStatusBadge,
}: {
  integration: any;
  onConfigure: (integration: any) => void;
  onViewDetails: (integration: any) => void;
  onUninstall: (id: Id<"integrations">, name: string) => void;
  onToggleStatus: (id: Id<"integrations">, status: string) => void;
  onTest: (id: Id<"integrations">) => void;
  isTesting: boolean;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const Icon = CATEGORY_ICONS[integration.category] || Plug;
  const isInstalled = integration.status !== "available";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-lg ${CATEGORY_COLORS[integration.category]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">
                  {integration.name}
                </CardTitle>
                {integration.isPopular && (
                  <Badge variant="secondary" className="gap-1 flex-shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="mt-1 text-xs">
                {integration.category}
              </Badge>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusBadge(integration.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="min-h-[60px] line-clamp-3">
          {integration.description}
        </CardDescription>

        {integration.version && (
          <div className="text-xs text-muted-foreground">
            Version: {integration.version}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {isInstalled ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onConfigure(integration)}
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-1" />
                Configure
              </Button>
              {integration.status === "active" || integration.status === "inactive" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus(integration._id, integration.status)}
                >
                  {integration.status === "active" ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTest(integration._id)}
                disabled={isTesting || !integration.config}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test"
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => onConfigure(integration)}
              className="flex-1"
            >
              <Plug className="w-4 h-4 mr-1" />
              Install
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(integration)}
          >
            Details
          </Button>
        </div>

        {isInstalled && (
          <div className="pt-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onUninstall(integration._id, integration.name)}
            >
              <X className="w-4 h-4 mr-1" />
              Uninstall
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
