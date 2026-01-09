import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ReportExecutionHistoryProps {
  executions: any[];
}

export function ReportExecutionHistory({ executions }: ReportExecutionHistoryProps) {
  if (executions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No execution history yet. Run a report to see its history here.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report Name</TableHead>
            <TableHead>Executed At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Records</TableHead>
            <TableHead>Execution Time</TableHead>
            <TableHead>Format</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => (
            <TableRow key={execution._id}>
              <TableCell className="font-medium">{execution.reportName}</TableCell>
              <TableCell>
                {new Date(execution.executedAt).toLocaleString()}
              </TableCell>
              <TableCell>
                {execution.status === "success" && (
                  <Badge variant="default">Success</Badge>
                )}
                {execution.status === "failed" && (
                  <Badge variant="destructive">Failed</Badge>
                )}
                {execution.status === "running" && (
                  <Badge variant="secondary">Running</Badge>
                )}
              </TableCell>
              <TableCell>{execution.recordCount || "-"}</TableCell>
              <TableCell>
                {execution.executionTime ? `${execution.executionTime}ms` : "-"}
              </TableCell>
              <TableCell>
                {execution.exportFormat ? (
                  <Badge variant="outline">{execution.exportFormat}</Badge>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
