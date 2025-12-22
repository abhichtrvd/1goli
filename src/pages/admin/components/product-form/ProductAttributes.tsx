import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "./TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

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
  
  const addBenefit = () => {
    setKeyBenefits([...keyBenefits, ""]);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...keyBenefits];
    newBenefits[index] = value;
    setKeyBenefits(newBenefits);
  };

  const removeBenefit = (index: number) => {
    setKeyBenefits(keyBenefits.filter((_, i) => i !== index));
  };

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
        <div className="space-y-2">
          {keyBenefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <Input 
                value={benefit}
                onChange={(e) => updateBenefit(index, e.target.value)}
                placeholder={`Benefit ${index + 1}`}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={() => removeBenefit(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addBenefit} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Benefit
          </Button>
        </div>
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