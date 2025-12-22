import { Label } from "@/components/ui/label";
import { TagInput } from "./TagInput";

interface ProductVariantsProps {
  potencies: string[];
  setPotencies: (value: string[]) => void;
  forms: string[];
  setForms: (value: string[]) => void;
}

export function ProductVariants({
  potencies,
  setPotencies,
  forms,
  setForms
}: ProductVariantsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="potencies">Potencies</Label>
        <TagInput 
          tags={potencies}
          setTags={setPotencies}
          placeholder="30C, 200C, 1M" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="forms">Forms</Label>
        <TagInput 
          tags={forms}
          setTags={setForms}
          placeholder="Dilution, Globules" 
        />
      </div>
    </div>
  );
}