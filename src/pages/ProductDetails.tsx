import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate, Link } from "react-router";
import { useState } from "react";
import { Loader2, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Play, Star, MapPin, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const product = useQuery(api.products.getProduct, { id: id as Id<"products"> });
  const addToCart = useMutation(api.cart.addToCart);

  const [selectedPotency, setSelectedPotency] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<null | { available: boolean, date: string }>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  if (product === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (product === null) {
    return <div>Product not found</div>;
  }

  type MediaItem = {
    url: string;
    id: string;
    type: 'image' | 'video';
    thumbnail?: string;
  };

  const allImages: MediaItem[] = [
    ...(product.imageUrl ? [{ url: product.imageUrl, id: 'main', type: 'image' } as MediaItem] : []),
    ...(product.images || []).map((img: any, i: number) => ({ url: img.url, id: `gallery-${i}`, type: 'image' } as MediaItem)),
    ...(product.videoUrl ? [{ url: product.videoUrl, thumbnail: product.videoThumbnail, id: 'video', type: 'video' } as MediaItem] : [])
  ];

  const currentItem = allImages[currentImageIndex];

  // Reset playing state when changing items
  if (currentItem?.type !== 'video' && isPlaying) {
    setIsPlaying(false);
  }

  // Dynamic price calculation logic
  const getPrice = () => {
    let price = product.basePrice;
    if (selectedPotency === "Mother Tincture") price += 5;
    if (selectedPotency === "1M") price += 2;
    if (selectedForm === "Drops") price += 3;
    return price.toFixed(2);
  };

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart({
        productId: product._id,
        potency: selectedPotency,
        form: selectedForm,
        quantity: 1,
      });
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const checkDelivery = () => {
    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    setCheckingPincode(true);
    // Simulate API call
    setTimeout(() => {
      setCheckingPincode(false);
      setDeliveryStatus({
        available: true,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }, 1000);
  };

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/search">Medicines</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Images */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl overflow-hidden bg-white border shadow-sm aspect-square flex items-center justify-center bg-secondary/10 relative group">
              {currentItem?.type === 'video' ? (
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                  {!isPlaying ? (
                    <>
                      {currentItem.thumbnail ? (
                        <img src={currentItem.thumbnail} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
                      )}
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center group/play"
                      >
                        <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/play:bg-white/30 transition-all group-hover/play:scale-110">
                          <div className="h-12 w-12 rounded-full bg-[#84cc16] flex items-center justify-center shadow-lg">
                            <Play className="h-6 w-6 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </button>
                    </>
                  ) : (
                    currentItem.url.includes('youtube.com') || currentItem.url.includes('youtu.be') ? (
                      <iframe 
                        src={currentItem.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + "?autoplay=1"} 
                        className="w-full h-full" 
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        title="Product Video"
                      />
                    ) : (
                      <video src={currentItem.url} controls autoPlay className="w-full h-full" />
                    )
                  )}
                </div>
              ) : currentItem?.url ? (
                <img 
                  src={currentItem.url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 opacity-50" />
                  </div>
                  <span>No image available</span>
                </div>
              )}
              
              {allImages.length > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
            
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                {allImages.map((item, idx) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`h-16 w-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all relative ${currentImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-black flex items-center justify-center text-white relative">
                        {item.thumbnail && (
                          <img src={item.thumbnail} alt="Thumbnail" className="w-full h-full object-cover opacity-70" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                            <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={item.url} alt="Thumbnail" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="mb-2">
              <Badge variant="outline" className="text-lime-600 border-lime-600/20 mb-2">
                {product.category || "Homeopathic Medicine"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center bg-green-700 text-white px-2 py-0.5 rounded text-sm font-bold">
                {product.averageRating ? product.averageRating.toFixed(1) : "4.5"} <Star className="h-3 w-3 ml-1 fill-current" />
              </div>
              <span className="text-sm text-muted-foreground underline cursor-pointer">
                {product.ratingCount || 128} Ratings & Reviews
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {product.brand && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {product.brand}
                </Badge>
              )}
              {product.symptomsTags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Potency
                      <span className="text-xs text-muted-foreground font-normal">(Strength)</span>
                    </label>
                    <Select value={selectedPotency} onValueChange={setSelectedPotency}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select Potency" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.potencies.map((p: string) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Form
                      <span className="text-xs text-muted-foreground font-normal">(Type)</span>
                    </label>
                    <Select value={selectedForm} onValueChange={setSelectedForm}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select Form" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.forms.map((f: string) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-foreground">₹{getPrice()}</span>
                    <span className="text-sm text-muted-foreground line-through">₹{(parseFloat(getPrice()) * 1.2).toFixed(2)}</span>
                    <span className="text-sm font-bold text-green-600">20% OFF</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Inclusive of all taxes</p>
                  
                  <Button 
                    className="w-full h-12 text-lg font-semibold" 
                    disabled={!selectedPotency || !selectedForm || isAdding || isOutOfStock}
                    onClick={handleAddToCart}
                  >
                    {isAdding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </div>

                {/* Delivery Check */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Check Delivery
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter Pincode" 
                      className="max-w-[150px]" 
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    />
                    <Button variant="outline" onClick={checkDelivery} disabled={checkingPincode}>
                      {checkingPincode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                    </Button>
                  </div>
                  {deliveryStatus && (
                    <div className="text-sm flex items-center gap-2 text-green-600 mt-2">
                      <Truck className="h-4 w-4" />
                      <span>Delivery by {deliveryStatus.date}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info Tabs */}
              <div className="space-y-6">
                <Tabs defaultValue="benefits" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="benefits">Benefits</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="safety">Safety</TabsTrigger>
                  </TabsList>
                  <TabsContent value="benefits" className="mt-4 space-y-4">
                    {product.keyBenefits && product.keyBenefits.length > 0 ? (
                      <ul className="space-y-2">
                        {product.keyBenefits.map((benefit: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    )}
                  </TabsContent>
                  <TabsContent value="usage" className="mt-4">
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <h4 className="font-medium text-foreground mb-1">Directions for Use:</h4>
                      <p>{product.directionsForUse || "As prescribed by the physician."}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="safety" className="mt-4">
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Safety Information:
                      </h4>
                      <p>{product.safetyInformation || "Read the label carefully before use. Keep out of reach of children."}</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold">Product Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-muted-foreground">Brand</div>
                    <div className="font-medium">{product.brand || "Generic"}</div>
                    <div className="text-muted-foreground">Expires on or After</div>
                    <div className="font-medium">Sept, 2026</div>
                    <div className="text-muted-foreground">Country of Origin</div>
                    <div className="font-medium">India</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        {/* Reviews Section */}
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Ratings & Reviews</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-foreground">4.5</span>
                <div className="mb-2">
                  <div className="flex text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current opacity-50" />
                  </div>
                  <span className="text-sm text-muted-foreground">128 Verified Ratings</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">Write a Review</Button>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 pb-6 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="flex text-green-600">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <span className="font-medium text-sm">Very Effective</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "I have been using this for a month and the results are amazing. Highly recommended for anyone suffering from similar issues."
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Rahul Kumar</span>
                    <span>•</span>
                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified Purchase</span>
                    <span>•</span>
                    <span>2 months ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-lime-600">₹{getPrice()}</p>
          </div>
          <Button 
            className="flex-1 h-12" 
            disabled={!selectedPotency || !selectedForm || isAdding || isOutOfStock}
            onClick={handleAddToCart}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}