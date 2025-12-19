import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardMetricsProps {
  metrics: any;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const PercentBadge = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`text-xs flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {Math.abs(value).toFixed(1)}% from previous period
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{metrics?.totalRevenue.toFixed(2) || "0.00"}</div>
          {metrics && <PercentBadge value={metrics.revenueChange} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{metrics?.totalOrders || 0}</div>
          {metrics && <PercentBadge value={metrics.ordersChange} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{metrics?.newUsers || 0}</div>
          {metrics && <PercentBadge value={metrics.usersChange} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{metrics?.avgOrderValue.toFixed(2) || "0.00"}
          </div>
          <p className="text-xs text-muted-foreground">Per order average</p>
        </CardContent>
      </Card>
    </div>
  );
}
