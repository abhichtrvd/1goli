import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ProductVariantsProps {
  potenciesInput: string;
  setPotenciesInput: (value: string) => void;
  formsInput: string;
  setFormsInput: (value: string) => void;
}

export function ProductVariants({
  potenciesInput,
  setPotenciesInput,
  formsInput,
  setFormsInput
}: ProductVariantsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="potencies">Potencies</Label>
        <Input 
          id="potencies" 
          name="potencies" 
          required 
          value={potenciesInput}
          onChange={(e) => setPotenciesInput(e.target.value)}
          placeholder="30C, 200C, 1M" 
        />
        <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
          {potenciesInput.split(",").map((s: string) => s.trim()).filter(Boolean).map((tag: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forms">Forms</Label>
        <Input 
          id="forms" 
          name="forms" 
          required 
          value={formsInput}
          onChange={(e) => setFormsInput(e.target.value)}
          placeholder="Dilution, Globules" 
        />
        <div className="flex flex-wrap gap-1 mt-2 min-h-[24px]">
          {formsInput.split(",").map((s: string) => s.trim()).filter(Boolean).map((tag: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
