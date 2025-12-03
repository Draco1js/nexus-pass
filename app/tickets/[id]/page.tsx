"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import {
  ArrowLeft,
  Ticket,
  Calendar,
  MapPin,
  Clock,
  User,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { QRCodeDisplay } from "~/components/tickets/QRCodeDisplay";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as Id<"tickets">;

  const ticket = useQuery(api.tickets.getTicket, { ticketId });

  const isLoading = ticket === undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="size-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ticket Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            This ticket doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button variant="outline" onClick={() => router.push("/tickets")}>
            Back to My Tickets
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isUpcoming = ticket.event.startTime > Date.now();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/tickets")}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to My Tickets
        </Button>

        {/* Ticket Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header with Event Image */}
          <div className="relative h-48 bg-linear-to-br from-tm-blue to-purple-600">
            {ticket.event.images?.[0] && (
              <img
                src={ticket.event.images[0]}
                alt={ticket.event.title}
                className="w-full h-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-2xl font-bold">{ticket.event.title}</h1>
              {ticket.artist && (
                <p className="text-white/80 mt-1">{ticket.artist.name}</p>
              )}
            </div>
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  ticket.status === "valid"
                    ? "bg-green-500 text-white"
                    : ticket.status === "used"
                    ? "bg-gray-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {ticket.status === "valid"
                  ? "Valid"
                  : ticket.status === "used"
                  ? "Used"
                  : ticket.status}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="size-10 bg-[#0A23F0]/10 rounded-lg flex items-center justify-center">
                  <Calendar className="size-5 text-[#0A23F0]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(ticket.event.startTime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-10 bg-[#0A23F0]/10 rounded-lg flex items-center justify-center">
                  <Clock className="size-5 text-[#0A23F0]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(ticket.event.startTime)}</p>
                  {ticket.event.doorTime && (
                    <p className="text-xs text-gray-500">
                      Doors: {formatTime(ticket.event.doorTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {ticket.venue && (
              <div className="flex items-start gap-3 mt-4">
                <div className="size-10 bg-[#0A23F0]/10 rounded-lg flex items-center justify-center">
                  <MapPin className="size-5 text-[#0A23F0]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-medium">{ticket.venue.name}</p>
                  <p className="text-sm text-gray-500">
                    {ticket.venue.address}, {ticket.venue.city}
                    {ticket.venue.state ? `, ${ticket.venue.state}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Ticket Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ticket.ticketType && (
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{ticket.ticketType.name}</p>
                </div>
              )}
              {ticket.section && (
                <div>
                  <p className="text-sm text-gray-500">Section</p>
                  <p className="font-medium">{ticket.section}</p>
                </div>
              )}
              {ticket.row && (
                <div>
                  <p className="text-sm text-gray-500">Row</p>
                  <p className="font-medium">{ticket.row}</p>
                </div>
              )}
              {ticket.seatNumber && (
                <div>
                  <p className="text-sm text-gray-500">Seat</p>
                  <p className="font-medium">{ticket.seatNumber}</p>
                </div>
              )}
            </div>

            {ticket.ticketType?.benefits && ticket.ticketType.benefits.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Benefits</p>
                <ul className="space-y-1">
                  {ticket.ticketType.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="size-4 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {ticket.status === "revoked" ? (
            <div className="p-6 bg-red-50">
              <div className="text-center">
                <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2 text-red-900">Ticket Revoked</h2>
                <p className="text-sm text-red-700 mb-4">
                  This ticket has been revoked and is no longer valid for entry.
                </p>
                {ticket.revocationReason && (
                  <div className="bg-white p-4 rounded-lg border border-red-200 max-w-md mx-auto">
                    <p className="text-sm font-medium text-red-900 mb-2">Reason:</p>
                    <p className="text-sm text-red-700">{ticket.revocationReason}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
          <div className="p-6 bg-gray-50">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Your Ticket</h2>
              <p className="text-sm text-gray-500 mb-6">
                Show this QR code at the venue entrance
              </p>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-xl inline-block shadow-sm">
                <QRCodeDisplay value={ticket.qrCode} size={200} />
              </div>

              <p className="mt-4 text-sm font-mono text-gray-600">
                {ticket.ticketNumber}
              </p>
            </div>
          </div>
          )}

          {/* Order Info */}
          <div className="p-6 bg-gray-100 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Order #{ticket.order.orderNumber}</span>
              <span>Issued {formatDate(ticket.issuedAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {ticket.status !== "revoked" && (
        <div className="flex gap-4 mt-6">
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => {
              // Generate and download PDF
              const printWindow = window.open("", "_blank");
              if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Ticket - ${ticket.ticketNumber}</title>
                      <style>
                        @media print {
                          @page { margin: 0; size: A4; }
                        }
                        body {
                          font-family: Arial, sans-serif;
                          padding: 40px;
                          max-width: 800px;
                          margin: 0 auto;
                        }
                        .header {
                          text-align: center;
                          border-bottom: 3px solid #0A23F0;
                          padding-bottom: 20px;
                          margin-bottom: 30px;
                        }
                        .event-title {
                          font-size: 28px;
                          font-weight: bold;
                          color: #0A23F0;
                          margin-bottom: 10px;
                        }
                        .ticket-number {
                          font-size: 14px;
                          color: #666;
                          margin-top: 10px;
                        }
                        .details {
                          display: grid;
                          grid-template-columns: 1fr 1fr;
                          gap: 20px;
                          margin: 30px 0;
                        }
                        .detail-item {
                          margin-bottom: 15px;
                        }
                        .detail-label {
                          font-size: 12px;
                          color: #666;
                          text-transform: uppercase;
                          margin-bottom: 5px;
                        }
                        .detail-value {
                          font-size: 16px;
                          font-weight: 600;
                          color: #000;
                        }
                        .qr-section {
                          text-align: center;
                          margin: 40px 0;
                          padding: 30px;
                          border: 2px dashed #ddd;
                          border-radius: 10px;
                        }
                        .qr-code {
                          margin: 20px auto;
                        }
                        .footer {
                          margin-top: 40px;
                          padding-top: 20px;
                          border-top: 1px solid #ddd;
                          font-size: 12px;
                          color: #666;
                          text-align: center;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="event-title">${ticket.event.title}</div>
                        ${ticket.artist ? `<div style="font-size: 18px; color: #666; margin-top: 5px;">${ticket.artist.name}</div>` : ""}
                        <div class="ticket-number">Ticket #${ticket.ticketNumber}</div>
                      </div>
                      
                      <div class="details">
                        <div class="detail-item">
                          <div class="detail-label">Date</div>
                          <div class="detail-value">${formatDate(ticket.event.startTime)}</div>
                        </div>
                        <div class="detail-item">
                          <div class="detail-label">Time</div>
                          <div class="detail-value">${formatTime(ticket.event.startTime)}</div>
                        </div>
                        ${ticket.venue ? `
                        <div class="detail-item">
                          <div class="detail-label">Venue</div>
                          <div class="detail-value">${ticket.venue.name}</div>
                        </div>
                        <div class="detail-item">
                          <div class="detail-label">Location</div>
                          <div class="detail-value">${ticket.venue.city}${ticket.venue.state ? ", " + ticket.venue.state : ""}</div>
                        </div>
                        ` : ""}
                        ${ticket.ticketType ? `
                        <div class="detail-item">
                          <div class="detail-label">Ticket Type</div>
                          <div class="detail-value">${ticket.ticketType.name}</div>
                        </div>
                        ` : ""}
                        ${ticket.section ? `
                        <div class="detail-item">
                          <div class="detail-label">Section</div>
                          <div class="detail-value">${ticket.section}</div>
                        </div>
                        ` : ""}
                        ${ticket.row ? `
                        <div class="detail-item">
                          <div class="detail-label">Row</div>
                          <div class="detail-value">${ticket.row}</div>
                        </div>
                        ` : ""}
                        ${ticket.seatNumber ? `
                        <div class="detail-item">
                          <div class="detail-label">Seat</div>
                          <div class="detail-value">${ticket.seatNumber}</div>
                        </div>
                        ` : ""}
                      </div>
                      
                      <div class="qr-section">
                        <h3 style="margin-bottom: 20px;">Your Ticket QR Code</h3>
                        <div class="qr-code">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qrCode)}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #ddd; padding: 10px; background: white;" />
                        </div>
                        <div style="margin-top: 15px; font-family: monospace; font-size: 12px; color: #666;">
                          ${ticket.ticketNumber}
                        </div>
                        <div style="margin-top: 10px; font-size: 11px; color: #999;">
                          QR Code: ${ticket.qrCode}
                        </div>
                      </div>
                      
                      <div class="footer">
                        <p>Order #${ticket.order.orderNumber}</p>
                        <p>Issued: ${formatDate(ticket.issuedAt)}</p>
                        <p style="margin-top: 15px;">Please arrive at least 30 minutes before the event starts.</p>
                        <p>Have your ticket QR code ready for scanning at the venue entrance.</p>
                      </div>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                setTimeout(() => {
                  printWindow.print();
                }, 250);
              }
            }}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Ticket for ${ticket.event.title}`,
                  text: `Check out my ticket for ${ticket.event.title}`,
                  url: window.location.href,
                });
              } else {
                // Fallback: copy link to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert("Ticket link copied to clipboard!");
              }
            }}
          >
            <Share2 className="size-4" />
            Share
          </Button>
        </div>
        )}

        {/* Important Info */}
        {isUpcoming && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Important Information
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Please arrive at least 30 minutes before the event starts</li>
                <li>• Have your ticket QR code ready for scanning</li>
                <li>• A valid photo ID may be required for entry</li>
                {ticket.event.ageRestriction && (
                  <li>• Age restriction: {ticket.event.ageRestriction}</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

