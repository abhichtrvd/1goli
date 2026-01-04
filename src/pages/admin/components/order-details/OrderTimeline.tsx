import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Filter, Pencil, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface OrderTimelineProps {
  statusHistory: any[];
  orderId: Id<"orders">;
}

export function OrderTimeline({ statusHistory, orderId }: OrderTimelineProps) {
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [editingTimestamp, setEditingTimestamp] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const updateNote = useMutation(api.orders.updateOrderNote);
  const deleteNote = useMutation(api.orders.deleteOrderNote);

  const handleEditClick = (history: any) => {
    setEditingTimestamp(history.timestamp);
    setEditValue(history.note || "");
  };

  const handleCancelEdit = () => {
    setEditingTimestamp(null);
    setEditValue("");
  };

  const handleSaveNote = async (timestamp: number) => {
    try {
      await updateNote({ orderId, timestamp, newNote: editValue });
      toast.success("Note updated");
      setEditingTimestamp(null);
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (timestamp: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote({ orderId, timestamp });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Timeline
        </CardTitle>
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <Select value={timelineFilter} onValueChange={setTimelineFilter}>
            <SelectTrigger className="h-7 text-xs w-[110px] bg-background">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="status">Status Only</SelectItem>
              <SelectItem value="notes">Notes Only</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative pl-2 border-l-2 border-muted ml-2 space-y-6">
          {statusHistory && statusHistory.length > 0 ? (
            [...statusHistory]
              .reverse()
              .filter((h: any) => {
                if (timelineFilter === 'all') return true;
                if (timelineFilter === 'status') return !h.note?.toLowerCase().includes('payment'); // Exclude payment logs for "Status Only"
                if (timelineFilter === 'notes') return !!h.note;
                if (timelineFilter === 'payment') {
                  return h.note?.toLowerCase().includes('payment') || h.status === 'paid';
                }
                return true;
              })
              .map((history: any, idx: number) => (
              <div key={idx} className="relative pl-6 group">
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${idx === 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'}`} />
                <div className="flex flex-col">
                  <span className="font-medium capitalize text-sm">{history.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(history.timestamp).toLocaleString()}
                  </span>
                  
                  {editingTimestamp === history.timestamp ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Input 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSaveNote(history.timestamp)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={handleCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    history.note && (
                      <div className="relative group/note">
                        <p className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded-md pr-8">
                          {history.note}
                        </p>
                        <div className="absolute top-1 right-1 hidden group-hover/note:flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 hover:bg-background/80" 
                            onClick={() => handleEditClick(history)}
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 hover:bg-background/80 hover:text-red-600" 
                            onClick={() => handleDeleteNote(history.timestamp)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground pl-4">No history available</p>
          )}
          {statusHistory && statusHistory.length > 0 && 
           [...statusHistory].filter((h: any) => {
              if (timelineFilter === 'notes') return !!h.note;
              if (timelineFilter === 'payment') return h.note?.toLowerCase().includes('payment');
              return true;
           }).length === 0 && (
            <p className="text-sm text-muted-foreground pl-4">No matching history found</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}