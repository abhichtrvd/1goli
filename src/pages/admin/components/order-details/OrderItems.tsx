import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package } from "lucide-react";

interface OrderItemsProps {
  items: any[];
  total: number;
}

export function OrderItems({ items, total }: OrderItemsProps) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Order Items
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Product</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right pr-6">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any, idx: number) => (
              <TableRow key={idx} className="hover:bg-muted/30">
                <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.potency} • {item.form}
                  {item.packingSize && ` • ${item.packingSize}`}
                </TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right pr-6 font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={4} className="text-right font-medium">Subtotal</TableCell>
              <TableCell className="text-right pr-6 font-bold">₹{total.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
