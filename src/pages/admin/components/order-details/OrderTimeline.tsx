import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Filter } from "lucide-react";
import { useState } from "react";

interface OrderTimelineProps {
  statusHistory: any[];
}

export function OrderTimeline({ statusHistory }: OrderTimelineProps) {
  const [timelineFilter, setTimelineFilter] = useState("all");

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
                if (timelineFilter === 'payment') return h.note?.toLowerCase().includes('payment');
                return true;
              })
              .map((history: any, idx: number) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${idx === 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'}`} />
                <div className="flex flex-col">
                  <span className="font-medium capitalize text-sm">{history.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(history.timestamp).toLocaleString()}
                  </span>
                  {history.note && (
                    <p className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded-md">
                      {history.note}
                    </p>
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
