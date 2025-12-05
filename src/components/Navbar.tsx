import { useAuth } from "@/hooks/use-auth";
import { Menu, ShoppingBag, User, LogOut, Search } from "lucide-react";
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
} from "./ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function Navbar() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.getCart);
  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container max-w-5xl mx-auto flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/80 hover:text-foreground">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left font-semibold">
                  1g<span className="relative inline-block"><span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"><span className="w-[0.41em] h-[0.41em] bg-[#A6FF00] rounded-full translate-y-[0.1em]" /></span><span className="relative z-10">o</span></span>li
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-xl font-medium hover:text-primary transition-colors">
                  Store
                </Link>
                <Link to="/upload" className="text-xl font-medium hover:text-primary transition-colors">
                  Prescription
                </Link>
                {isAuthenticated ? (
                  <button
                    onClick={() => signOut()}
                    className="text-xl font-medium text-left hover:text-primary transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link to="/auth" className="text-xl font-medium hover:text-primary transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="font-semibold text-lg tracking-tight">
              1g<span className="relative inline-block"><span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"><span className="w-[0.41em] h-[0.41em] bg-[#A6FF00] rounded-full translate-y-[0.1em]" /></span><span className="relative z-10">o</span></span>li
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Store</Link>
            <Link to="/upload" className="hover:text-foreground transition-colors">Upload Prescription</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Remedies</Link>
            <Link to="#" className="hover:text-foreground transition-colors">Consultation</Link>
            <Link to="#" className="hover:text-foreground transition-colors">About Us</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-foreground">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-primary text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")} size="sm" className="hidden md:flex rounded-full px-4 h-7 text-xs">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}