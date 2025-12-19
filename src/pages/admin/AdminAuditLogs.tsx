import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAuditLogs() {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.audit.getAuditLogs,
    {},
    { initialNumItems: 20 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Track administrative actions and system events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                results?.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      <span className="capitalize">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-xs text-muted-foreground block font-mono">
                          {log.entityId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{log.performedBy}</TableCell>
                    <TableCell className="max-w-md truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex justify-center py-4">
            {status === "CanLoadMore" && (
              <Button
                variant="outline"
                onClick={() => loadMore(20)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
