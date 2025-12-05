import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Package, ShoppingCart, DollarSign, TrendingUp, Activity } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useMemo } from "react";

export default function AdminDashboard() {
  const products = useQuery(api.products.getProducts);
  const orders = useQuery(api.orders.getAllOrders);

  const totalRevenue = orders?.reduce((acc, order) => acc + order.total, 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalProducts = products?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;

  // Analytics Data Preparation
  const revenueData = useMemo(() => {
    if (!orders) return [];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // Last 7 days including today
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => new Date(o._creationTime).toISOString().split('T')[0] === date);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
        orders: dayOrders.length
      };
    });
  }, [orders]);

  const statusData = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    
    const statusColors: Record<string, string> = {
      pending: "hsl(var(--chart-1))",
      processing: "hsl(var(--chart-2))",
      shipped: "hsl(var(--chart-3))",
      delivered: "hsl(var(--chart-4))",
      cancelled: "hsl(var(--destructive))"
    };

    return Object.entries(counts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      fill: statusColors[status] || "hsl(var(--muted))"
    }));
  }, [orders]);

  const topProducts = useMemo(() => {
    if (!orders) return [];
    const productSales: Record<string, {name: string, sales: number, revenue: number, id: string}> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, sales: 0, revenue: 0, id: item.productId };
        }
        productSales[item.productId].sales += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--secondary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store's performance.</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders} pending processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active in store</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area 
                  dataKey="revenue" 
                  type="natural" 
                  fill="url(#fillRevenue)" 
                  fillOpacity={0.4} 
                  stroke="var(--color-revenue)" 
                  stackId="a" 
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution of current orders</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent nameKey="status" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                    <div className="font-medium">${order.total.toFixed(2)}</div>
                  </div>
                </div>
              ))}
              {(!orders || orders.length === 0) && (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>By quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} sold • ${product.revenue.toFixed(2)} rev</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sales data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
