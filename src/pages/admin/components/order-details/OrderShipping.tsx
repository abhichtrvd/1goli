import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";

interface OrderShippingProps {
  shippingDetails?: any;
  shippingAddress: string;
}

export function OrderShipping({ shippingDetails, shippingAddress }: OrderShippingProps) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Shipping Details
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        {shippingDetails ? (
          <>
            <div className="font-medium text-base">{shippingDetails.fullName}</div>
            <div className="text-muted-foreground leading-relaxed">
              {shippingDetails.addressLine1}<br />
              {shippingDetails.addressLine2 && <>{shippingDetails.addressLine2}<br /></>}
              {shippingDetails.city}, {shippingDetails.state} {shippingDetails.zipCode}
            </div>
            <div className="flex items-center gap-2 pt-2 text-muted-foreground border-t mt-2">
              <Phone className="w-3 h-3" /> {shippingDetails.phone}
            </div>
          </>
        ) : (
          <p className="whitespace-pre-wrap text-muted-foreground">{shippingAddress}</p>
        )}
      </CardContent>
    </Card>
  );
}
