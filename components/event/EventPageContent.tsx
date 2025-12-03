"use client";

import { useState } from "react";
import { usePreloadedQuery } from "convex/react";
import { Preloaded } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { EventHeader } from "~/components/event/EventHeader";
import { SeatingChart } from "~/components/event/SeatingChart";
import { TicketSelectionPanel } from "~/components/event/TicketSelectionPanel";

interface EventPageContentProps {
  preloaded: Preloaded<typeof api.events.getEventBySlug>;
  preloadedTickets: Preloaded<typeof api.events.getAvailableTicketsBySlug>;
}

export function EventPageContent({ preloaded, preloadedTickets }: EventPageContentProps) {
  const event = usePreloadedQuery(preloaded);
  const tickets = usePreloadedQuery(preloadedTickets);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Ensure tickets is always an array
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <p className="text-gray-600">The event you&apos;re looking for doesn&apos;t exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if event is available for purchase
  const canPurchase = event.status === "on_sale";

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <EventHeader event={event} />
      
      {/* Main Content Area */}
      <div className="bg-gray-100">
        <div className="max-w-[1920px] mx-auto px-6 py-8">
          {/* Section Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Select Your Tickets</h2>
            {canPurchase ? (
            <p className="text-gray-600">Choose from available seating options below</p>
            ) : (
              <p className="text-gray-600">
                {event.status === "sold_out" && "This event is sold out"}
                {event.status === "off_sale" && "Tickets are not currently available for sale"}
                {event.status === "cancelled" && "This event has been cancelled"}
                {event.status === "postponed" && "This event has been postponed"}
                {event.status === "rescheduled" && "This event has been rescheduled"}
              </p>
            )}
          </div>
          
          {canPurchase ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
            {/* Seating Chart */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SeatingChart 
                  event={event} 
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                />
              </div>
            </div>
            
            {/* Ticket Selection Panel - Sticky */}
            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-4">
                <TicketSelectionPanel 
                  event={event} 
                  tickets={safeTickets}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                />
              </div>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-lg text-gray-600">
                Tickets are not available for purchase at this time.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

