import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function HeroSection({ searchQuery, setSearchQuery, handleSearch, handleKeyDown }: HeroSectionProps) {
  const settings = useQuery(api.settings.getSettings);

  const headline = settings?.heroHeadline || "Homoeopathy, Simplified by 1goli";
  const description = settings?.heroDescription || "India's trusted Homeopathic Pharmacy. Authentic remedies, expert guidance, and doorstep delivery.";

  return (
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
              <motion.div 
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative bg-white/90 dark:bg-card/90 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(166,255,0,0.3)] rounded-full p-2 pl-6 flex items-center border border-lime-500/20 ring-4 ring-lime-500/5"
              >
                <Search className="h-5 w-5 text-lime-600 mr-2" />
                <Input 
                  className="border-none shadow-none bg-transparent h-14 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/60 px-2"
                  placeholder="Search for homeopathic remedies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  className="rounded-full h-12 px-8 bg-[#A6FF00] hover:bg-[#95e600] text-black font-semibold text-base shadow-lg shadow-lime-500/20 transition-all hover:shadow-lime-500/40" 
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </motion.div>
            </div>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-tight">
              {headline.includes("1goli") ? (
                <>
                  {headline.split("1goli")[0]}
                  <span className="whitespace-nowrap">1g<span className="inline-block w-[0.55em] h-[0.55em] rounded-full border-[0.12em] border-current bg-[#A6FF00] mx-[0.02em] translate-y-[0.05em]" />li</span>
                  {headline.split("1goli")[1]}
                </>
              ) : (
                headline
              )}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto pt-4">
              {description}
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
        </div>
      </div>
    </section>
  );
}