import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users2, TrendingUp, DollarSign } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminCohorts() {
  const cohorts = useQuery(api.cohorts.getCohorts, {});
  const createCohort = useMutation(api.cohorts.createCohort);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<Id<"cohorts"> | null>(null);

  const retention = useQuery(
    api.cohorts.getCohortRetention,
    selectedCohortId ? { cohortId: selectedCohortId, periods: 12 } : "skip"
  );

  const revenue = useQuery(
    api.cohorts.getCohortRevenue,
    selectedCohortId ? { cohortId: selectedCohortId, periods: 12 } : "skip"
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    definitionType: "signup_date" as "signup_date" | "first_purchase" | "location" | "custom",
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
  });

  const handleCreate = async () => {
    try {
      await createCohort(formData);
      toast.success("Cohort created");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create cohort");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cohort Analysis</h1>
          <p className="text-muted-foreground">
            Analyze user behavior by cohorts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Cohort
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Cohort</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cohort Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="January 2024 Signups"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={new Date(formData.startDate).toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: new Date(e.target.value).getTime() })
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={new Date(formData.endDate).toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: new Date(e.target.value).getTime() })
                  }
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Cohort
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cohorts?.map((cohort) => (
          <Card
            key={cohort._id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setSelectedCohortId(cohort._id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                {cohort.name}
              </CardTitle>
              <CardDescription>{cohort.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cohort.userCount} users</div>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCohortId && retention && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Retention Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {retention.retention.map((period) => (
                <div key={period.period} className="flex items-center gap-4">
                  <span className="w-20 text-sm">Period {period.period}</span>
                  <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${period.rate}%` }}
                    />
                  </div>
                  <span className="w-20 text-sm font-medium text-right">
                    {period.rate}% ({period.retained})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCohortId && revenue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revenue.revenue.map((period) => (
                <div key={period.period} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">Period {period.period}</span>
                  <div className="text-right">
                    <div className="font-medium">${period.revenue.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      ${period.avgPerUser} per user
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
