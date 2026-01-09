import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, MessageSquare, Bell, Plus, Send, Calendar, TrendingUp, Eye, MousePointer } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminCampaigns() {
  const campaigns = useQuery(api.campaigns.getCampaigns, {});
  const createCampaign = useMutation(api.campaigns.createCampaign);
  const sendCampaign = useMutation(api.campaigns.sendCampaign);
  const scheduleCampaign = useMutation(api.campaigns.scheduleCampaign);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Id<"campaigns"> | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    previewText: "",
    type: "email" as "email" | "sms" | "push",
    segment: "all" as "all" | "vip" | "new_users" | "inactive" | "custom",
  });

  const handleCreate = async () => {
    try {
      await createCampaign(formData);
      toast.success("Campaign created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        subject: "",
        content: "",
        previewText: "",
        type: "email",
        segment: "all",
      });
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const handleSend = async (campaignId: Id<"campaigns">) => {
    try {
      await sendCampaign({ campaignId });
      toast.success("Campaign sent successfully");
    } catch (error) {
      toast.error("Failed to send campaign");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500/10 text-green-500";
      case "sending":
        return "bg-blue-500/10 text-blue-500";
      case "scheduled":
        return "bg-yellow-500/10 text-yellow-500";
      case "failed":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "push":
        return <Bell className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email, SMS, and push notification campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new marketing campaign to reach your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Sale 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Channel</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="segment">Target Audience</Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value: any) => setFormData({ ...formData, segment: value })}
                  >
                    <SelectTrigger id="segment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="vip">VIP Customers</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                      <SelectItem value="custom">Custom List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === "email" && (
                <>
                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Don't miss our summer sale!"
                    />
                  </div>

                  <div>
                    <Label htmlFor="previewText">Preview Text</Label>
                    <Input
                      id="previewText"
                      value={formData.previewText}
                      onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                      placeholder="Up to 50% off on selected products"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your message here..."
                  rows={8}
                />
              </div>

              <Button onClick={handleCreate} className="w-full">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(campaign.type)}
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>
              <CardDescription>
                {campaign.segment === "all" ? "All Users" :
                 campaign.segment === "vip" ? "VIP Customers" :
                 campaign.segment === "new_users" ? "New Users" :
                 campaign.segment === "inactive" ? "Inactive Users" : "Custom"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.subject && (
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="font-medium truncate">{campaign.subject}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.deliveredCount || 0} sent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.openedCount || 0} opened</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span>{campaign.clickedCount || 0} clicked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {campaign.deliveredCount && campaign.openedCount
                        ? ((campaign.openedCount / campaign.deliveredCount) * 100).toFixed(1)
                        : 0}% rate
                    </span>
                  </div>
                </div>

                {campaign.status === "draft" && (
                  <Button
                    onClick={() => handleSend(campaign._id)}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </Button>
                )}

                {campaign.status === "scheduled" && campaign.scheduledAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first marketing campaign to reach your customers
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
