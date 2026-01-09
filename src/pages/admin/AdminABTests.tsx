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
import { Plus, FlaskConical, TrendingUp } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminABTests() {
  const tests = useQuery(api.abTests.getABTests, {});
  const createTest = useMutation(api.abTests.createABTest);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<Id<"abTests"> | null>(null);

  const testResults = useQuery(
    api.abTests.getABTestResults,
    selectedTestId ? { testId: selectedTestId } : "skip"
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "pricing" as "pricing" | "layout" | "messaging" | "feature",
    variantA: { name: "Control", config: {} },
    variantB: { name: "Variant", config: {} },
    trafficSplit: 50,
    goalMetric: "conversion" as "conversion" | "revenue" | "engagement" | "retention",
  });

  const handleCreate = async () => {
    try {
      await createTest({
        ...formData,
        startDate: Date.now(),
      });
      toast.success("A/B test created");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create test");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      case "draft":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground">
            Run experiments to optimize your product
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Test Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Pricing page redesign"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Testing new pricing layout..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Test Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="layout">Layout</SelectItem>
                      <SelectItem value="messaging">Messaging</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Goal Metric</Label>
                  <Select
                    value={formData.goalMetric}
                    onValueChange={(value: any) => setFormData({ ...formData, goalMetric: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="retention">Retention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Traffic Split (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.trafficSplit}
                  onChange={(e) =>
                    setFormData({ ...formData, trafficSplit: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of users to show Variant A
                </p>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests?.map((test) => (
          <Card key={test._id} className="cursor-pointer" onClick={() => setSelectedTestId(test._id)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  {test.name}
                </CardTitle>
                <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
              </div>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{test.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Goal:</span>
                  <span className="font-medium capitalize">{test.goalMetric}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Traffic Split:</span>
                  <span className="font-medium">{test.trafficSplit}% / {100 - test.trafficSplit}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTestId && testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Variant A (Control)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Assignments:</span>
                    <span className="font-medium">{testResults.variantA.assignments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversions:</span>
                    <span className="font-medium">{testResults.variantA.conversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                    <span className="font-medium">{testResults.variantA.conversionRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue:</span>
                    <span className="font-medium">${testResults.variantA.totalRevenue}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Variant B (Test)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Assignments:</span>
                    <span className="font-medium">{testResults.variantB.assignments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversions:</span>
                    <span className="font-medium">{testResults.variantB.conversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                    <span className="font-medium">{testResults.variantB.conversionRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue:</span>
                    <span className="font-medium">${testResults.variantB.totalRevenue}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Statistical Significance</p>
                  <p className="text-sm text-muted-foreground">Z-Score: {testResults.zScore}</p>
                </div>
                <Badge variant={testResults.isSignificant ? "default" : "secondary"}>
                  {testResults.isSignificant ? "Significant" : "Not Significant"}
                </Badge>
              </div>
              {testResults.winner !== "none" && (
                <p className="mt-2 text-sm">
                  Winner: <span className="font-bold">Variant {testResults.winner}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
