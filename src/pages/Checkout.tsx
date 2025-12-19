import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldCheck, Truck, CreditCard, Banknote, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Checkout() {
  const navigate = useNavigate();
  const cartItems = useQuery(api.cart.getCart);
  const createOrder = useMutation(api.orders.createOrder);
  const confirmPayment = useMutation(api.orders.confirmOrderPayment);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  if (cartItems === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const simulatePaymentGateway = async (amount: number): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate a 10% failure rate for robust error handling demonstration
        const isSuccess = Math.random() > 0.1; 
        if (isSuccess) {
          resolve({ success: true, paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}` });
        } else {
          resolve({ success: false, error: "Payment declined by bank. Please try a different card." });
        }
      }, 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      const validItems = cartItems.filter(item => item.product !== null);
      const orderItems = validItems.map(item => ({
        productId: item.productId,
        name: item.product!.name,
        potency: item.potency,
        form: item.form,
        packingSize: item.packingSize,
        quantity: item.quantity,
        price: calculateItemPrice(item)
      }));

      const formattedAddress = `${formData.addressLine1}, ${formData.addressLine2 ? formData.addressLine2 + ', ' : ''}${formData.city}, ${formData.state} - ${formData.zipCode}`;

      // 1. Create Order (Pending Payment)
      const orderId = await createOrder({
        shippingAddress: formattedAddress,
        shippingDetails: formData,
        paymentMethod,
        total: subtotal,
        items: orderItems
      });

      if (paymentMethod === "online") {
        // 2. Process Payment
        toast.info("Redirecting to secure payment gateway...");
        
        const paymentResult = await simulatePaymentGateway(subtotal);

        if (paymentResult.success && paymentResult.paymentId) {
          // 3. Confirm Payment
          await confirmPayment({
            orderId,
            paymentId: paymentResult.paymentId
          });
          toast.success("Payment successful!");
          navigate(`/order-confirmation/${orderId}`);
        } else {
          // Handle Payment Failure
          setPaymentError(paymentResult.error || "Payment failed");
          toast.error("Payment failed. Please try again.");
          // Note: Order is created but remains pending/unpaid. 
          // In a real app, we might want to allow retrying payment for the SAME orderId 
          // instead of creating a new one, but for simplicity here we just show error.
        }
      } else {
        // COD - Direct Success
        toast.success("Order placed successfully!");
        navigate(`/order-confirmation/${orderId}`);
      }

    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error(error);
      setPaymentError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Error Alert */}
            {paymentError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Error</AlertTitle>
                <AlertDescription>
                  {paymentError}
                </AlertDescription>
              </Alert>
            )}

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        name="fullName" 
                        required 
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        required 
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input 
                      id="addressLine1" 
                      name="addressLine1" 
                      required 
                      placeholder="House No., Street Name"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input 
                      id="addressLine2" 
                      name="addressLine2" 
                      placeholder="Apartment, Suite, Landmark"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        required 
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        name="state" 
                        required 
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input 
                        id="zipCode" 
                        name="zipCode" 
                        required 
                        placeholder="400001"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                  <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Pay Online</div>
                      <div className="text-sm text-muted-foreground">Credit/Debit Card, UPI, Net Banking</div>
                    </Label>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Cash on Delivery</div>
                      <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                    </Label>
                    <Banknote className="h-5 w-5 text-muted-foreground" />
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {cartItems.map((item) => {
                    if (!item.product) return null;
                    return (
                      <div key={item._id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.product.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} x {item.potency}
                          </div>
                        </div>
                        <span>₹{(calculateItemPrice(item) * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12 text-lg" 
                  type="submit" 
                  form="checkout-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {paymentMethod === 'online' ? 'Pay Now' : 'Place Order'}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Secure Checkout powered by 1goli
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}