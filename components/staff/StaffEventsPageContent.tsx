"use client";

import { useState } from "react";
import { Preloaded, useMutation, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import {
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";

type EventsQuery = typeof api.staff.getEvents;

interface StaffEventsPageContentProps {
  preloadedEvents: Preloaded<EventsQuery>;
}

export function StaffEventsPageContent({
  preloadedEvents,
}: StaffEventsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  const events = usePreloadedQuery(preloadedEvents);
  const updateEventStatus = useMutation(api.staff.updateEventStatus);
  const toggleFeatured = useMutation(api.staff.toggleEventFeatured);
  const revokeTicket = useMutation(api.staff.revokeTicket);
  const getAllTicketsQuery = useQuery(api.staff.getAllTickets, {});

  const filteredEvents = events?.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === undefined || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedEventData = filteredEvents?.find((e) => e._id === selectedEvent);

  const handleStatusUpdate = async (
    eventId: Id<"events">,
    status: string,
    reason?: string
  ) => {
    try {
      await updateEventStatus({
        eventId,
        status: status as any,
        reason,
      });
      toast.success("Event status updated");
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Failed to update event status");
    }
  };

  const handleToggleFeatured = async (
    eventId: Id<"events">,
    featured: boolean
  ) => {
    try {
      await toggleFeatured({ eventId, featured });
      toast.success(featured ? "Event featured" : "Event unfeatured");
    } catch (error) {
      toast.error("Failed to update featured status");
    }
  };

  const handleOpenEvent = (eventId: string) => {
    setSelectedEvent(eventId);
    // Filter tickets for this event
    if (getAllTicketsQuery) {
      const eventTicketsFiltered = getAllTicketsQuery.filter(
        (t: any) => t.event?._id === eventId && t.status !== "revoked"
      );
      setTickets(eventTicketsFiltered);
    }
  };

  const handleRevokeTicket = async () => {
    if (!revokeReason.trim()) {
      toast.error("Please provide a reason for revocation");
      return;
    }
    if (!selectedTicketId) return;

    try {
      await revokeTicket({
        ticketId: selectedTicketId as Id<"tickets">,
        reason: revokeReason,
      });
      toast.success("Ticket revoked successfully");
      setRevokeReason("");
      setSelectedTicketId(null);
      setShowRevokeDialog(false);
      // Reload tickets
      if (selectedEvent && getAllTicketsQuery) {
        const eventTicketsFiltered = getAllTicketsQuery.filter(
          (t: any) => t.event?._id === selectedEvent && t.status !== "revoked"
        );
        setTickets(eventTicketsFiltered);
      }
    } catch (error) {
      toast.error("Failed to revoke ticket");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColors: Record<string, string> = {
    on_sale: "bg-green-100 text-green-700",
    off_sale: "bg-gray-100 text-gray-700",
    sold_out: "bg-red-100 text-red-700",
    cancelled: "bg-red-100 text-red-700",
    postponed: "bg-yellow-100 text-yellow-700",
    rescheduled: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
        <p className="text-gray-500">Moderate and manage platform events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={statusFilter === undefined ? "default" : "outline"}
            onClick={() => setStatusFilter(undefined)}
            size="sm"
            className={
              statusFilter === undefined ? "bg-orange-500 hover:bg-orange-600" : ""
            }
          >
            All
          </Button>
          {["on_sale", "off_sale", "sold_out", "cancelled"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              size="sm"
              className={
                statusFilter === status ? "bg-orange-500 hover:bg-orange-600" : ""
              }
            >
              {status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter
                ? "Try adjusting your filters"
                : "No events have been created yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents?.map((event) => (
            <Card
              key={event._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedEvent(event._id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {event.title}
                      </h3>
                      {event.isFeatured && (
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{event.venue?.name || "Unknown venue"}</span>
                      <span>{formatDate(event.startTime)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[event.status] || statusColors.off_sale
                        }`}
                      >
                        {event.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEvent(event._id);
                    }}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Event</DialogTitle>
            <DialogDescription>
              Update event status and moderation settings
            </DialogDescription>
          </DialogHeader>

          {selectedEventData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedEventData.title}
                </h2>
                <p className="text-gray-500">
                  {selectedEventData.venue?.name} • {formatDate(selectedEventData.startTime)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "on_sale",
                      "off_sale",
                      "sold_out",
                      "cancelled",
                      "postponed",
                      "rescheduled",
                    ].map((status) => (
                      <Button
                        key={status}
                        variant={
                          selectedEventData.status === status
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            selectedEventData._id as Id<"events">,
                            status
                          )
                        }
                        className={
                          selectedEventData.status === status
                            ? "bg-orange-500 hover:bg-orange-600"
                            : ""
                        }
                        size="sm"
                      >
                        {status.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Featured Status
                  </label>
                  <Button
                    variant={selectedEventData.isFeatured ? "default" : "outline"}
                    onClick={() =>
                      handleToggleFeatured(
                        selectedEventData._id as Id<"events">,
                        !selectedEventData.isFeatured
                      )
                    }
                    className={
                      selectedEventData.isFeatured
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : ""
                    }
                  >
                    {selectedEventData.isFeatured ? (
                      <>
                        <StarOff className="size-4 mr-2" />
                        Remove from Featured
                      </>
                    ) : (
                      <>
                        <Star className="size-4 mr-2" />
                        Feature Event
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Ticket Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Ticket</DialogTitle>
            <DialogDescription>
              Please provide a reason for revoking this ticket. This reason will be shown to the ticket holder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reason *
              </label>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter the reason for revoking this ticket..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeDialog(false);
                setRevokeReason("");
                setSelectedTicketId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevokeTicket}
              className="bg-red-600 hover:bg-red-700"
              disabled={!revokeReason.trim()}
            >
              Revoke Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

