import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, MapPin, Monitor, Activity, History, Tag as TagIcon, Ban, Mail } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserDetailsDialogProps {
  user: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const userActivity = useQuery(
    api.userActivity.getUserActivity,
    user?._id ? { userId: user._id as Id<"users">, limit: 50, filter: activityFilter } : "skip"
  );

  const loginHistory = useQuery(
    api.loginHistory.getUserLoginHistory,
    user?._id ? { userId: user._id as Id<"users">, limit: 20 } : "skip"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Comprehensive information for {user?.name || "Anonymous User"}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="login">Login History</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="text-lg">{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.name || "Anonymous"}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role || "user"}
                    </Badge>
                    {user.suspended && (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Suspended
                      </Badge>
                    )}
                    {user.emailVerified && (
                      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground font-medium">User ID</span>
                  <span className="col-span-2 font-mono text-xs">{user._id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </span>
                  <span className="col-span-2">{user.email || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground font-medium">Phone</span>
                  <span className="col-span-2">{user.phone || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground font-medium">Address</span>
                  <span className="col-span-2">{user.address || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground font-medium">Joined</span>
                  <span className="col-span-2">{new Date(user._creationTime).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded hover:bg-muted/50">
                  <span className="text-muted-foreground font-medium">Last Active</span>
                  <span className="col-span-2">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Never"}
                  </span>
                </div>
                {user.suspended && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded bg-red-50 dark:bg-red-900/20">
                      <span className="text-muted-foreground font-medium">Suspension Reason</span>
                      <span className="col-span-2 text-red-600 dark:text-red-400">{user.suspensionReason || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm p-2 rounded bg-red-50 dark:bg-red-900/20">
                      <span className="text-muted-foreground font-medium">Suspended At</span>
                      <span className="col-span-2 text-red-600 dark:text-red-400">
                        {user.suspendedAt ? new Date(user.suspendedAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Activity Timeline</span>
                </div>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {userActivity && userActivity.length > 0 ? (
                  <div className="space-y-2">
                    {userActivity.map((activity: any) => (
                      <div key={activity._id} className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        <div className="shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm capitalize">{activity.action.replace(/_/g, " ")}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {activity.details && (
                            <p className="text-sm text-muted-foreground">{activity.details}</p>
                          )}
                          {activity.metadata && (
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {activity.metadata.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {activity.metadata.ipAddress}
                                </span>
                              )}
                              {activity.metadata.userAgent && (
                                <span className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  {activity.metadata.userAgent.slice(0, 30)}...
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Activity className="h-12 w-12 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No activity recorded</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Login History Tab */}
            <TabsContent value="login" className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Login Attempts</span>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {loginHistory && loginHistory.length > 0 ? (
                  <div className="space-y-2">
                    {loginHistory.map((login: any) => (
                      <div
                        key={login._id}
                        className={`flex gap-3 p-3 border rounded-lg ${
                          login.success ? "bg-green-50/50 dark:bg-green-900/10" : "bg-red-50/50 dark:bg-red-900/10"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {login.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {login.success ? "Successful Login" : "Failed Login"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(login.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {login.ipAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {login.ipAddress}
                              </span>
                            )}
                            {login.location && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {login.location}
                              </span>
                            )}
                          </div>
                          {!login.success && login.failureReason && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Reason: {login.failureReason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <History className="h-12 w-12 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No login history available</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="space-y-4">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">User Tags & Segments</span>
              </div>

              <div className="p-4 border rounded-lg">
                {user.tags && user.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TagIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No tags assigned to this user</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted/50 border rounded-lg text-xs text-muted-foreground">
                <p>
                  Tags help organize users into segments for targeted messaging, filtering, and reporting. Use the tag management dialog to add or remove tags.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
