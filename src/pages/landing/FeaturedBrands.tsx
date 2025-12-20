import { motion } from "framer-motion";

interface FeaturedBrandsProps {
  selectedBrand: string | undefined;
  handleBrandClick: (brand: string) => void;
}

export function FeaturedBrands({ selectedBrand, handleBrandClick }: FeaturedBrandsProps) {
  const featuredBrands = [
    "Dr. Reckeweg", 
    "SBL World Class", 
    "Schwabe India", 
    "Adel Pekana", 
    "Bakson's", 
    "Bjain Pharma"
  ];

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
