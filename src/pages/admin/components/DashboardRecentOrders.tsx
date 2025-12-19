import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardRecentOrdersProps {
  orders: any[];
}

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders?.slice(0, 5).map((order) => (
            <div key={order._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Order #{order._id.slice(-6)}</p>
                <p className="text-sm text-muted-foreground">{new Date(order._creationTime).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {order.status}
                </div>
                <div className="font-medium">₹{order.total.toFixed(2)}</div>
              </div>
            </div>
          ))}
          {(!orders || orders.length === 0) && (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
