import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ShoppingBag, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function OrderHistory() {
  const orders = useQuery(api.orders.getOrders);
  const navigate = useNavigate();

  if (orders === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-lime-600" />
          My Orders
        </h1>

        {orders.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="bg-secondary/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
              <Button onClick={() => navigate("/")}>Start Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-secondary/20 border-b border-border/50 py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Placed</p>
                      <p className="font-medium">{new Date(order._creationTime).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">₹{order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order #</p>
                      <p className="font-medium">{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className={order.paymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}>
                         {order.paymentStatus?.toUpperCase() || 'PENDING'}
                       </Badge>
                       <Button variant="outline" size="sm" onClick={() => navigate(`/order-confirmation/${order._id}`)}>
                         View Details <ChevronRight className="h-4 w-4 ml-1" />
                       </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-secondary rounded-md flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} x {item.potency} • {item.form}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}