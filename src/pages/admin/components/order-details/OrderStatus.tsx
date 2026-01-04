import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface OrderStatusProps {
  order: any;
}

export function OrderStatus({ order }: OrderStatusProps) {
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);
    }
  }, [order]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setIsUpdating(true);
    try {
      await updateStatus({ 
        orderId: order._id, 
        status: newStatus,
        note: statusNote 
      });
      toast.success(newStatus === order.status ? "Note added" : "Order status updated");
      setStatusNote("");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm bg-primary/5">
      <CardHeader className="pb-3 border-b border-primary/10">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> 
          {newStatus === order.status ? "Add Note" : "Update Status"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled" className="text-red-600 focus:text-red-600">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Note {newStatus === order.status ? "(Required)" : "(Optional)"}</Label>
          <Textarea 
            placeholder={newStatus === order.status ? "Add a note to the order history..." : "Reason for status change..."}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            className="h-20 resize-none bg-background"
          />
        </div>
        <Button 
          onClick={handleStatusUpdate} 
          disabled={!newStatus || isUpdating || (newStatus === order.status && !statusNote)}
          className="w-full"
          variant={newStatus === order.status ? "secondary" : "default"}
        >
          {isUpdating ? "Updating..." : (newStatus === order.status ? "Add Note" : "Update Status")}
        </Button>
      </CardContent>
    </Card>
  );
}
