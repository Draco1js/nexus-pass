"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  BarChart3,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

type EventStatus = "on_sale" | "off_sale" | "sold_out" | "cancelled" | "postponed" | "rescheduled";

const statusColors: Record<EventStatus, string> = {
  on_sale: "bg-green-100 text-green-700",
  off_sale: "bg-gray-100 text-gray-700",
  sold_out: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
  postponed: "bg-yellow-100 text-yellow-700",
  rescheduled: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<EventStatus, string> = {
  on_sale: "On Sale",
  off_sale: "Off Sale",
  sold_out: "Sold Out",
  cancelled: "Cancelled",
  postponed: "Postponed",
  rescheduled: "Rescheduled",
};

export default function ArtistEventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");

  const events = useQuery(
    api.artists.getArtistEvents,
    { status: statusFilter === "all" ? undefined : statusFilter }
  );

  const isLoading = events === undefined;

  const filteredEvents = events?.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500">Manage your concerts and shows</p>
        </div>
        <Link href="/artist-dashboard/events/new">
          <Button className="bg-[#0A23F0] hover:bg-[#0A23F0]/90 text-white">
            <Plus className="size-4 mr-2" />
            Create Event
          </Button>
        </Link>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              {statusFilter === "all" ? "All Status" : statusLabels[statusFilter]}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                  statusFilter === "all" ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                All Status
              </button>
              {(Object.keys(statusLabels) as EventStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                    statusFilter === status ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first event to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href="/artist-dashboard/events/new">
                <Button className="bg-[#0A23F0] hover:bg-[#0A23F0]/90">
                  <Plus className="size-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents?.map((event) => (
            <Card key={event._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Date Badge */}
                  <div className="shrink-0">
                    <div className="w-20 h-20 bg-linear-to-br from-tm-blue to-purple-600 rounded-xl flex flex-col items-center justify-center text-white">
                      <span className="text-xs font-medium uppercase">
                        {new Date(event.startTime).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-2xl font-bold">
                        {new Date(event.startTime).getDate()}
                      </span>
                      <span className="text-xs">
                        {new Date(event.startTime).getFullYear()}
                      </span>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {formatTime(event.startTime)}
                          </span>
                          {event.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {event.venue.name}, {event.venue.city}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          statusColors[event.status as EventStatus]
                        }`}
                      >
                        {statusLabels[event.status as EventStatus]}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500">Tickets Sold</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {event.ticketsSold || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Revenue</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(event.revenue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ticket Types</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {event.ticketTypesCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                    <Link href={`/event/${event.slug}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Eye className="size-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </Link>
                    <Link href={`/artist-dashboard/events/${event._id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Edit className="size-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </Link>
                    <Link href={`/artist-dashboard/events/${event._id}/analytics`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <BarChart3 className="size-4" />
                        <span className="hidden sm:inline">Analytics</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

