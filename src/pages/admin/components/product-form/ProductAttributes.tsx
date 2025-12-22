import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./TagInput";
import { DynamicList } from "./DynamicList";

interface ProductAttributesProps {
  tags: string[];
  setTags: (value: string[]) => void;
  keyBenefits: string[];
  setKeyBenefits: (value: string[]) => void;
  initialData?: any;
}

export function ProductAttributes({
  tags,
  setTags,
  keyBenefits,
  setKeyBenefits,
  initialData
}: ProductAttributesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="symptomsTags">Symptoms / Tags</Label>
        <TagInput 
          tags={tags}
          setTags={setTags}
          placeholder="fever, pain, flu" 
        />
      </div>

      <div className="space-y-2">
        <Label>Key Benefits</Label>
        <DynamicList 
          items={keyBenefits}
          setItems={setKeyBenefits}
          placeholder="e.g. Reduces inflammation"
          addButtonLabel="Add Benefit"
          emptyMessage="No key benefits added yet."
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