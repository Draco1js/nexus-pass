import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { Suspense } from "react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle2, Ticket, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "~/components/ui/skeleton";
import { CheckoutSuccessHandler } from "~/components/event/CheckoutSuccessHandler";
import { Id } from "~/convex/_generated/dataModel";

function SuccessPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
              <Skeleton className="h-12 w-48 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

async function SuccessPageContent({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<{ 
    customer_session_token?: string;
    ticketTypeId?: string;
    quantity?: string;
  }>;
}) {
  const params = await searchParams;
  const { customer_session_token, ticketTypeId, quantity } = params;
  
  // Preload event data
  const preloadedEvent = await preloadQuery(api.events.getEventBySlug, { slug });
  
  const hasCheckoutData = customer_session_token && ticketTypeId && quantity;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Card className="border-green-200 bg-white">
          <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
                  <div className="relative bg-green-500 rounded-full p-4">
                    <CheckCircle2 className="size-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Payment Successful!
                </h1>
                <p className="text-gray-600 text-lg">
                  Your tickets have been purchased successfully.
                </p>
              </div>

              {/* Checkout Processing */}
              {hasCheckoutData ? (
                <CheckoutSuccessHandler
                  customerSessionToken={customer_session_token}
                  ticketTypeId={ticketTypeId as Id<"ticketTypes">}
                  quantity={parseInt(quantity || "1", 10)}
                  eventSlug={slug}
                />
              ) : (
                <>
                  {/* Info Message */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-blue-800">
                      <strong>What&apos;s next?</strong>
                      <br />
                      Your tickets are being processed and will appear in your account shortly. 
                      You&apos;ll receive a confirmation email with all the details.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link href="/tickets">
                      <Button className="w-full sm:w-auto bg-tm-blue hover:bg-tm-blue-dark px-8">
                        <Ticket className="size-4 mr-2" />
                        View My Tickets
                        <ArrowRight className="size-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href={`/event/${slug}`}>
                      <Button variant="outline" className="w-full sm:w-auto px-8">
                        Back to Event
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {/* Debug Info (only in development) */}
              {process.env.NODE_ENV === "development" && customer_session_token && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-mono break-all">
                    Session Token: {customer_session_token}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ 
    customer_session_token?: string;
    ticketTypeId?: string;
    quantity?: string;
  }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <SuccessPageContent slug={slug} searchParams={Promise.resolve(resolvedSearchParams)} />
    </Suspense>
  );
}

