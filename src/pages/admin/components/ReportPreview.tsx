import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ReportPreviewProps {
  data: {
    data: any[];
    recordCount: number;
    executionTime: number;
  };
}

export function ReportPreview({ data }: ReportPreviewProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to display
      </div>
    );
  }

  const headers = Object.keys(data.data[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="secondary">
          {data.recordCount} records
        </Badge>
        <Badge variant="outline">
          Executed in {data.executionTime}ms
        </Badge>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header}>
                    {typeof row[header] === "object"
                      ? JSON.stringify(row[header])
                      : String(row[header] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
