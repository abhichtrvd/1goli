import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Printer } from "lucide-react";
import { OrderItems } from "./order-details/OrderItems";
import { OrderShipping } from "./order-details/OrderShipping";
import { OrderPayment } from "./order-details/OrderPayment";
import { OrderCustomer } from "./order-details/OrderCustomer";
import { OrderStatus } from "./order-details/OrderStatus";
import { OrderTimeline } from "./order-details/OrderTimeline";
import { generateInvoiceHtml } from "../utils/orderUtils";

interface OrderDetailsDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  if (!order) return null;

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = generateInvoiceHtml(order);
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 bg-background sm:max-w-[95vw] overflow-hidden">
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl font-bold">Order #{order._id.slice(-6)}</DialogTitle>
                <Badge variant="outline" className={getStatusColor(order.status)}>
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Placed on {new Date(order._creationTime).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" onClick={handlePrintInvoice}>
                 <Printer className="w-4 h-4 mr-2" /> Print Invoice
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
              <OrderTimeline statusHistory={order.statusHistory} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}