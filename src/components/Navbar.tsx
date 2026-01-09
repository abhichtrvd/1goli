import { useAuth } from "@/hooks/use-auth";
import { Menu, ShoppingBag, User, LogOut, Search, FileText, Activity, Stethoscope, Package, Settings, Loader2, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function Navbar() {
  const { isAuthenticated, signOut, user } = useAuth();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.getCart);
  const cartCount = cartItems?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
  
  // Profile state removed in favor of /account page
  const promoteToAdmin = useMutation(api.users.promoteCurrentUserToAdmin);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handlePromoteToAdmin = async () => {
    try {
      await promoteToAdmin();
      toast.success("You are now an admin!");
      // Small delay to allow DB propagation before reload/navigation might be better, but reload ensures fresh state
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error("Failed to promote to admin");
    }
  };

  // Profile update handler removed

  return (
    <nav className="sticky top-0 z-50 w-full bg-background backdrop-blur-md border-b border-border/40">
      <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/80 hover:text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left font-semibold text-2xl">
                  1g<span className="inline-block w-[0.55em] h-[0.55em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.05em]" />li
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg font-medium hover:text-lime-600 transition-colors flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5" /> Homeopathy
                </Link>
                <Link to="/upload" className="text-lg font-medium hover:text-lime-600 transition-colors flex items-center gap-3">
                  <FileText className="h-5 w-5" /> Upload Prescription
                </Link>
                <Link to="/consult" className="text-lg font-medium hover:text-lime-600 transition-colors flex items-center gap-3">
                  <Stethoscope className="h-5 w-5" /> Consult Homeopaths
                </Link>
                <Link to="/wholesale" className="text-lg font-medium hover:text-lime-600 transition-colors flex items-center gap-3">
                  <Package className="h-5 w-5" /> Wholesale
                </Link>
                <div className="h-px bg-border/50 my-2" />
                {isAuthenticated ? (
                  <>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="text-lg font-medium text-left hover:text-lime-600 transition-colors flex items-center gap-3"
                      >
                        <LayoutDashboard className="h-5 w-5" /> Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/account"
                      className="text-lg font-medium text-left hover:text-lime-600 transition-colors flex items-center gap-3"
                    >
                      <Settings className="h-5 w-5" /> My Account
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="text-lg font-medium text-left hover:text-lime-600 transition-colors text-destructive flex items-center gap-3"
                    >
                      <LogOut className="h-5 w-5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="text-lg font-medium hover:text-lime-600 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="font-semibold text-xl tracking-tight">
              1g<span className="inline-block w-[0.55em] h-[0.55em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.05em]" />li
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-lime-600 transition-colors text-foreground">Homeopathy</Link>
            <Link to="/consult" className="hover:text-lime-600 transition-colors">Consult Homeopaths</Link>
            <Link to="/wholesale">
              <Button size="sm" className="text-xs font-medium bg-black text-white hover:bg-black/90 rounded-full px-5 h-8">
                Wholesale
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:flex items-center bg-secondary rounded-full px-3 h-9 border border-transparent focus-within:border-primary/20 focus-within:bg-secondary transition-all w-64">
             <Search className="h-4 w-4 text-muted-foreground mr-2" />
             <input 
               className="border-none shadow-none bg-transparent h-full w-full text-sm focus-visible:ring-0 placeholder:text-muted-foreground/70 focus:outline-none"
               placeholder="Search for remedies..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={handleSearch}
             />
          </div>

          <Link to="/upload" className="hidden sm:flex">
            <Button variant="ghost" size="sm" className="text-xs font-medium">
              Upload
            </Button>
          </Link>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-foreground">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center ring-2 ring-background">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.name && <p className="font-medium">{user.name}</p>}
                    {user?.email && <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>}
                    {user?.phone && <p className="w-[200px] truncate text-xs text-muted-foreground">{user.phone}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {user?.role !== "admin" && (
                   <DropdownMenuItem onClick={handlePromoteToAdmin}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Dev: Make Me Admin
                   </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")} size="sm" className="hidden md:flex rounded-full px-5 h-8 text-xs font-medium">
              Sign In
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 bg-background/50 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 md:gap-8 h-10 text-sm font-medium text-muted-foreground overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Link to="/category/Dilution" className="hover:text-lime-600 transition-colors whitespace-nowrap">Dilutions</Link>
            <Link to="/category/Mother%20Tincture" className="hover:text-lime-600 transition-colors whitespace-nowrap">Mother Tincture</Link>
            <Link to="/category/Biochemics" className="hover:text-lime-600 transition-colors whitespace-nowrap">Biochemics</Link>
            <Link to="/category/Triturations" className="hover:text-lime-600 transition-colors whitespace-nowrap">Triturations</Link>
            <Link to="/category/Bio%20Combinations" className="hover:text-lime-600 transition-colors whitespace-nowrap">Bio Combinations</Link>
            <Link to="/category/Patent" className="hover:text-lime-600 transition-colors whitespace-nowrap">Patent</Link>
            <Link to="/category/Cosmetics" className="hover:text-lime-600 transition-colors whitespace-nowrap">Cosmetics</Link>
          </div>
        </div>
      </div>

      {/* Profile Dialog removed */}
    </nav>
  );
}