import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Funnel, TrendingDown } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminFunnels() {
  const funnels = useQuery(api.funnels.getFunnels, {});
  const [selectedFunnelId, setSelectedFunnelId] = useState<Id<"funnels"> | null>(null);

  const stats = useQuery(
    api.funnels.getFunnelStats,
    selectedFunnelId ? { funnelId: selectedFunnelId } : "skip"
  );

  const dropoff = useQuery(
    api.funnels.getDropoffAnalysis,
    selectedFunnelId ? { funnelId: selectedFunnelId } : "skip"
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funnel Analysis</h1>
          <p className="text-muted-foreground">
            Track user journeys and identify drop-off points
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Funnel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funnels?.map((funnel) => (
          <Card
            key={funnel._id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setSelectedFunnelId(funnel._id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Funnel className="h-5 w-5" />
                {funnel.name}
              </CardTitle>
              <CardDescription>{funnel.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {funnel.steps.length} steps
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedFunnelId && stats && (
        <Card>
          <CardHeader>
            <CardTitle>Funnel Visualization</CardTitle>
            <CardDescription>
              Total sessions: {stats.totalSessions}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.steps.map((step, index) => (
                <div key={step.stepIndex}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{step.stepName}</span>
                    <span className="text-sm text-muted-foreground">
                      {step.sessions} sessions
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-16 bg-primary/10 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary flex items-center justify-center text-white font-medium"
                        style={{ width: `${step.conversionFromStart}%` }}
                      >
                        {step.conversionFromStart}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>From previous: {step.conversionFromPrevious}%</span>
                    {step.avgTimeFromPrevious > 0 && (
                      <span>Avg time: {step.avgTimeFromPrevious}s</span>
                    )}
                  </div>
                  {index < stats.steps.length - 1 && (
                    <div className="h-8 flex items-center justify-center">
                      <div className="w-px h-full bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFunnelId && dropoff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Drop-off Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dropoff.dropoffs.map((drop, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{drop.fromStep} → {drop.toStep}</p>
                      <p className="text-sm text-muted-foreground">
                        {drop.dropoffCount} users dropped off
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-500">
                        {drop.dropoffRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">drop-off rate</p>
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
