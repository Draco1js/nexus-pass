"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

interface CheckoutSuccessHandlerProps {
  customerSessionToken: string;
  ticketTypeId: Id<"ticketTypes">;
  quantity: number;
  eventSlug: string;
}

export function CheckoutSuccessHandler({
  customerSessionToken,
  ticketTypeId,
  quantity,
  eventSlug,
}: CheckoutSuccessHandlerProps) {
  const router = useRouter();
  const processCheckout = useAction(api.polar.processCheckoutCompletion);
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState<string | null>(null);
  const [ticketIds, setTicketIds] = useState<string[]>([]);

  useEffect(() => {
    async function handleCheckout() {
      try {
        const result = await processCheckout({
          customerSessionToken,
          ticketTypeId,
          quantity,
        });
        
        setTicketIds(result.ticketIds);
        setStatus("success");
        
        // Redirect to tickets page after a short delay
        setTimeout(() => {
          router.push("/tickets");
        }, 2000);
      } catch (err) {
        console.error("Checkout processing error:", err);
        setError(err instanceof Error ? err.message : "Failed to process checkout");
        setStatus("error");
      }
    }

    if (customerSessionToken && ticketTypeId) {
      handleCheckout();
    }
  }, [customerSessionToken, ticketTypeId, quantity, processCheckout, router]);

  if (status === "processing") {
    return (
      <div className="text-center py-8">
        <Loader2 className="size-8 text-tm-blue animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Processing your purchase...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-8">
        <AlertCircle className="size-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2">Error processing checkout</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-green-600 mb-2">Tickets created successfully!</p>
      <p className="text-sm text-gray-500">Redirecting to your tickets...</p>
    </div>
  );
}

