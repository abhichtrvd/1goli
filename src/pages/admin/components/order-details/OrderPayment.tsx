import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock } from "lucide-react";

interface OrderPaymentProps {
  order: any;
}

export function OrderPayment({ order }: OrderPaymentProps) {
  return (
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
  );
}
