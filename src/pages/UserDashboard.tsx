import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Calendar, LogOut, Shield, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import React from "react";
import { toast } from "sonner";

export default function UserDashboard() {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const orders = useQuery(api.orders.getOrders);
  const bookings = useQuery(api.consultations.getUserBookings);
  const prescriptions = useQuery(api.prescriptions.getMyPrescriptions);
  const updateProfile = useMutation(api.users.updateCurrentUser);
  
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  if (user === undefined || orders === undefined || bookings === undefined || prescriptions === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found. Please sign in.</p>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;

    try {
      await updateProfile({ name, address });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / User Info */}
          <div className="w-full md:w-1/4 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                <div className="flex gap-2 mb-6">
                  {user.role === "admin" && (
                    <Badge variant="outline" className="border-primary text-primary">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  )}
                  <Badge variant="secondary">Member</Badge>
                </div>
                <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="consultations">Consultations</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and shipping address.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" defaultValue={user.name} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email} disabled className="bg-muted" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={user.phone || ""} disabled className="bg-muted" placeholder="Not linked" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address">Default Shipping Address</Label>
                        <Input id="address" name="address" defaultValue={user.address} placeholder="Enter your address" />
                      </div>
                      <Button type="submit" disabled={isUpdating} className="mt-4">
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>View your past orders and their status.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No orders yet</h3>
                        <p className="text-muted-foreground mb-4">Start shopping to see your orders here.</p>
                        <Button onClick={() => navigate("/")}>Browse Products</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-secondary/10 transition-colors gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Order #{order._id.slice(-6).toUpperCase()}</span>
                                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className={order.paymentStatus === 'paid' ? 'bg-green-600' : ''}>
                                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order._creationTime).toLocaleDateString()} • {order.items.length} items
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold">₹{order.total.toFixed(2)}</span>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/order-confirmation/${order._id}`)}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Consultations Tab */}
              <TabsContent value="consultations">
                <Card>
                  <CardHeader>
                    <CardTitle>My Consultations</CardTitle>
                    <CardDescription>Manage your appointments with homeopaths.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No consultations yet</h3>
                        <p className="text-muted-foreground mb-4">Book an appointment with our experts.</p>
                        <Button onClick={() => navigate("/consult")}>Find a Doctor</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div key={booking._id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg hover:bg-secondary/10 transition-colors gap-4">
                            <div className="flex gap-4">
                              <Avatar className="h-12 w-12 hidden sm:block">
                                <AvatarImage src={booking.doctor?.imageUrl} />
                                <AvatarFallback>Dr</AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <h4 className="font-semibold">{booking.doctor?.name || "Unknown Doctor"}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {booking.preferredDate} at {booking.preferredSlot}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline">{booking.consultationMode}</Badge>
                                  <Badge 
                                    variant={booking.status === 'confirmed' ? 'default' : booking.status === 'completed' ? 'secondary' : 'outline'}
                                    className={booking.status === 'confirmed' ? 'bg-green-600' : ''}
                                  >
                                    {booking.status.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-center gap-2">
                               <span className="font-bold text-sm">₹{booking.amount}</span>
                               {booking.status === 'confirmed' && (
                                 <Button size="sm" variant="outline">Join Call</Button>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions">
                <Card>
                  <CardHeader>
                    <CardTitle>My Prescriptions</CardTitle>
                    <CardDescription>Track status of your uploaded prescriptions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {prescriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No prescriptions uploaded</h3>
                        <p className="text-muted-foreground mb-4">Upload a prescription to get medicines delivered.</p>
                        <Button onClick={() => navigate("/upload")}>Upload Now</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {prescriptions.map((p) => (
                          <div key={p._id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg hover:bg-secondary/10 transition-colors gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Uploaded on {new Date(p._creationTime).toLocaleDateString()}</span>
                                <Badge 
                                  variant={p.status === 'processed' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}
                                  className={p.status === 'processed' ? 'bg-green-600' : ''}
                                >
                                  {p.status.toUpperCase()}
                                </Badge>
                              </div>
                              {p.notes && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  <span className="font-medium">Note:</span> {p.notes}
                                </p>
                              )}
                              {p.pharmacistNotes && (
                                <div className="bg-secondary/50 p-2 rounded text-sm">
                                  <span className="font-medium text-primary">Pharmacist:</span> {p.pharmacistNotes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                               <Button size="sm" variant="outline" onClick={() => p.imageUrl && window.open(p.imageUrl, '_blank')} disabled={!p.imageUrl}>
                                 View Image <ExternalLink className="ml-2 h-3 w-3" />
                               </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}