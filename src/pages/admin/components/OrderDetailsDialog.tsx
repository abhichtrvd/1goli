import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Truck, CheckCircle, Clock, CreditCard, MapPin, User, Phone, Calendar } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface OrderDetailsDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    setIsUpdating(true);
    try {
      await updateStatus({ 
        orderId: order._id, 
        status: newStatus,
        note: statusNote 
      });
      toast.success("Order status updated");
      setNewStatus("");
      setStatusNote("");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Package className="w-3 h-3 mr-1" /> Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Truck className="w-3 h-3 mr-1" /> Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Delivered</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">Order #{order._id.slice(-6)}</DialogTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Placed on {new Date(order._creationTime).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(order.status)}
              <Badge variant="outline" className="capitalize">
                {order.paymentStatus || 'Payment Pending'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Top Grid: Customer, Shipping, Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <User className="w-4 h-4" /> Customer Details
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm border">
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{order.userName}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">{order.userContact}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs">{order.userId}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <MapPin className="w-4 h-4" /> Shipping Address
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm border h-full">
                  {order.shippingDetails ? (
                    <>
                      <p className="font-medium">{order.shippingDetails.fullName}</p>
                      <p>{order.shippingDetails.addressLine1}</p>
                      {order.shippingDetails.addressLine2 && <p>{order.shippingDetails.addressLine2}</p>}
                      <p>{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</p>
                      <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                        <Phone className="w-3 h-3" /> {order.shippingDetails.phone}
                      </p>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{order.shippingAddress}</p>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <CreditCard className="w-4 h-4" /> Payment Details
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm border h-full">
                  <div className="grid grid-cols-[100px_1fr] gap-1">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="font-medium capitalize">{order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-1">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  {order.paymentId && (
                    <div className="grid grid-cols-[100px_1fr] gap-1">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-xs">{order.paymentId}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-[100px_1fr] gap-1 pt-2 mt-2 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <Package className="w-4 h-4" /> Order Items ({order.items.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.potency} • {item.form}
                          {item.packingSize && ` • ${item.packingSize}`}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Management */}
              <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                <h3 className="font-semibold">Update Order Status</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={handleStatusUpdate} 
                        disabled={!newStatus || isUpdating}
                        className="w-full"
                      >
                        {isUpdating ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Note (Optional)</Label>
                    <Textarea 
                      placeholder="Add a note about this status change..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="h-20"
                    />
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div className="space-y-4">
                <h3 className="font-semibold">Order Timeline</h3>
                <div className="relative pl-2 border-l-2 border-muted ml-2 space-y-6">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    [...order.statusHistory].reverse().map((history: any, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${idx === 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'}`} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{history.status}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(history.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {history.note && (
                            <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                              {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground pl-4">No history available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
