import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductBasicInfoProps {
  initialData?: any;
}

export function ProductBasicInfo({ initialData }: ProductBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="e.g. Arnica Montana" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Base Price (₹)</Label>
          <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" required defaultValue={initialData?.basePrice} placeholder="1299" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={initialData?.category || "Classical"}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Classical">Classical</SelectItem>
              <SelectItem value="Patent">Patent</SelectItem>
              <SelectItem value="Biochemic">Biochemic</SelectItem>
              <SelectItem value="Personal Care">Personal Care</SelectItem>
              <SelectItem value="Mother Tincture">Mother Tincture</SelectItem>
              <SelectItem value="Bach Flower">Bach Flower</SelectItem>
              <SelectItem value="Bio-Combinations">Bio-Combinations</SelectItem>
              <SelectItem value="Triturations">Triturations</SelectItem>
              <SelectItem value="Drops">Drops</SelectItem>
              <SelectItem value="Syrups">Syrups</SelectItem>
              <SelectItem value="Ointments">Ointments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Select name="availability" defaultValue={initialData?.availability || "in_stock"}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={initialData?.description} placeholder="Product description..." />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="stock">Stock Quantity</Label>
        <Input id="stock" name="stock" type="number" min="0" required defaultValue={initialData?.stock || 0} placeholder="100" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Input id="brand" name="brand" defaultValue={initialData?.brand} placeholder="e.g. Dr. Reckeweg" />
      </div>
    </div>
  );
}