import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ArrowRight, Upload, Activity, Heart, Pill, Thermometer, Stethoscope, FlaskConical } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  // Use empty query to get popular/all products initially or a specific "featured" query if available
  // For now, we'll just fetch all (or a subset) for the "Popular" section without search filtering
  const products = useQuery(api.products.searchProducts, { query: "" }); 
  const seed = useMutation(api.products.seedProducts);
  const navigate = useNavigate();

  useEffect(() => {
    seed();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const healthConcerns = [
    { title: "Hair Fall", icon: <Activity className="h-6 w-6" />, color: "bg-orange-100 text-orange-600" },
    { title: "Skin Care", icon: <Heart className="h-6 w-6" />, color: "bg-red-100 text-red-600" },
    { title: "Gastric Issues", icon: <Pill className="h-6 w-6" />, color: "bg-lime-100 text-lime-700" },
    { title: "Cold & Cough", icon: <Thermometer className="h-6 w-6" />, color: "bg-green-100 text-green-600" },
    { title: "Joint Pain", icon: <FlaskConical className="h-6 w-6" />, color: "bg-purple-100 text-purple-600" },
    { title: "Female Care", icon: <Stethoscope className="h-6 w-6" />, color: "bg-teal-100 text-teal-600" },
  ];

  const featuredBrands = [
    "Dr. Reckeweg", 
    "SBL World Class", 
    "Schwabe India", 
    "Adel Pekana", 
    "Bakson's", 
    "Bjain Pharma"
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section - Centered Search */}
      <section className="pt-12 pb-16 md:pt-24 md:pb-24 px-4 bg-secondary">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="relative max-w-2xl mx-auto w-full pb-6">
                <div className="relative bg-white dark:bg-card shadow-xl rounded-2xl p-2 flex items-center border border-border">
                  <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    className="border-none shadow-none bg-transparent h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/70"
                    placeholder="Search for homeopathic remedies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button className="rounded-xl h-10 px-6" onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-tight">
                Homoeopathy, <br/>
                <span className="text-lime-600">Simplified</span> by <br/>
                <span className="text-5xl md:text-7xl whitespace-nowrap">1g<span className="inline-block w-[0.55em] h-[0.55em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.05em]" />li</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto pt-4">
                India's trusted Homeopathic Pharmacy. Authentic remedies, expert guidance, and doorstep delivery.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border border-border">
                  <span className="h-2 w-2 rounded-full bg-[#A6FF00]" /> Genuine Medicines
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border border-border">
                  <span className="h-2 w-2 rounded-full bg-lime-600" /> Certified Homeopaths
                </div>
              </div>
            </motion.div>

            {/* Quick Actions - Centered Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl"
            >
              <Card className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/upload')}>
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-lime-50 text-lime-700 flex items-center justify-center">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Upload Prescription</h3>
                    <p className="text-xs text-muted-foreground mt-1">We'll dispense it for you</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Consult Homeopath</h3>
                    <p className="text-xs text-muted-foreground mt-1">Expert guidance</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Shop by Health Concern */}
      <section className="py-16 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Shop by Health Concern</h2>
            <Button variant="link" className="text-lime-600">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {healthConcerns.map((concern, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary transition-colors cursor-pointer text-center"
              >
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${concern.color}`}>
                  {concern.icon}
                </div>
                <span className="font-medium text-sm">{concern.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-12 bg-secondary border-y border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">Featured Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {featuredBrands.map((brand, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center justify-center text-center hover:shadow-md transition-all cursor-pointer h-24"
              >
                <span className="font-semibold text-muted-foreground hover:text-lime-600 transition-colors">{brand}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid - Bento Style */}
      <section id="products" className="py-20 bg-secondary">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-12 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              Popular Homeopathic Remedies
            </h3>
            <p className="text-muted-foreground text-lg">
              Trusted formulations for your holistic health.
            </p>
          </div>

          {products === undefined ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[240px] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-xl">No remedies found.</p>
            </div>
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {products.map((product, index) => (
                  <CarouselItem key={product._id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="group relative bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border h-full"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      <div className="p-3 h-full flex flex-col">
                        <div className="relative aspect-square w-full flex items-center justify-center bg-secondary rounded-lg overflow-hidden mb-2">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                              <Activity className="h-6 w-6 mb-1" />
                              <span className="text-[10px]">No Image</span>
                            </div>
                          )}
                          <Badge variant="secondary" className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm text-black text-[9px] px-1.5 py-0 h-4">
                            New
                          </Badge>
                        </div>

                        <div className="mb-1">
                          <h4 className="text-sm font-semibold mb-0.5 group-hover:text-primary transition-colors line-clamp-1" title={product.name}>{product.name}</h4>
                          <p className="text-muted-foreground line-clamp-1 text-[10px]">
                            {product.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                          <span className="text-xs font-bold text-lime-600">₹{product.basePrice}</span>
                          <Button size="sm" className="rounded-full px-3 h-6 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90">
                            Add
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-4" />
                <CarouselNext className="-right-4" />
              </div>
            </Carousel>
          )}
          
          <div className="mt-12 text-center">
             <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => navigate('/search')}>
               View All Remedies
             </Button>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-secondary">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Intelligent Homeopathy.
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Our AI analyzes your symptoms to recommend the perfect remedy. 
            Safe, effective, and personalized just for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-card rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group shadow-lg">
               <div className="z-10">
                 <h4 className="text-2xl font-semibold mb-2">Symptom Search</h4>
                 <p className="text-muted-foreground">Find what you need, instantly.</p>
               </div>
               <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-gradient-to-tl from-[#A6FF00]/20 to-transparent rounded-tl-full" />
               <Search className="absolute bottom-8 right-8 h-32 w-32 text-primary/20 group-hover:text-primary/40 transition-colors duration-500" />
            </div>
            <div className="bg-black text-white rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group shadow-lg">
               <div className="z-10">
                 <h4 className="text-2xl font-semibold mb-2">Expert AI</h4>
                 <p className="text-gray-400">Guidance available 24/7.</p>
               </div>
               <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent" />
               <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-gradient-to-tr from-[#A6FF00] to-lime-500 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}