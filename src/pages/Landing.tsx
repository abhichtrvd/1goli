import { useState, useEffect } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { HeroSection } from "./landing/HeroSection";
import { QuickActions } from "./landing/QuickActions";
import { HealthConcerns } from "./landing/HealthConcerns";
import { FeaturedBrands } from "./landing/FeaturedBrands";
import { ProductsGrid } from "./landing/ProductsGrid";
import { FeatureSection } from "./landing/FeatureSection";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Use paginated query for products
  const { results: products, status, loadMore, isLoading } = usePaginatedQuery(
    api.products.getPaginatedProducts,
    { 
      brand: selectedBrand,
      sort: sortBy === "newest" ? undefined : sortBy 
    },
    { initialNumItems: 10 }
  );

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

  const handleBrandClick = (brand: string) => {
    if (selectedBrand === brand) {
      setSelectedBrand(undefined); // Deselect
    } else {
      setSelectedBrand(brand);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <HeroSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        handleKeyDown={handleKeyDown}
      />
      
      <QuickActions />
      
      <HealthConcerns />
      
      <FeaturedBrands 
        selectedBrand={selectedBrand}
        handleBrandClick={handleBrandClick}
      />
      
      <ProductsGrid 
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        sortBy={sortBy}
        setSortBy={setSortBy}
        products={products}
        status={status}
        loadMore={loadMore}
        isLoading={isLoading}
      />
      
      <FeatureSection />
    </div>
  );
}