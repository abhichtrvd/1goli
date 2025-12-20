import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ShieldCheck, FlaskConical } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProductInfoTabsProps {
  product: any;
}

export function ProductInfoTabs({ product }: ProductInfoTabsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="benefits" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
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
        
        <TabsContent value="ingredients" className="mt-4">
          <div className="text-sm text-muted-foreground leading-relaxed">
            <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
              <FlaskConical className="h-4 w-4" /> Key Ingredients:
            </h4>
            <p>{product.ingredients || "Active ingredients as per homeopathic pharmacopoeia."}</p>
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
  );
}
