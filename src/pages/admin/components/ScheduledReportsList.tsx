import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ScheduledReportsListProps {
  schedules: any[];
}

export function ScheduledReportsList({ schedules }: ScheduledReportsListProps) {
  const updateSchedule = useMutation(api.reports.updateSchedule);
  const deleteSchedule = useMutation(api.reports.deleteSchedule);

  const handleToggleEnabled = async (scheduleId: any, enabled: boolean) => {
    try {
      await updateSchedule({ scheduleId, enabled });
      toast.success(`Schedule ${enabled ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(`Failed to update schedule: ${error.message}`);
    }
  };

  const handleDelete = async (scheduleId: any) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await deleteSchedule({ scheduleId });
      toast.success("Schedule deleted successfully");
    } catch (error: any) {
      toast.error(`Failed to delete schedule: ${error.message}`);
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No scheduled reports. Click the calendar icon on a report to schedule it.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report Name</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Last Status</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule._id}>
              <TableCell className="font-medium">{schedule.reportName}</TableCell>
              <TableCell>
                <Badge variant="outline">{schedule.frequency}</Badge>
              </TableCell>
              <TableCell>{schedule.recipients.join(", ")}</TableCell>
              <TableCell>
                {schedule.nextRun
                  ? new Date(schedule.nextRun).toLocaleString()
                  : "Not scheduled"}
              </TableCell>
              <TableCell>
                {schedule.lastStatus === "success" && (
                  <Badge variant="default">Success</Badge>
                )}
                {schedule.lastStatus === "failed" && (
                  <Badge variant="destructive">Failed</Badge>
                )}
                {!schedule.lastStatus && (
                  <Badge variant="secondary">Not run</Badge>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleEnabled(schedule._id, checked)
                  }
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(schedule._id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
