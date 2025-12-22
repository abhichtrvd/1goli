import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ProductAttributesProps {
  tagsInput: string;
  setTagsInput: (value: string) => void;
  initialData?: any;
}

export function ProductAttributes({
  tagsInput,
  setTagsInput,
  initialData
}: ProductAttributesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="symptomsTags">Tags</Label>
        <Input 
          id="symptomsTags" 
          name="symptomsTags" 
          required 
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="fever, pain, flu" 
        />
        <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
          {tagsInput.split(",").map((s: string) => s.trim()).filter(Boolean).map((tag: string, i: number) => (
            <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keyBenefits">Key Benefits (semicolon separated)</Label>
        <Textarea 
          id="keyBenefits" 
          name="keyBenefits" 
          defaultValue={initialData?.keyBenefits?.join("; ")} 
          placeholder="Benefit 1; Benefit 2; Benefit 3" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="directionsForUse">Directions For Use</Label>
        <Textarea 
          id="directionsForUse" 
          name="directionsForUse" 
          defaultValue={initialData?.directionsForUse} 
          placeholder="Take 5 drops..." 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="safetyInformation">Safety Information</Label>
        <Textarea 
          id="safetyInformation" 
          name="safetyInformation" 
          defaultValue={initialData?.safetyInformation} 
          placeholder="Keep out of reach of children..." 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea 
          id="ingredients" 
          name="ingredients" 
          defaultValue={initialData?.ingredients} 
          placeholder="Active ingredients list..." 
        />
      </div>
    </div>
  );
}
