import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity, ShoppingCart, UserPlus, LogIn, FileText } from "lucide-react";

export default function AdminActivityFeed() {
  const activities = useQuery(api.userActivity.getAllRecentActivity, { limit: 100 });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "order_placed":
        return <ShoppingCart className="h-4 w-4" />;
      case "login":
        return <LogIn className="h-4 w-4" />;
      case "profile_updated":
        return <UserPlus className="h-4 w-4" />;
      case "review_posted":
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "order_placed":
        return "bg-green-500/10 text-green-500";
      case "login":
        return "bg-blue-500/10 text-blue-500";
      case "profile_updated":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground">
          Real-time activity stream across your platform
        </p>
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
                  <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{activity.userName}</p>
                      <Badge variant="outline" className="text-xs">
                        {activity.action.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.userEmail}</p>
                    {activity.details && (
                      <p className="text-sm mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
