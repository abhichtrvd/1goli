import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ShoppingCart, UserPlus, LogIn, FileText, Package, Pill, Star, Mail } from "lucide-react";

export default function AdminActivityFeed() {
  const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);

  const activities = useQuery(api.activityFeed.getActivityFeed, {
    entityType: entityFilter as any,
    limit: 100
  });

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />;
      case "user":
        return <UserPlus className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      case "prescription":
        return <Pill className="h-4 w-4" />;
      case "review":
        return <Star className="h-4 w-4" />;
      case "campaign":
        return <Mail className="h-4 w-4" />;
      case "system":
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case "order":
        return "bg-green-500/10 text-green-500";
      case "user":
        return "bg-blue-500/10 text-blue-500";
      case "product":
        return "bg-purple-500/10 text-purple-500";
      case "prescription":
        return "bg-orange-500/10 text-orange-500";
      case "review":
        return "bg-yellow-500/10 text-yellow-500";
      case "campaign":
        return "bg-pink-500/10 text-pink-500";
      case "system":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">
            Real-time activity stream across your platform
          </p>
        </div>
        <Select
          value={entityFilter || "all"}
          onValueChange={(value) => setEntityFilter(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="prescription">Prescriptions</SelectItem>
            <SelectItem value="review">Reviews</SelectItem>
            <SelectItem value="campaign">Campaigns</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Live updates from all users</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-3">
              {activities?.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className={`p-2 rounded-full ${getEntityColor(activity.entityType)}`}>
                    {getEntityIcon(activity.entityType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{activity.description}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.entityType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{activity.performedByName || "System"}</span>
                      {activity.performedByEmail && (
                        <>
                          <span>•</span>
                          <span>{activity.performedByEmail}</span>
                        </>
                      )}
                    </div>
                    {activity.metadata && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Action: {activity.action}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {activities?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activities found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
