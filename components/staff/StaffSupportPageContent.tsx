"use client";

import { useState } from "react";
import { usePreloadedQuery, Preloaded } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import {
  MessageSquare,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
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
import { toast } from "sonner";
import Link from "next/link";

type SupportTicketsQuery = typeof api.staff.getSupportTickets;

interface StaffSupportPageContentProps {
  preloadedTickets: Preloaded<SupportTicketsQuery>;
}

export function StaffSupportPageContent({
  preloadedTickets,
}: StaffSupportPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const tickets = usePreloadedQuery(preloadedTickets);
  const updateTicketStatus = useMutation(api.staff.updateSupportTicketStatus);

  const filteredTickets = tickets?.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTicketData = filteredTickets?.find((t) => t._id === selectedTicket);

  const handleStatusUpdate = async (
    ticketId: Id<"supportTickets">,
    status: "open" | "in_progress" | "resolved" | "closed"
  ) => {
    try {
      await updateTicketStatus({ ticketId, status });
      toast.success("Ticket status updated");
      setSelectedTicket(null);
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500">Manage customer support requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
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
          {["open", "in_progress", "resolved", "closed"].map((status) => (
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

      {/* Tickets List */}
      {filteredTickets?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tickets found
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter
                ? "Try adjusting your filters"
                : "No support tickets have been created yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets?.map((ticket) => (
            <Card
              key={ticket._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket._id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[ticket.status] || statusColors.open
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        {ticket.userEmail}
                      </span>
                      {ticket.userPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {ticket.userPhone}
                        </span>
                      )}
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket._id);
                    }}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Support Ticket</DialogTitle>
            <DialogDescription>View and manage ticket details</DialogDescription>
          </DialogHeader>

          {selectedTicketData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTicketData.subject}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="size-4" />
                    {selectedTicketData.userEmail}
                  </span>
                  {selectedTicketData.userPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-4" />
                      {selectedTicketData.userPhone}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Message
                </label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedTicketData.message}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["open", "in_progress", "resolved", "closed"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={
                        selectedTicketData.status === status ? "default" : "outline"
                      }
                      onClick={() =>
                        handleStatusUpdate(
                          selectedTicketData._id as Id<"supportTickets">,
                          status
                        )
                      }
                      className={
                        selectedTicketData.status === status
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

