import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AlertCircle } from "lucide-react";

interface DashboardChartsProps {
  revenueData: any[];
  userGrowthData: any[];
  categoryData: any[];
  inventoryData: any[];
  outOfStockProducts: any[];
  chartMetric: "revenue" | "orders";
  setChartMetric: (metric: "revenue" | "orders") => void;
  dateRangeDays: number;
}

export function DashboardCharts({
  revenueData,
  userGrowthData,
  categoryData,
  inventoryData,
  outOfStockProducts,
  chartMetric,
  setChartMetric,
  dateRangeDays
}: DashboardChartsProps) {
  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    orders: { label: "Orders", color: "hsl(var(--chart-2))" },
    users: { label: "New Users", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  return (
    <>
      {/* Charts Section Row 1: Revenue & User Growth */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{chartMetric === "revenue" ? "Revenue Overview" : "Orders Overview"}</CardTitle>
                <CardDescription>
                  {chartMetric === "revenue" ? "Daily revenue" : "Daily order volume"} for the past {dateRangeDays} days
                </CardDescription>
              </div>
              <Select value={chartMetric} onValueChange={(v: any) => setChartMetric(v)}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartMetric === "revenue" ? "var(--color-revenue)" : "var(--color-orders)"} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartMetric === "revenue" ? "var(--color-revenue)" : "var(--color-orders)"} stopOpacity={0.1}/>
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
                  tickFormatter={(value) => chartMetric === "revenue" ? `₹${value}` : value.toString()} 
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area 
                  dataKey={chartMetric} 
                  type="natural" 
                  fill="url(#fillMetric)" 
                  fillOpacity={0.4} 
                  stroke={chartMetric === "revenue" ? "var(--color-revenue)" : "var(--color-orders)"} 
                  stackId="a" 
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations</CardDescription>
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

      {/* Charts Section Row 2: Sales by Category & Inventory */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Distribution of items sold</CardDescription>
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
            <CardTitle>Inventory Health</CardTitle>
            <CardDescription>Stock status overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChartContainer config={{}} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={inventoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ChartContainer>
            
            {outOfStockProducts.length > 0 && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-semibold flex items-center text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Out of Stock ({outOfStockProducts.length})
                </h4>
                <div className="max-h-[100px] overflow-y-auto space-y-1 pr-2">
                  {outOfStockProducts.map(p => (
                    <div key={p._id} className="text-xs flex justify-between items-center bg-destructive/10 p-2 rounded">
                      <span className="truncate max-w-[150px]">{p.name}</span>
                      <span className="font-mono text-destructive">₹{p.basePrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {outOfStockProducts.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                All products are in stock.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
