import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: Id<"products"> | null;
  productName: string;
}

export function StockHistoryDialog({ open, onOpenChange, productId, productName }: StockHistoryDialogProps) {
  const history = useQuery(
    api.productStockHistory.getStockHistory,
    productId ? { productId } : "skip"
  );

  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      toast.error("No history to export");
      return;
    }

    const headers = ["Date/Time", "Change Type", "Previous Stock", "New Stock", "Quantity", "Reason", "Performed By"];

    const csvContent = [
      headers.join(","),
      ...history.map((entry: any) => [
        `"${new Date(entry.timestamp).toLocaleString()}"`,
        `"${entry.changeType}"`,
        entry.previousStock,
        entry.newStock,
        entry.quantity,
        `"${entry.reason || ""}"`,
        `"${entry.performedBy}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_history_${productName.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stock history exported");
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "destructive";
      case "restock":
        return "default";
      case "return":
        return "secondary";
      case "damage":
        return "destructive";
      case "manual_adjustment":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Stock History: {productName}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!history || history.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {!history ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No stock history found</div>
          ) : (
            <div className="space-y-2">
              {history.map((entry: any, index: any) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getChangeTypeColor(entry.changeType)}>
                          {entry.changeType.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Previous:</span>{" "}
                          <span className="font-semibold">{entry.previousStock}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">New:</span>{" "}
                          <span className="font-semibold">{entry.newStock}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Change:</span>{" "}
                          <span
                            className={`font-semibold ${
                              entry.quantity > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {entry.quantity > 0 ? "+" : ""}
                            {entry.quantity}
                          </span>
                        </div>
                      </div>

                      {entry.reason && (
                        <div className="text-sm text-muted-foreground">
                          Reason: {entry.reason}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        By: {entry.performedBy}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
