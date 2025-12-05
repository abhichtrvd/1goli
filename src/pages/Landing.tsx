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

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const products = useQuery(api.products.searchProducts, { query: searchQuery });
  const seed = useMutation(api.products.seedProducts);
  const navigate = useNavigate();

  useEffect(() => {
    seed();
  }, []);

  const healthConcerns = [
    { title: "Stomach Care", icon: <Activity className="h-6 w-6" />, color: "bg-orange-100 text-orange-600" },
    { title: "Heart Care", icon: <Heart className="h-6 w-6" />, color: "bg-red-100 text-red-600" },
    { title: "Pain Relief", icon: <Pill className="h-6 w-6" />, color: "bg-blue-100 text-blue-600" },
    { title: "Cold & Cough", icon: <Thermometer className="h-6 w-6" />, color: "bg-green-100 text-green-600" },
    { title: "Diabetes", icon: <FlaskConical className="h-6 w-6" />, color: "bg-purple-100 text-purple-600" },
    { title: "Consultation", icon: <Stethoscope className="h-6 w-6" />, color: "bg-teal-100 text-teal-600" },
  ];

  const labTests = [
    { title: "Comprehensive Full Body Checkup", price: "$49", tests: "75+ Tests included" },
    { title: "Vitamin D & B12 Profile", price: "$29", tests: "3 Tests included" },
    { title: "Thyroid Profile (Total)", price: "$19", tests: "3 Tests included" },
    { title: "Diabetes Screening", price: "$15", tests: "2 Tests included" },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section - 1mg Style but Apple Aesthetic */}
      <section className="pt-12 pb-16 md:pt-24 md:pb-24 px-4 bg-secondary/30">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
                  Your Health, <br/>
                  <span className="text-primary">Simplified.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto md:mx-0">
                  India's leading digital healthcare platform. From medicines to lab tests, we've got you covered.
                </p>

                <div className="relative max-w-xl mx-auto md:mx-0 mb-8">
                  <div className="relative bg-white dark:bg-card shadow-xl rounded-2xl p-2 flex items-center border border-border/50">
                    <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      className="border-none shadow-none bg-transparent h-12 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/70"
                      placeholder="Search for medicines, lab tests, and more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button className="rounded-xl h-10 px-6" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
                      Search
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border border-border/50">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> 100% Genuine Medicines
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border border-border/50">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Trusted by Millions
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Hero Right Side - Quick Actions */}
            <div className="flex-1 w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
              >
                <Card className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/upload')}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Upload Prescription</h3>
                      <p className="text-xs text-muted-foreground mt-1">We'll fill it for you</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <FlaskConical className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Book Lab Tests</h3>
                      <p className="text-xs text-muted-foreground mt-1">Home sample collection</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-card border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer col-span-2">
                  <CardContent className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">Consult a Doctor</h3>
                        <p className="text-xs text-muted-foreground mt-1">Chat with experts 24/7</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Health Concern */}
      <section className="py-16 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Shop by Health Concern</h2>
            <Button variant="link" className="text-primary">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {healthConcerns.map((concern, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer text-center"
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

      {/* Featured Lab Tests */}
      <section className="py-16 bg-secondary/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Featured Health Checkups</h2>
              <p className="text-muted-foreground mt-1">Top booked diagnostic tests</p>
            </div>
            <Button variant="link" className="text-primary">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {labTests.map((test, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                <div className="h-2 bg-primary/80" />
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{test.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{test.tests}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-xl text-primary">{test.price}</span>
                    <Button size="sm" variant="outline" className="rounded-full">Book</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid - Bento Style */}
      <section id="products" className="py-20 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-12 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {searchQuery ? "Search Results" : "Popular Remedies"}
            </h3>
            <p className="text-muted-foreground text-lg">
              Trusted formulations for your holistic health.
            </p>
          </div>

          {products === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-xl">No remedies found for "{searchQuery}".</p>
              <Button variant="link" onClick={() => setSearchQuery("")} className="mt-4">Clear Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white dark:bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-border/50"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <div className="p-8 h-full flex flex-col">
                    <div className="mb-6">
                      <Badge variant="secondary" className="mb-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-3 font-normal">
                        New
                      </Badge>
                      <h4 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">{product.name}</h4>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="mt-auto relative aspect-square w-full flex items-center justify-center bg-secondary/30 rounded-2xl overflow-hidden mb-6">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <span className="text-lg font-medium">From ${product.basePrice}</span>
                      <Button size="sm" className="rounded-full px-6 bg-primary text-white hover:bg-primary/90">
                        Buy
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-secondary/30">
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
               <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-full" />
               <Search className="absolute bottom-8 right-8 h-32 w-32 text-primary/10 group-hover:text-primary/20 transition-colors duration-500" />
            </div>
            <div className="bg-black text-white rounded-3xl p-10 text-left h-[400px] flex flex-col justify-between overflow-hidden relative group shadow-lg">
               <div className="z-10">
                 <h4 className="text-2xl font-semibold mb-2">Expert AI</h4>
                 <p className="text-gray-400">Guidance available 24/7.</p>
               </div>
               <div className="absolute right-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent" />
               <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}