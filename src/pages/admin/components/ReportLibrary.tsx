import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Play, Download, Trash2, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";

interface ReportLibraryProps {
  reports: any[];
  onEdit: (report: any) => void;
  onRun: (reportId: Id<"reports">) => void;
  onExport: (reportId: Id<"reports">, format: "csv" | "excel" | "json") => void;
  onDelete: (reportId: Id<"reports">) => void;
  onSchedule: (reportId: Id<"reports">) => void;
}

export function ReportLibrary({ reports, onEdit, onRun, onExport, onDelete, onSchedule }: ReportLibraryProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reports created yet. Click "Create Report" to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Data Source</TableHead>
            <TableHead>Public</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report._id}>
              <TableCell className="font-medium">{report.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{report.type}</Badge>
              </TableCell>
              <TableCell>{report.dataSource}</TableCell>
              <TableCell>
                {report.isPublic ? (
                  <Badge variant="secondary">Public</Badge>
                ) : (
                  <Badge variant="outline">Private</Badge>
                )}
              </TableCell>
              <TableCell>
                {report.lastRun
                  ? new Date(report.lastRun).toLocaleString()
                  : "Never"}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRun(report._id)}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(report)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onExport(report._id, "csv")}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(report._id, "excel")}>
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(report._id, "json")}>
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSchedule(report._id)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(report._id)}
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
