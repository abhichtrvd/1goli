import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, CreditCard, MapPin, User, Phone, Calendar, Mail, Printer, FileText, Filter } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

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
  const [timelineFilter, setTimelineFilter] = useState("all");

  if (!order) return null;

  // Initialize newStatus with current order status when dialog opens or order changes
  if (open && !newStatus && order) {
    setNewStatus(order.status);
  }

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
      // Don't reset newStatus, keep it as current
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Invoice #${order._id.slice(-6)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.5; padding: 0; margin: 0; background: #fff; }
            .invoice-container { max-width: 800px; margin: 40px auto; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
            .brand-name { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em; }
            .brand-subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
            .invoice-title { font-size: 30px; font-weight: 800; color: #111827; text-align: right; letter-spacing: -0.025em; }
            .meta-group { margin-top: 8px; text-align: right; font-size: 14px; color: #4b5563; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
            .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 12px; }
            .address-block { font-size: 14px; color: #374151; line-height: 1.6; }
            .address-name { font-weight: 600; color: #111827; margin-bottom: 4px; display: block; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            th { text-align: left; padding: 12px 16px; background: #f9fafb; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; }
            td { padding: 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; }
            tr:last-child td { border-bottom: none; }
            .item-name { font-weight: 500; color: #111827; display: block; margin-bottom: 2px; }
            .item-meta { font-size: 12px; color: #6b7280; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-wrapper { display: flex; justify-content: flex-end; }
            .totals-table { width: 320px; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #4b5563; }
            .grand-total { font-weight: 700; font-size: 18px; color: #111827; border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 16px; }
            .footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280; }
            @media print { 
              body { background: #fff; }
              .invoice-container { margin: 0; border: none; box-shadow: none; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <div class="brand-name">1goli Pharmacy</div>
                <div class="brand-subtitle">Homeopathic Medicine & Consultations</div>
              </div>
              <div>
                <div class="invoice-title">INVOICE</div>
                <div class="meta-group">
                  <div>Order #${order._id.slice(-6)}</div>
                  <div>Date: ${new Date(order._creationTime).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div class="grid">
              <div>
                <div class="section-label">Bill To</div>
                <div class="address-block">
                  ${order.shippingDetails ? `
                    <span class="address-name">${order.shippingDetails.fullName}</span>
                    ${order.shippingDetails.addressLine1}<br/>
                    ${order.shippingDetails.addressLine2 ? order.shippingDetails.addressLine2 + '<br/>' : ''}
                    ${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}<br/>
                    <div style="margin-top: 8px;">Phone: ${order.shippingDetails.phone}</div>
                  ` : order.shippingAddress}
                </div>
              </div>
              <div>
                <div class="section-label">Payment Details</div>
                <div class="address-block">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">Method:</span>
                    <span style="font-weight: 500; text-transform: capitalize;">${order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">Status:</span>
                    <span style="font-weight: 500; text-transform: capitalize;">${order.paymentStatus || 'Pending'}</span>
                  </div>
                  ${order.paymentId ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Transaction ID:</span>
                    <span style="font-family: monospace;">${order.paymentId}</span>
                  </div>` : ''}
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Item</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item: any) => `
                  <tr>
                    <td>
                      <span class="item-name">${item.name}</span>
                      <span class="item-meta">${item.potency} • ${item.form}${item.packingSize ? ` • ${item.packingSize}` : ''}</span>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₹${item.price.toFixed(2)}</td>
                    <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-wrapper">
              <div class="totals-table">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>₹${order.total.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Shipping</span>
                  <span>₹0.00</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total</span>
                  <span>₹${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>For any questions, please contact support@1goli.com</p>
            </div>
          </div>
          
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
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
              
              {/* Order Items */}
              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" /> Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Product</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right pr-6">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {item.potency} • {item.form}
                            {item.packingSize && ` • ${item.packingSize}`}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right pr-6 font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={4} className="text-right font-medium">Subtotal</TableCell>
                        <TableCell className="text-right pr-6 font-bold">₹{order.total.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Shipping & Payment Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    {order.shippingDetails ? (
                      <>
                        <div className="font-medium text-base">{order.shippingDetails.fullName}</div>
                        <div className="text-muted-foreground leading-relaxed">
                          {order.shippingDetails.addressLine1}<br />
                          {order.shippingDetails.addressLine2 && <>{order.shippingDetails.addressLine2}<br /></>}
                          {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}
                        </div>
                        <div className="flex items-center gap-2 pt-2 text-muted-foreground border-t mt-2">
                          <Phone className="w-3 h-3" /> {order.shippingDetails.phone}
                        </div>
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap text-muted-foreground">{order.shippingAddress}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3 border-border/50">
                      <span className="text-sm text-muted-foreground">Method</span>
                      <span className="font-medium capitalize">{order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-3 border-border/50">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className="capitalize">
                        {order.paymentStatus || 'Pending'}
                      </Badge>
                    </div>
                    {order.paymentId && (
                      <div className="flex justify-between items-center border-b pb-3 border-border/50">
                        <span className="text-sm text-muted-foreground">Transaction ID</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{order.paymentId}</span>
                      </div>
                    )}
                    {/* Full Payment Details */}
                    <div className="pt-1">
                      <span className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Payment History
                      </span>
                      <div className="space-y-2 bg-muted/30 p-3 rounded-md">
                        {order.statusHistory?.filter((h: any) => 
                          h.note?.toLowerCase().includes('payment') || 
                          h.status === 'processing' || 
                          h.status === 'paid'
                        ).length > 0 ? (
                          order.statusHistory
                            .filter((h: any) => 
                              h.note?.toLowerCase().includes('payment') || 
                              h.status === 'processing' || 
                              h.status === 'paid'
                            )
                            .map((h: any, i: number) => (
                              <div key={i} className="text-xs flex flex-col gap-1 pb-2 border-b border-border/50 last:border-0 last:pb-0">
                                <div className="flex justify-between font-medium">
                                  <span className="capitalize">{h.status}</span>
                                  <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleDateString()}</span>
                                </div>
                                {h.note && <span className="text-muted-foreground">{h.note}</span>}
                              </div>
                            ))
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">No payment history available</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* RIGHT COLUMN - SIDEBAR */}
            <div className="space-y-6">
              
              {/* Customer Card */}
              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {order.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium truncate" title={order.userName}>{order.userName}</div>
                      <div className="text-xs text-muted-foreground">ID: {order.userId.slice(-6)}</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground break-all">
                      <Mail className="w-4 h-4 shrink-0" /> {order.userContact}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Actions */}
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

              {/* Timeline */}
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
                    {order.statusHistory && order.statusHistory.length > 0 ? (
                      [...order.statusHistory]
                        .reverse()
                        .filter((h: any) => {
                          if (timelineFilter === 'all') return true;
                          if (timelineFilter === 'status') return true; 
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
                    {order.statusHistory && order.statusHistory.length > 0 && 
                     [...order.statusHistory].filter((h: any) => {
                        if (timelineFilter === 'notes') return !!h.note;
                        if (timelineFilter === 'payment') return h.note?.toLowerCase().includes('payment');
                        return true;
                     }).length === 0 && (
                      <p className="text-sm text-muted-foreground pl-4">No matching history found</p>
                     )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}