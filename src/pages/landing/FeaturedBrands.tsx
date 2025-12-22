import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_FEATURED_BRANDS } from "@/data/siteDefaults";

interface FeaturedBrandsProps {
  selectedBrand: string | undefined;
  handleBrandClick: (brand: string) => void;
}

export function FeaturedBrands({ selectedBrand, handleBrandClick }: FeaturedBrandsProps) {
  const settings = useQuery(api.settings.getSettings);
  
  const featuredBrands =
    settings?.featuredBrands && settings.featuredBrands.length > 0
      ? settings.featuredBrands
      : DEFAULT_FEATURED_BRANDS;

  return (
    <section className="py-12 bg-secondary border-y border-border">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">Featured Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {featuredBrands.map((brand, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleBrandClick(brand)}
              className={`p-6 rounded-2xl shadow-sm border flex items-center justify-center text-center hover:shadow-md transition-all cursor-pointer h-24 ${
                selectedBrand === brand 
                  ? "bg-lime-100 border-lime-500 text-lime-800 ring-2 ring-lime-500/20" 
                  : "bg-white dark:bg-card border-border text-muted-foreground hover:text-lime-600"
              }`}
            >
              <span className="font-semibold">{brand}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}