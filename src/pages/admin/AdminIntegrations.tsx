import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Settings, Check, X, Plug, CreditCard, Mail, MessageSquare, Zap, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

const CATEGORY_ICONS: Record<string, any> = {
  payment: CreditCard,
  email: Mail,
  sms: MessageSquare,
  messaging: MessageSquare,
  automation: Zap,
  analytics: BarChart3,
};

export default function AdminIntegrations() {
  const integrations = useQuery(api.integrations.getAvailableIntegrations);
  const installIntegration = useMutation(api.integrations.installIntegration);
  const configureIntegration = useMutation(api.integrations.configureIntegration);
  const uninstallIntegration = useMutation(api.integrations.uninstallIntegration);
  const testConnection = useAction(api.integrations.testIntegrationConnection);
  const initializeMarketplace = useMutation(api.integrations.initializeMarketplace);

  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  const groupedIntegrations = integrations?.reduce((acc: any, integration) => {
    if (!acc[integration.category]) acc[integration.category] = [];
    acc[integration.category].push(integration);
    return acc;
  }, {});

  const handleInitializeMarketplace = async () => {
    try {
      await initializeMarketplace({});
      toast.success("Marketplace initialized");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleConfigure = (integration: any) => {
    setSelectedIntegration(integration);
    if (integration.config) {
      setApiKey(integration.config.apiKey || "");
      setApiSecret(integration.config.apiSecret || "");
      setWebhookUrl(integration.config.webhookUrl || "");
    } else {
      setApiKey("");
      setApiSecret("");
      setWebhookUrl("");
    }
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;

    try {
      const config = {
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        webhookUrl: webhookUrl || undefined,
      };

      if (selectedIntegration.isInstalled) {
        await configureIntegration({
          integrationId: selectedIntegration._id,
          config,
        });
        toast.success("Configuration updated");
      } else {
        await installIntegration({
          integrationId: selectedIntegration._id,
          config,
        });
        toast.success("Integration installed");
      }

      setIsConfigDialogOpen(false);
      setSelectedIntegration(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUninstall = async (integrationId: Id<"integrations">) => {
    if (!confirm("Are you sure you want to uninstall this integration?")) return;

    try {
      await uninstallIntegration({ integrationId });
      toast.success("Integration uninstalled");
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "connected":
        return "default";
      case "error":
        return "destructive";
      case "disconnected":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integration Marketplace</h1>
          <p className="text-muted-foreground">Connect with third-party services and tools</p>
        </div>
        {(!integrations || integrations.length === 0) && (
          <Button onClick={handleInitializeMarketplace}>
            <Plug className="w-4 h-4 mr-2" />
            Initialize Marketplace
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          {Object.keys(groupedIntegrations || {}).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations?.map((integration) => (
              <IntegrationCard
                key={integration._id}
                integration={integration}
                onConfigure={handleConfigure}
                onUninstall={handleUninstall}
                onTest={handleTestConnection}
                isTesting={testingConnectionId === integration._id}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations?.filter((i) => i.isInstalled).map((integration) => (
              <IntegrationCard
                key={integration._id}
                integration={integration}
                onConfigure={handleConfigure}
                onUninstall={handleUninstall}
                onTest={handleTestConnection}
                isTesting={testingConnectionId === integration._id}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(groupedIntegrations || {}).map(([category, categoryIntegrations]: [string, any]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map((integration: any) => (
                <IntegrationCard
                  key={integration._id}
                  integration={integration}
                  onConfigure={handleConfigure}
                  onUninstall={handleUninstall}
                  onTest={handleTestConnection}
                  isTesting={testingConnectionId === integration._id}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
              />
            </div>

            <div className="space-y-2">
              <Label>API Secret (optional)</Label>
              <Input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API secret..."
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook URL (optional)</Label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig}>
                {selectedIntegration?.isInstalled ? "Update" : "Install"}
              </Button>
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
  onUninstall,
  onTest,
  isTesting,
  getStatusColor,
}: {
  integration: any;
  onConfigure: (integration: any) => void;
  onUninstall: (id: Id<"integrations">) => void;
  onTest: (id: Id<"integrations">) => void;
  isTesting: boolean;
  getStatusColor: (status?: string) => string;
}) {
  const Icon = CATEGORY_ICONS[integration.category] || Plug;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {integration.category}
              </Badge>
            </div>
          </div>
          {integration.isInstalled ? (
            <Badge variant={getStatusColor(integration.status)}>
              {integration.status === "connected" ? (
                <Check className="w-3 h-3 mr-1" />
              ) : (
                <X className="w-3 h-3 mr-1" />
              )}
              {integration.status}
            </Badge>
          ) : (
            <Badge variant="outline">Not Installed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 min-h-[40px]">
          {integration.description}
        </CardDescription>
        <div className="flex gap-2">
          {integration.isInstalled ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onConfigure(integration)}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTest(integration._id)}
                disabled={isTesting}
              >
                {isTesting ? "Testing..." : "Test"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUninstall(integration._id)}
              >
                Uninstall
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onConfigure(integration)} className="w-full">
              <Plug className="w-4 h-4 mr-2" />
              Install
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
