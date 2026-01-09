import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, LayoutDashboard, Eye, Globe, Lock } from "lucide-react";

export default function AdminDashboardBuilder() {
  const dashboards = useQuery(api.dashboards.getDashboards, { includePublic: true });
  const saveDashboard = useMutation(api.dashboards.saveDashboard);
  const deleteDashboard = useMutation(api.dashboards.deleteDashboard);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  const handleCreate = async () => {
    try {
      await saveDashboard({
        name: formData.name,
        description: formData.description,
        layout: [], // Empty layout to start
        isPublic: formData.isPublic,
      });
      toast.success("Dashboard created");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", isPublic: false });
    } catch (error) {
      toast.error("Failed to create dashboard");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Builder</h1>
          <p className="text-muted-foreground">
            Create custom dashboards with drag-and-drop widgets
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Dashboard Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Custom Dashboard"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of key metrics..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <Label htmlFor="isPublic">Make public (visible to all admins)</Label>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards?.map((dashboard) => (
          <Card key={dashboard._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  {dashboard.name}
                </CardTitle>
                {dashboard.isPublic ? (
                  <Badge variant="secondary">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
              <CardDescription>{dashboard.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {dashboard.layout.length} widgets
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Widgets</CardTitle>
          <CardDescription>
            Drag widgets to build your custom dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: "Metric Card", type: "metric_card" },
              { name: "Line Chart", type: "line_chart" },
              { name: "Bar Chart", type: "bar_chart" },
              { name: "Pie Chart", type: "pie_chart" },
              { name: "Table", type: "table" },
              { name: "Heatmap", type: "heatmap" },
            ].map((widget) => (
              <div
                key={widget.type}
                className="p-4 border-2 border-dashed rounded-lg text-center cursor-move hover:border-primary hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium">{widget.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Full drag-and-drop functionality with react-grid-layout can be added for production.
            Widget data sources will connect to the analytics queries created in analytics.ts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
