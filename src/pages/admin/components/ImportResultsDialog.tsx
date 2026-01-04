import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ImportResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: { imported: number; failed: number; errors: { row: number; error: string }[] } | null;
  isDryRun: boolean;
}

export function ImportResultsDialog({ open, onOpenChange, results, isDryRun }: ImportResultsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isDryRun ? 'Dry Run Results' : 'Import Results'}</DialogTitle>
          <DialogDescription>
            Summary of the {isDryRun ? 'simulated ' : ''}import operation.
          </DialogDescription>
        </DialogHeader>
        
        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/50">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{results.imported}</span>
                <span className="text-sm text-green-600 dark:text-green-400">{isDryRun ? 'Valid Rows' : 'Imported'}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">{results.failed}</span>
                <span className="text-sm text-red-600 dark:text-red-400">Failed</span>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Error Log</Label>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Row #</TableHead>
                        <TableHead>Error Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{error.row}</TableCell>
                          <TableCell className="text-destructive">{error.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
