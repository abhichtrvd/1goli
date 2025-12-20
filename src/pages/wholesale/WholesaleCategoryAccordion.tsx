import { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { WholesaleProductCard } from "./WholesaleProductCard";

interface WholesaleCategoryAccordionProps {
  category: string;
  brand: string;
  products: any[];
  quantities: Record<string, number>;
  selections: Record<string, { potency: string; packingSize: string }>;
  addingToCart: Record<string, boolean>;
  onQuantityChange: (productId: string, delta: number) => void;
  onSelectionChange: (productId: string, field: 'potency' | 'packingSize', value: string) => void;
  onAddToCart: (product: any, category: string) => void;
}

export function WholesaleCategoryAccordion({
  category,
  brand,
  products,
  quantities,
  selections,
  addingToCart,
  onQuantityChange,
  onSelectionChange,
  onAddToCart
}: WholesaleCategoryAccordionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const sectionKey = `${brand}-${category}`;

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <AccordionItem value={sectionKey} className="border-b-0 mb-2">
      <AccordionTrigger className="text-lg font-medium text-lime-700 hover:text-lime-800 hover:no-underline py-3">
        {category}
      </AccordionTrigger>
      <AccordionContent>
        <div className="mb-4 px-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${category}...`}
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3 mt-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No products found matching "{debouncedSearchQuery}" in {category}
            </div>
          ) : (
            filteredProducts.map((product: any) => (
              <WholesaleProductCard
                key={product._id}
                product={product}
                category={category}
                quantity={quantities[product._id] || 1}
                selection={selections[product._id] || {}}
                isAddingToCart={!!addingToCart[product._id]}
                onQuantityChange={(delta) => onQuantityChange(product._id, delta)}
                onSelectionChange={(field, value) => onSelectionChange(product._id, field, value)}
                onAddToCart={() => onAddToCart(product, category)}
              />
            ))
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
