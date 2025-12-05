import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Package, ShoppingCart, DollarSign, TrendingUp, Activity, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useMemo } from "react";

export default function AdminDashboard() {
  const products = useQuery(api.products.getProducts);
  const orders = useQuery(api.orders.getAllOrders);
  const users = useQuery(api.users.getUsers);

  // --- Key Metrics Calculations with Comparison ---
  const metrics = useMemo(() => {
    if (!orders || !products || !users) return null;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Helper to filter by date range
    const filterByRange = (data: any[], start: Date, end: Date) => 
      data.filter(item => {
        const date = new Date(item._creationTime);
        return date >= start && date < end;
      });

    // Current Period (Last 7 Days)
    const currentOrders = filterByRange(orders, sevenDaysAgo, now);
    const currentRevenue = currentOrders.reduce((acc, o) => acc + o.total, 0);
    const currentNewUsers = filterByRange(users, sevenDaysAgo, now).length;

    // Previous Period (7-14 Days ago)
    const prevOrders = filterByRange(orders, fourteenDaysAgo, sevenDaysAgo);
    const prevRevenue = prevOrders.reduce((acc, o) => acc + o.total, 0);
    const prevNewUsers = filterByRange(users, fourteenDaysAgo, sevenDaysAgo).length;

    // Calculate Changes
    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    return {
      totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
      revenueChange: calculateChange(currentRevenue, prevRevenue),
      totalOrders: orders.length,
      ordersChange: calculateChange(currentOrders.length, prevOrders.length),
      totalProducts: products.length,
      totalUsers: users.length,
      usersChange: calculateChange(currentNewUsers, prevNewUsers),
      avgOrderValue: orders.length > 0 ? orders.reduce((acc, o) => acc + o.total, 0) / orders.length : 0,
      pendingOrders: orders.filter(o => o.status === "pending").length,
    };
  }, [orders, products, users]);

  // --- Analytics Data Preparation ---
  
  // 1. Revenue Over Time (Existing)
  const revenueData = useMemo(() => {
    if (!orders) return [];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => new Date(o._creationTime).toISOString().split('T')[0] === date);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
      };
    });
  }, [orders]);

  // 2. User Growth (New Users per Day)
  const userGrowthData = useMemo(() => {
    if (!users) return [];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const count = users.filter(u => new Date(u._creationTime).toISOString().split('T')[0] === date).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        users: count,
      };
    });
  }, [users]);

  // 3. Sales by Category
  const categoryData = useMemo(() => {
    if (!orders || !products) return [];
    const categorySales: Record<string, number> = {};
    
    // Create a map for quick product lookup
    const productMap = new Map(products.map(p => [p._id, p]));

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = productMap.get(item.productId);
        const category = product?.category || "Uncategorized";
        categorySales[category] = (categorySales[category] || 0) + item.quantity;
      });
    });

    // Colors for categories
    const COLORS = [
      "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", 
      "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#84cc16"
    ];

    return Object.entries(categorySales)
      .map(([name, value], index) => ({
        name,
        value,
        fill: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by highest sales
  }, [orders, products]);

  // 4. Order Status (Existing)
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

  // 5. Top Products (Existing)
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
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    users: { label: "New Users", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  // Helper for percentage badge
  const PercentBadge = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`text-xs flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {Math.abs(value).toFixed(1)}% from last week
      </div>
    );
  };

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
            <div className="text-2xl font-bold">${metrics?.totalRevenue.toFixed(2) || "0.00"}</div>
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
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
              ${metrics?.avgOrderValue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section Row 1: Revenue & User Growth */}
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
                  tickFormatter={(value) => `$${value}`} 
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
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations (Last 7 Days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={userGrowthData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="users" fill="var(--color-users)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section Row 2: Sales by Category & Order Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Distribution of items sold by product category</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
             <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order pipeline</CardDescription>
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