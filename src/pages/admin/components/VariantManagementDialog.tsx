import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VariantManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  potencies: string[];
  forms: string[];
  packingSizes: string[];
  onSave: (potencies: string[], forms: string[], packingSizes: string[]) => void;
}

export function VariantManagementDialog({
  open,
  onOpenChange,
  potencies: initialPotencies,
  forms: initialForms,
  packingSizes: initialPackingSizes,
  onSave,
}: VariantManagementDialogProps) {
  const [potencies, setPotencies] = useState<string[]>(initialPotencies);
  const [forms, setForms] = useState<string[]>(initialForms);
  const [packingSizes, setPackingSizes] = useState<string[]>(initialPackingSizes);

  const [newPotency, setNewPotency] = useState("");
  const [newForm, setNewForm] = useState("");
  const [newPackingSize, setNewPackingSize] = useState("");

  const addPotency = () => {
    if (newPotency && !potencies.includes(newPotency)) {
      setPotencies([...potencies, newPotency]);
      setNewPotency("");
    }
  };

  const addForm = () => {
    if (newForm && !forms.includes(newForm)) {
      setForms([...forms, newForm]);
      setNewForm("");
    }
  };

  const addPackingSize = () => {
    if (newPackingSize && !packingSizes.includes(newPackingSize)) {
      setPackingSizes([...packingSizes, newPackingSize]);
      setNewPackingSize("");
    }
  };

  const removePotency = (potency: string) => {
    setPotencies(potencies.filter((p) => p !== potency));
  };

  const removeForm = (form: string) => {
    setForms(forms.filter((f) => f !== form));
  };

  const removePackingSize = (size: string) => {
    setPackingSizes(packingSizes.filter((s) => s !== size));
  };

  const handleSave = () => {
    onSave(potencies, forms, packingSizes);
    onOpenChange(false);
  };

  // Generate variant combinations for preview
  const variantCombinations = potencies.flatMap((potency) =>
    forms.flatMap((form) =>
      packingSizes.map((size) => ({
        potency,
        form,
        size,
      }))
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variant Management</DialogTitle>
          <DialogDescription>
            Manage product potencies, forms, and packing sizes. Changes will generate all possible variant combinations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Potencies */}
          <div className="space-y-2">
            <Label>Potencies</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 30C"
                value={newPotency}
                onChange={(e) => setNewPotency(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPotency())}
              />
              <Button type="button" size="sm" onClick={addPotency}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {potencies.map((potency) => (
                <Badge key={potency} variant="secondary">
                  {potency}
                  <button
                    onClick={() => removePotency(potency)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Forms */}
          <div className="space-y-2">
            <Label>Forms</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Dilution"
                value={newForm}
                onChange={(e) => setNewForm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addForm())}
              />
              <Button type="button" size="sm" onClick={addForm}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {forms.map((form) => (
                <Badge key={form} variant="secondary">
                  {form}
                  <button
                    onClick={() => removeForm(form)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Packing Sizes */}
          <div className="space-y-2">
            <Label>Packing Sizes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 30ml"
                value={newPackingSize}
                onChange={(e) => setNewPackingSize(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPackingSize())}
              />
              <Button type="button" size="sm" onClick={addPackingSize}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {packingSizes.map((size) => (
                <Badge key={size} variant="secondary">
                  {size}
                  <button
                    onClick={() => removePackingSize(size)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Variant Grid Preview */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <Label>Variant Combinations Preview</Label>
            <span className="text-sm text-muted-foreground">
              {variantCombinations.length} total variants
            </span>
          </div>
          <div className="border rounded-lg max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Potency</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Packing Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantCombinations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No variants. Add potencies, forms, and packing sizes above.
                    </TableCell>
                  </TableRow>
                ) : (
                  variantCombinations.map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell>{variant.potency}</TableCell>
                      <TableCell>{variant.form}</TableCell>
                      <TableCell>{variant.size}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Variants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
