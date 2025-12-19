import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardMetrics } from "./components/DashboardMetrics";
import { DashboardCharts } from "./components/DashboardCharts";
import { DashboardRecentOrders } from "./components/DashboardRecentOrders";
import { DashboardTopProducts } from "./components/DashboardTopProducts";

export default function AdminDashboard() {
  const products = useQuery(api.products.getProducts);
  const orders = useQuery(api.orders.getAllOrders);
  const users = useQuery(api.users.getUsers);

  const [dateRange, setDateRange] = useState("7d");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");

  const dateRangeDays = useMemo(() => {
    switch (dateRange) {
      case "30d": return 30;
      case "90d": return 90;
      case "7d": default: return 7;
    }
  }, [dateRange]);

  // --- Key Metrics Calculations with Comparison ---
  const metrics = useMemo(() => {
    if (!orders || !products || !users) return null;

    const now = new Date();
    const pastDate = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
    const prevDate = new Date(now.getTime() - dateRangeDays * 2 * 24 * 60 * 60 * 1000);

    // Helper to filter by date range
    const filterByRange = (data: any[], start: Date, end: Date) => 
      data.filter(item => {
        const date = new Date(item._creationTime);
        return date >= start && date < end;
      });

    // Current Period
    const currentOrders = filterByRange(orders, pastDate, now);
    const currentRevenue = currentOrders.reduce((acc, o) => acc + o.total, 0);
    const currentNewUsers = filterByRange(users, pastDate, now).length;

    // Previous Period
    const prevOrders = filterByRange(orders, prevDate, pastDate);
    const prevRevenue = prevOrders.reduce((acc, o) => acc + o.total, 0);
    const prevNewUsers = filterByRange(users, prevDate, pastDate).length;

    // Calculate Changes
    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    return {
      totalRevenue: currentRevenue,
      revenueChange: calculateChange(currentRevenue, prevRevenue),
      totalOrders: currentOrders.length,
      ordersChange: calculateChange(currentOrders.length, prevOrders.length),
      totalProducts: products.length,
      totalUsers: users.length,
      newUsers: currentNewUsers,
      usersChange: calculateChange(currentNewUsers, prevNewUsers),
      avgOrderValue: currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0,
      pendingOrders: orders.filter(o => o.status === "pending").length,
    };
  }, [orders, products, users, dateRangeDays]);

  // --- Analytics Data Preparation ---
  
  // 1. Revenue/Orders Over Time
  const revenueData = useMemo(() => {
    if (!orders) return [];
    const days = dateRangeDays;
    const data = [...Array(days)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().split('T')[0];
    });

    return data.map(date => {
      const dayOrders = orders.filter(o => new Date(o._creationTime).toISOString().split('T')[0] === date);
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
        orders: dayOrders.length,
      };
    });
  }, [orders, dateRangeDays]);

  // 2. User Growth (New Users per Day)
  const userGrowthData = useMemo(() => {
    if (!users) return [];
    const days = dateRangeDays;
    const data = [...Array(days)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().split('T')[0];
    });

    return data.map(date => {
      const count = users.filter(u => new Date(u._creationTime).toISOString().split('T')[0] === date).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: count,
      };
    });
  }, [users, dateRangeDays]);

  // 3. Sales by Category (Filtered by Date Range)
  const categoryData = useMemo(() => {
    if (!orders || !products) return [];
    const categorySales: Record<string, number> = {};
    
    const productMap = new Map(products.map(p => [p._id, p]));
    
    const now = new Date();
    const pastDate = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);

    orders
      .filter(o => {
        const d = new Date(o._creationTime);
        return d >= pastDate && d <= now;
      })
      .forEach(order => {
        order.items.forEach(item => {
          const product = productMap.get(item.productId);
          const category = product?.category || "Uncategorized";
          categorySales[category] = (categorySales[category] || 0) + item.quantity;
        });
      });

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
      .sort((a, b) => b.value - a.value);
  }, [orders, products, dateRangeDays]);

  // 5. Inventory Data
  const inventoryData = useMemo(() => {
    if (!products) return [];
    const inStock = products.filter(p => p.availability === "in_stock").length;
    const outOfStock = products.filter(p => p.availability === "out_of_stock").length;
    const discontinued = products.filter(p => p.availability === "discontinued").length;
    
    return [
      { name: "In Stock", value: inStock, fill: "hsl(var(--chart-2))" },
      { name: "Out of Stock", value: outOfStock, fill: "hsl(var(--destructive))" },
      { name: "Discontinued", value: discontinued, fill: "hsl(var(--muted))" },
    ];
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.availability === "out_of_stock");
  }, [products]);

  // 5. Top Products (Existing)
  const topProducts = useMemo(() => {
    if (!orders) return [];
    const productSales: Record<string, {name: string, sales: number, revenue: number, id: string}> = {};
    
    const now = new Date();
    const pastDate = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);

    orders
      .filter(o => {
        const d = new Date(o._creationTime);
        return d >= pastDate && d <= now;
      })
      .forEach(order => {
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
  }, [orders, dateRangeDays]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store's performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DashboardMetrics metrics={metrics} />

      <DashboardCharts 
        revenueData={revenueData}
        userGrowthData={userGrowthData}
        categoryData={categoryData}
        inventoryData={inventoryData}
        outOfStockProducts={outOfStockProducts}
        chartMetric={chartMetric}
        setChartMetric={setChartMetric}
        dateRangeDays={dateRangeDays}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <DashboardRecentOrders orders={orders || []} />
        <DashboardTopProducts topProducts={topProducts} />
      </div>
    </div>
  );
}