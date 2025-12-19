import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DashboardTopProductsProps {
  topProducts: any[];
}

export function DashboardTopProducts({ topProducts }: DashboardTopProductsProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>By quantity sold (Selected Period)</CardDescription>
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
                  <p className="text-xs text-muted-foreground">{product.sales} sold • ₹{product.revenue.toFixed(2)} rev</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No sales data for this period.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
