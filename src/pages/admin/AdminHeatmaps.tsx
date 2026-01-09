import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MousePointer, TrendingDown } from "lucide-react";

export default function AdminHeatmaps() {
  const [selectedPage, setSelectedPage] = useState("/");
  const [dateRange, setDateRange] = useState("7d");

  const now = Date.now();
  const startDate =
    dateRange === "24h"
      ? now - 24 * 60 * 60 * 1000
      : dateRange === "7d"
      ? now - 7 * 24 * 60 * 60 * 1000
      : now - 30 * 24 * 60 * 60 * 1000;

  const heatmapData = useQuery(api.analytics.getClickHeatmap, {
    page: selectedPage,
    startDate,
    endDate: now,
  });

  const scrollData = useQuery(api.analytics.getScrollDepth, {
    page: selectedPage,
    startDate,
    endDate: now,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Click & Scroll Heatmaps</h1>
        <p className="text-muted-foreground">
          Visualize user interactions on your pages
        </p>
      </div>

      <div className="flex gap-4">
        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/">Home Page</SelectItem>
            <SelectItem value="/products">Products</SelectItem>
            <SelectItem value="/checkout">Checkout</SelectItem>
            <SelectItem value="/cart">Cart</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Click Heatmap
            </CardTitle>
            <CardDescription>Total clicks: {heatmapData?.totalClicks || 0}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-secondary/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Heatmap visualization will be displayed here
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                This shows where users click most frequently on the page.
              </p>
              <p className="text-sm">
                Grid size: {heatmapData?.gridSize || 20}px
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Scroll Depth
            </CardTitle>
            <CardDescription>
              Sessions: {scrollData?.totalSessions || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Average Scroll Depth</p>
                <div className="text-3xl font-bold">{scrollData?.avgDepth || 0}%</div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Distribution</p>
                <div className="space-y-2">
                  {scrollData?.distribution &&
                    Object.entries(scrollData.distribution).map(([range, count]) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-sm">{range}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-primary rounded"
                            style={{
                              width: `${((count as number) / scrollData.totalSessions) * 100}%`,
                              minWidth: "20px",
                            }}
                          />
                          <span className="text-sm font-medium">{count as number}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Note</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To enable click and scroll tracking, add the tracking code to your frontend pages.
            See COMMUNICATION_ANALYTICS_IMPLEMENTATION.md for integration instructions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
