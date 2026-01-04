import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail } from "lucide-react";

interface OrderCustomerProps {
  userName: string;
  userId: string;
  userContact: string;
}

export function OrderCustomer({ userName, userId, userContact }: OrderCustomerProps) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="font-medium truncate" title={userName}>{userName}</div>
            <div className="text-xs text-muted-foreground">ID: {userId.slice(-6)}</div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground break-all">
            <Mail className="w-4 h-4 shrink-0" /> {userContact}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
