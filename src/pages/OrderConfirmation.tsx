import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Package, Home, Loader2, AlertCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const order = useQuery(api.orders.getOrder, { 
    orderId: orderId as Id<"orders"> 
  });

  if (order === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find the order you're looking for.</p>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="border-b border-border/50">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-lg">Order #{order._id.slice(-8).toUpperCase()}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order._creationTime).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === "paid" 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}>
                  Payment: {order.paymentStatus?.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Status: {order.status.toUpperCase()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Items */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" /> Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <div className="text-muted-foreground text-xs">
                        {item.quantity} x {item.potency} • {item.form}
                      </div>
                    </div>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 flex justify-between font-bold">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Home className="h-4 w-4" /> Shipping Details
              </h3>
              <div className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-lg">
                <p className="font-medium text-foreground">{order.shippingDetails?.fullName}</p>
                <p>{order.shippingDetails?.addressLine1}</p>
                {order.shippingDetails?.addressLine2 && <p>{order.shippingDetails?.addressLine2}</p>}
                <p>{order.shippingDetails?.city}, {order.shippingDetails?.state} - {order.shippingDetails?.zipCode}</p>
                <p className="mt-1">Phone: {order.shippingDetails?.phone}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6">
            <Button onClick={() => navigate("/")} variant="outline" className="mr-4">
              Continue Shopping
            </Button>
            <Button onClick={() => navigate("/admin/orders")}>
              View My Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
