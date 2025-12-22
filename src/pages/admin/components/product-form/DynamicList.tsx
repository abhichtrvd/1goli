import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface DynamicListProps {
  items: string[];
  setItems: (items: string[]) => void;
  placeholder?: string;
  addButtonLabel?: string;
  emptyMessage?: string;
}

export function DynamicList({
  items,
  setItems,
  placeholder = "Enter item...",
  addButtonLabel = "Add Item",
  emptyMessage
}: DynamicListProps) {
  
  const addItem = () => {
    setItems([...items, ""]);
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.length === 0 && emptyMessage && (
        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input 
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => removeItem(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> {addButtonLabel}
      </Button>
    </div>
  );
}