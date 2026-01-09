import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, MessageSquare, CheckCircle, Star, ThumbsUp, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Cell, Pie, PieChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

export default function ReviewMetricsDashboard() {
  const metrics = useQuery(api.reviews.getReviewMetrics);

  if (metrics === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sentimentData = [
    { name: "Positive", value: metrics.sentimentDistribution.positive, fill: "#22c55e" },
    { name: "Neutral", value: metrics.sentimentDistribution.neutral, fill: "#eab308" },
    { name: "Negative", value: metrics.sentimentDistribution.negative, fill: "#ef4444" },
  ];

  const statusData = [
    { name: "Approved", value: metrics.approvedReviews, fill: "#22c55e" },
    { name: "Pending", value: metrics.pendingReviews, fill: "#eab308" },
    { name: "Rejected", value: metrics.rejectedReviews, fill: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.approvedReviews} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Purchases</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.verifiedPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              Of all reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Reviews with admin reply
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards for Issues */}
      {(metrics.suspiciousReviews > 0 || metrics.duplicateReviews > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.suspiciousReviews > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-900">Suspicious Reviews</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{metrics.suspiciousReviews}</div>
                <p className="text-xs text-orange-700">
                  Reviews flagged by spam detection
                </p>
              </CardContent>
            </Card>
          )}

          {metrics.duplicateReviews > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-900">Duplicate Reviews</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">{metrics.duplicateReviews}</div>
                <p className="text-xs text-yellow-700">
                  Potential duplicate content detected
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Overall sentiment of customer reviews</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Review Status</CardTitle>
            <CardDescription>Moderation status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Review Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Review Volume (Last 30 Days)</CardTitle>
          <CardDescription>Daily review submission trend</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.volumeTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                name="Reviews"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Reviewed Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Reviewed Products</CardTitle>
          <CardDescription>Products with the most approved reviews</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="productName"
                type="category"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="reviewCount" fill="#8884d8" name="Reviews" />
              <Bar dataKey="averageRating" fill="#82ca9d" name="Avg Rating" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
