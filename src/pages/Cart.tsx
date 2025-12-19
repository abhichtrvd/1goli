import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Trash2, Plus, Minus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Cart() {
  const cartItems = useQuery(api.cart.getCart);
  const settings = useQuery(api.settings.getSettings);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeFromCart = useMutation(api.cart.removeFromCart);
  const clearCart = useMutation(api.cart.clearCart);
  const navigate = useNavigate();
  
  if (cartItems === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const calculateItemPrice = (item: any) => {
    if (!item.product) return 0;
    let price = item.product.basePrice;
    if (item.potency === "Mother Tincture") price += 5;
    if (item.potency === "1M") price += 2;
    if (item.form === "Drops") price += 3;
    return price;
  };

  const subtotal = cartItems.reduce((acc, item) => {
    if (!item.product) return acc;
    return acc + (calculateItemPrice(item) * item.quantity);
  }, 0);

  const shippingFee = settings ? (subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee) : 0;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleClearCart = async () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      await clearCart();
      toast.success("Cart cleared");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          {cartItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearCart} className="text-muted-foreground hover:text-destructive">
              <X className="mr-2 h-4 w-4" /> Clear Cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-muted h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added any remedies yet.</p>
            <Button onClick={() => navigate("/")}>Start Shopping</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                if (!item.product) return null;
                return (
                <Card key={item._id} className="flex flex-col sm:flex-row overflow-hidden">
                  <div className="w-full sm:w-32 h-32 bg-secondary/20 shrink-0">
                    <img 
                      src={item.product.imageUrl || ""} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.potency} • {item.form}
                        </p>
                      </div>
                      <p className="font-bold text-lg">
                        ₹{(calculateItemPrice(item) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity({ cartItemId: item._id, quantity: item.quantity - 1 })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity({ cartItemId: item._id, quantity: item.quantity + 1 })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart({ cartItemId: item._id })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingFee === 0 ? "text-green-600" : ""}>
                      {shippingFee === 0 ? "Free" : `₹${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  {settings && shippingFee > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Add ₹{(settings.freeShippingThreshold - subtotal).toFixed(2)} more for free shipping
                    </div>
                  )}
                  <div className="border-t pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full h-12 text-lg" 
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}