import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, PlayCircle, FileSpreadsheet, Calendar, History } from "lucide-react";
import { ReportBuilder } from "./components/ReportBuilder";
import { ReportPreview } from "./components/ReportPreview";
import { ScheduleReportDialog } from "./components/ScheduleReportDialog";
import { ReportLibrary } from "./components/ReportLibrary";
import { ScheduledReportsList } from "./components/ScheduledReportsList";
import { ReportExecutionHistory } from "./components/ReportExecutionHistory";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState("builder");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [reportToSchedule, setReportToSchedule] = useState<Id<"reports"> | null>(null);

  const reports = useQuery(api.reports.listReports);
  const schedules = useQuery(api.reports.getScheduledReports);
  const executions = useQuery(api.reports.getReportExecutions, { limit: 50 });

  const runReport = useAction(api.reports.runReport);
  const exportReport = useAction(api.reports.exportReport);
  const deleteReport = useMutation(api.reports.deleteReport);

  const handleCreateReport = () => {
    setSelectedReport(null);
    setIsBuilderOpen(true);
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    setIsBuilderOpen(true);
  };

  const handleRunReport = async (reportId: Id<"reports">) => {
    try {
      toast.info("Running report...");
      const result = await runReport({ reportId });
      setReportData(result);
      toast.success(`Report executed successfully! (${result.recordCount} records in ${result.executionTime}ms)`);
      setActiveTab("preview");
    } catch (error: any) {
      toast.error(`Failed to run report: ${error.message}`);
    }
  };

  const handleExportReport = async (reportId: Id<"reports">, format: "csv" | "excel" | "json") => {
    try {
      toast.info("Exporting report...");
      const result = await exportReport({ reportId, format });

      // Create a download link
      const blob = new Blob([result.data], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${Date.now()}.${result.fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report exported successfully!");
    } catch (error: any) {
      toast.error(`Failed to export report: ${error.message}`);
    }
  };

  const handleDeleteReport = async (reportId: Id<"reports">) => {
    if (!confirm("Are you sure you want to delete this report? This will also delete all associated schedules.")) {
      return;
    }

    try {
      await deleteReport({ reportId });
      toast.success("Report deleted successfully");
    } catch (error: any) {
      toast.error(`Failed to delete report: ${error.message}`);
    }
  };

  const handleScheduleReport = (reportId: Id<"reports">) => {
    setReportToSchedule(reportId);
    setIsScheduleDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Reports</h1>
          <p className="text-muted-foreground">
            Build, run, and schedule custom reports
          </p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="preview">
            <PlayCircle className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Calendar className="mr-2 h-4 w-4" />
            Schedules ({schedules?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Execution History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Library</CardTitle>
              <CardDescription>
                View and manage your custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportLibrary
                reports={reports || []}
                onEdit={handleEditReport}
                onRun={handleRunReport}
                onExport={handleExportReport}
                onDelete={handleDeleteReport}
                onSchedule={handleScheduleReport}
              />
            </CardContent>
          </Card>

          {isBuilderOpen && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedReport ? "Edit Report" : "Create New Report"}
                </CardTitle>
                <CardDescription>
                  Configure your report data source, filters, and visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportBuilder
                  report={selectedReport}
                  onSave={() => {
                    setIsBuilderOpen(false);
                    setSelectedReport(null);
                  }}
                  onCancel={() => {
                    setIsBuilderOpen(false);
                    setSelectedReport(null);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                View the results of your report execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData ? (
                <ReportPreview data={reportData} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Report Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Run a report to see the preview here
                  </p>
                  <Button onClick={() => setActiveTab("builder")}>
                    Go to Report Builder
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Manage automated report generation and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduledReportsList schedules={schedules || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Report Execution History</CardTitle>
              <CardDescription>
                View past report executions and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportExecutionHistory executions={executions || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {reportToSchedule && (
        <ScheduleReportDialog
          reportId={reportToSchedule}
          open={isScheduleDialogOpen}
          onOpenChange={(open) => {
            setIsScheduleDialogOpen(open);
            if (!open) setReportToSchedule(null);
          }}
        />
      )}
    </div>
  );
}
