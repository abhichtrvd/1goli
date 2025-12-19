import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Home, Loader2, Users, Stethoscope, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isLoading } = useAuth();
  const pendingPrescriptions = useQuery(api.prescriptions.getPendingCount);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast.error("Please sign in to access admin panel");
        navigate("/auth");
      } else if (user.role !== "admin") {
        toast.error("Unauthorized access");
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-card border-r border-border/50 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-border/50">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-semibold text-xl tracking-tight">
              1g<span className="inline-block w-[0.55em] h-[0.55em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.05em]" />li
            </span>
            <span className="text-xs font-medium bg-primary/20 text-primary-foreground px-2 py-0.5 rounded-full ml-2">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin">
            <Button 
              variant={isActive("/admin") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/admin/products">
            <Button 
              variant={isActive("/admin/products") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <Package className="mr-2 h-4 w-4" />
              Products
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button 
              variant={isActive("/admin/orders") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Orders
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button 
              variant={isActive("/admin/users") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
          </Link>
          <Link to="/admin/doctors">
            <Button 
              variant={isActive("/admin/doctors") ? "secondary" : "ghost"} 
              className="w-full justify-start"
            >
              <Stethoscope className="mr-2 h-4 w-4" />
              Doctors
            </Button>
          </Link>
          <Link to="/admin/prescriptions">
            <Button 
              variant={isActive("/admin/prescriptions") ? "secondary" : "ghost"} 
              className="w-full justify-start flex justify-between items-center"
            >
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Prescriptions
              </div>
              {pendingPrescriptions !== undefined && pendingPrescriptions > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {pendingPrescriptions}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-border/50 space-y-2">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Back to Store
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-card border-b border-border/50 flex items-center justify-between px-4 z-20">
         <span className="font-semibold text-lg">Admin Panel</span>
         <Link to="/">
            <Button size="sm" variant="ghost">Exit</Button>
         </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}