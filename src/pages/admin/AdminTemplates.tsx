import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Copy, Mail, Smartphone, Bell } from "lucide-react";

export default function AdminTemplates() {
  const templates = useQuery(api.notificationTemplates.getTemplates, {});
  const createTemplate = useMutation(api.notificationTemplates.createTemplate);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "order" as "order" | "user" | "product" | "system",
    channels: ["email"] as Array<"email" | "sms" | "push">,
    subject: "",
    content: "",
  });

  const handleCreate = async () => {
    try {
      await createTemplate(formData);
      toast.success("Template created");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "order",
        channels: ["email"],
        subject: "",
        content: "",
      });
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Templates</h1>
          <p className="text-muted-foreground">
            Manage email, SMS, and push notification templates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Notification Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Order Confirmation"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject (for email)</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Your order has been confirmed"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Hi {name}, your order #{order_id} has been confirmed..."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Available variables: {"{name}"}, {"{order_id}"}, {"{amount}"}, {"{date}"}
                </p>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map((template) => (
          <Card key={template._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="capitalize">{template.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {template.channels.map((channel) => (
                    <Badge key={channel} variant="outline" className="flex items-center gap-1">
                      {channel === "email" && <Mail className="h-3 w-3" />}
                      {channel === "sms" && <Smartphone className="h-3 w-3" />}
                      {channel === "push" && <Bell className="h-3 w-3" />}
                      {channel}
                    </Badge>
                  ))}
                </div>
                {template.subject && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="text-sm font-medium truncate">{template.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Content Preview</p>
                  <p className="text-sm line-clamp-2">{template.content}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Copy className="h-3 w-3 mr-2" />
                  Clone
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
