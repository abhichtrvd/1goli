import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Printer, FileText, DollarSign, Truck, Package, Trash2 } from "lucide-react";
import { OrderItems } from "./order-details/OrderItems";
import { OrderShipping } from "./order-details/OrderShipping";
import { OrderPayment } from "./order-details/OrderPayment";
import { OrderCustomer } from "./order-details/OrderCustomer";
import { OrderStatus } from "./order-details/OrderStatus";
import { OrderTimeline } from "./order-details/OrderTimeline";
import { InvoiceDialog } from "./InvoiceDialog";
import { RefundDialog } from "./RefundDialog";
import { ShipmentDialog } from "./ShipmentDialog";
import { ReturnDialog } from "./ReturnDialog";
import { generateInvoiceHtml } from "../utils/orderUtils";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface OrderDetailsDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteOrder = useMutation(api.orders.deleteOrder);
  const requestRefund = useMutation(api.orders.requestRefund);
  const processRefund = useMutation(api.orders.processRefund);
  const updateShipment = useMutation(api.orders.updateShipment);
  const processReturn = useMutation(api.orders.processReturn);

  if (!order) return null;

  const handlePrintInvoice = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups for this site.");
        return;
      }

      const html = generateInvoiceHtml(order);

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load before printing (especially images/fonts if any)
      // For now, simple focus and print
      setTimeout(() => {
        printWindow.focus();
        // printWindow.print(); // Auto-print is handled in the HTML script
      }, 250);

    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleOpenInvoiceDialog = () => {
    setIsInvoiceDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrder({ orderId: order._id });
      toast.success("Order deleted successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefundSubmit = async (data: any) => {
    try {
      if (data.status) {
        // Processing existing refund
        await processRefund({
          orderId: order._id,
          status: data.status,
          refundId: data.refundId || `REF-${Date.now()}`,
        });
        toast.success(`Refund ${data.status}`);
      } else {
        // Requesting new refund
        await requestRefund({
          orderId: order._id,
          refundAmount: data.refundAmount,
          refundReason: data.refundReason,
        });
        toast.success("Refund requested");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
      throw error;
    }
  };

  const handleShipmentSubmit = async (data: any) => {
    try {
      await updateShipment({
        orderId: order._id,
        ...data,
      });
      toast.success("Shipment updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update shipment");
      throw error;
    }
  };

  const handleReturnSubmit = async (data: any) => {
    try {
      await processReturn({
        orderId: order._id,
        returnReason: data.returnReason,
        status: data.status,
        exchangeRequested: data.exchangeRequested,
      });
      toast.success(`Return ${data.status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to process return");
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
      case 'processing': return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
      case 'shipped': return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100";
      case 'delivered': return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
      case 'cancelled': return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
      default: return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
    }
  };

  // Safe accessors
  const orderId = order._id ? order._id.slice(-6) : "???";
  const status = order.status || "unknown";
  const dateStr = order._creationTime ? new Date(order._creationTime).toLocaleString() : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 bg-background sm:max-w-[95vw] overflow-hidden">
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl font-bold">Order #{orderId}</DialogTitle>
                <Badge variant="outline" className={getStatusColor(status)}>
                  {status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Placed on {dateStr}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleOpenInvoiceDialog}>
                <FileText className="w-4 h-4 mr-2" /> Invoice
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsShipmentDialogOpen(true)}>
                <Truck className="w-4 h-4 mr-2" /> Shipment
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsRefundDialogOpen(true)}>
                <DollarSign className="w-4 h-4 mr-2" /> Refund
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsReturnDialogOpen(true)}>
                <Package className="w-4 h-4 mr-2" /> Return
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN - MAIN CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              <OrderItems items={order.items} total={order.total} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OrderShipping 
                  shippingDetails={order.shippingDetails} 
                  shippingAddress={order.shippingAddress} 
                />
                <OrderPayment order={order} />
              </div>
            </div>

            {/* RIGHT COLUMN - SIDEBAR */}
            <div className="space-y-6">
              <OrderCustomer 
                userName={order.userName} 
                userId={order.userId} 
                userContact={order.userContact} 
              />
              <OrderStatus order={order} />
              <OrderTimeline statusHistory={order.statusHistory} orderId={order._id} />
            </div>
          </div>
        </div>
      </DialogContent>

      <InvoiceDialog
        order={order}
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
      />

      <RefundDialog
        order={order}
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        onSubmit={handleRefundSubmit}
      />

      <ShipmentDialog
        order={order}
        open={isShipmentDialogOpen}
        onOpenChange={setIsShipmentDialogOpen}
        onSubmit={handleShipmentSubmit}
      />

      <ReturnDialog
        order={order}
        open={isReturnDialogOpen}
        onOpenChange={setIsReturnDialogOpen}
        onSubmit={handleReturnSubmit}
      />
    </Dialog>
  );
}