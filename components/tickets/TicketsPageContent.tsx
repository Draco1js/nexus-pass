"use client";

import Link from "next/link";
import { Ticket, Calendar, MapPin, Clock, ChevronRight, QrCode, Download } from "lucide-react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

interface TicketsPageContentProps {
  tickets: FunctionReturnType<typeof api.tickets.getUserTickets> | undefined;
}

export function TicketsPageContent({ tickets }: TicketsPageContentProps) {
  const isLoading = tickets === undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Group tickets by status and date
  const now = Date.now();
  const validTickets = tickets?.filter((t) => t.status === "valid" && t.event);
  const revokedTickets = tickets?.filter((t) => t.status === "revoked" && t.event);
  
  const upcomingTickets = validTickets?.filter(
    (t) => t.event && t.event.startTime > now
  );
  const pastTickets = validTickets?.filter(
    (t) => t.event && t.event.startTime <= now
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-28 h-28 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Ticket className="size-8 text-tm-blue" />
            My Tickets
          </h1>
          <p className="text-gray-500 mt-1">View and manage your event tickets</p>
        </div>

        {tickets?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="size-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tickets yet
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                When you purchase tickets to events, they&apos;ll appear here for easy access.
              </p>
              <Link href="/">
                <Button className="bg-tm-blue hover:bg-tm-blue-dark px-8">
                  Browse Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Upcoming Tickets */}
            {upcomingTickets && upcomingTickets.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="size-2 bg-green-500 rounded-full animate-pulse" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Upcoming Events ({upcomingTickets.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {upcomingTickets.map((ticket) => (
                    <Link key={ticket._id} href={`/tickets/${ticket._id}`}>
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-l-4 border-l-tm-blue">
                        <CardContent className="p-0">
                          <div className="flex">
                            {/* Event Image */}
                            <div className="w-36 h-36 bg-linear-to-br from-tm-blue to-tm-blue-dark shrink-0 relative">
                              {ticket.event?.images?.[0] ? (
                                <img
                                  src={ticket.event.images[0]}
                                  alt={ticket.event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Ticket className="size-12 text-white/50" />
                                </div>
                              )}
                              {/* QR Code Indicator */}
                              <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-md p-1.5">
                                <QrCode className="size-5 text-gray-700" />
                              </div>
                            </div>

                            {/* Ticket Info */}
                            <div className="flex-1 p-5">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                                    {ticket.event?.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="size-4 text-tm-blue" />
                                      {ticket.event &&
                                        formatDate(ticket.event.startTime)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="size-4 text-tm-blue" />
                                      {ticket.event &&
                                        formatTime(ticket.event.startTime)}
                                    </span>
                                  </div>
                                  {ticket.venue && (
                                    <p className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                                      <MapPin className="size-4 text-tm-blue" />
                                      {ticket.venue.name}, {ticket.venue.city}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="size-6 text-gray-400" />
                              </div>

                              {/* Ticket Details */}
                              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md">
                                  <span className="text-xs text-gray-500 uppercase tracking-wide">Ticket</span>
                                  <span className="text-sm font-bold text-gray-900">
                                    #{ticket.ticketNumber}
                                  </span>
                                </div>
                                {ticket.section && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Sec</span>
                                    <span className="text-sm font-bold text-gray-900">
                                      {ticket.section}
                                    </span>
                                  </div>
                                )}
                                {ticket.row && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Row</span>
                                    <span className="text-sm font-bold text-gray-900">{ticket.row}</span>
                                  </div>
                                )}
                                {ticket.seatNumber && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Seat</span>
                                    <span className="text-sm font-bold text-gray-900">
                                      {ticket.seatNumber}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {ticket.status === "revoked" && ticket.revocationReason && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                  <p className="text-xs font-medium text-red-800 mb-1">
                                    Ticket Revoked
                                  </p>
                                  <p className="text-sm text-red-700">
                                    {ticket.revocationReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Revoked Tickets */}
            {revokedTickets && revokedTickets.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="size-2 bg-red-500 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Revoked Tickets ({revokedTickets.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {revokedTickets.map((ticket) => (
                    <Card key={ticket._id} className="opacity-75 border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                            <Ticket className="size-6 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-700 truncate">
                              {ticket.event?.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {ticket.event &&
                                formatDate(ticket.event.startTime)}
                            </p>
                            {ticket.revocationReason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs font-medium text-red-800 mb-1">
                                  Reason:
                                </p>
                                <p className="text-xs text-red-700">
                                  {ticket.revocationReason}
                                </p>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-100 text-red-700">
                            Revoked
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Past Tickets */}
            {pastTickets && pastTickets.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">
                  Past Events ({pastTickets.length})
                </h2>
                <div className="space-y-3">
                  {pastTickets.map((ticket) => (
                    <Link key={ticket._id} href={`/tickets/${ticket._id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-75 hover:opacity-100">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <Ticket className="size-6 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-700 truncate">
                                {ticket.event?.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {ticket.event &&
                                  formatDate(ticket.event.startTime)}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-medium px-3 py-1 rounded-full ${
                                ticket.status === "used"
                                  ? "bg-green-100 text-green-700"
                                  : ticket.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {ticket.status}
                            </span>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Download className="size-4 text-gray-400" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

