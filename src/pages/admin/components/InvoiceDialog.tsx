import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Download, FileText, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { generateInvoice, printInvoice, downloadInvoice } from "../utils/invoiceGenerator";

interface InvoiceDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ order, open, onOpenChange }: InvoiceDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch site settings for invoice generation
  const settings = useQuery(api.settings.getSettings);
  const generateInvoiceNumber = useMutation(api.orders.generateInvoice);

  if (!order) return null;

  const hasInvoiceNumber = !!order.invoiceNumber;

  // Generate invoice HTML when dialog opens
  const handleGenerateInvoice = async () => {
    try {
      setIsGenerating(true);

      // If invoice number doesn't exist, generate it
      let invoiceNumber = order.invoiceNumber;
      if (!invoiceNumber) {
        invoiceNumber = await generateInvoiceNumber({ orderId: order._id as Id<"orders"> });
        // Update the order object with the new invoice number
        order.invoiceNumber = invoiceNumber;
        toast.success(`Invoice number generated: ${invoiceNumber}`);
      }

      // Generate the invoice HTML
      const html = generateInvoice(order, {
        siteName: settings?.siteName,
        supportEmail: settings?.supportEmail,
        supportPhone: settings?.supportPhone,
        address: settings?.address,
        taxEnabled: settings?.taxEnabled,
        taxName: settings?.taxName,
        taxRate: settings?.taxRate,
        taxNumber: settings?.taxNumber,
        currency: settings?.currency,
        currencySymbol: settings?.currencySymbol,
      });

      setInvoiceHtml(html);
      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle print
  const handlePrint = async () => {
    if (!invoiceHtml) {
      await handleGenerateInvoice();
      return;
    }

    try {
      setIsPrinting(true);
      printInvoice(invoiceHtml);
      toast.success("Invoice opened for printing");
    } catch (error: any) {
      console.error("Error printing invoice:", error);
      toast.error(error.message || "Failed to open print dialog");
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!invoiceHtml) {
      await handleGenerateInvoice();
      return;
    }

    try {
      setIsDownloading(true);
      const invoiceNumber = order.invoiceNumber || `INV-${order._id.slice(-8).toUpperCase()}`;
      downloadInvoice(invoiceHtml, invoiceNumber);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-generate invoice when dialog opens if settings are loaded
  useState(() => {
    if (open && settings && !invoiceHtml) {
      handleGenerateInvoice();
    }
  });

  const orderId = order._id ? order._id.slice(-8).toUpperCase() : "N/A";
  const orderDate = order._creationTime
    ? new Date(order._creationTime).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Invoice Preview</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Order #{orderId} • {orderDate}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!invoiceHtml || isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">
                {isGenerating ? "Generating invoice..." : "Loading..."}
              </p>
              {!hasInvoiceNumber && (
                <p className="text-xs text-muted-foreground max-w-md text-center">
                  No invoice number found. A new invoice number will be generated automatically.
                </p>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto border rounded-lg">
              <iframe
                srcDoc={invoiceHtml}
                title="Invoice Preview"
                className="w-full h-full min-h-[500px]"
                style={{ border: 'none' }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            {hasInvoiceNumber ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">
                  Invoice No: <span className="font-semibold text-foreground">{order.invoiceNumber}</span>
                </span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-amber-600" />
                <span className="text-muted-foreground">
                  Invoice number will be generated
                </span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {!hasInvoiceNumber && (
              <Button
                variant="outline"
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice No.
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!invoiceHtml || isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>

            <Button
              onClick={handlePrint}
              disabled={!invoiceHtml || isPrinting}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
