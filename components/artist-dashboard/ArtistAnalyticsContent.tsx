"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import {
  BarChart3,
  DollarSign,
  Ticket,
  TrendingUp,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { Button } from "~/components/ui/button";

interface ArtistAnalyticsContentProps {
  analytics: FunctionReturnType<typeof api.artists.getArtistAnalytics> | undefined;
}

export function ArtistAnalyticsContent({ analytics }: ArtistAnalyticsContentProps) {
  const isLoading = analytics === undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="size-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Analytics Available
        </h3>
        <p className="text-gray-500">
          Create events to start tracking analytics and sales data.
        </p>
        <Link href="/artist-dashboard/events/new" className="mt-4 inline-block">
          <Button>Create Your First Event</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Track your ticket sales and event performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
              </div>
              <div className="size-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="size-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalTicketsSold}
                </p>
              </div>
              <div className="size-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Ticket className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalEvents}
                </p>
              </div>
              <div className="size-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.averageAttendance}%
                </p>
              </div>
              <div className="size-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="size-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Event Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No events with sales data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.events.map((event) => (
                <div
                  key={event._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {event.venue?.name} • {formatDate(event.startTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tickets Sold</p>
                      <p className="font-semibold">{event.ticketsSold}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="font-semibold">{formatCurrency(event.revenue)}</p>
                    </div>
                    <Link href={`/artist-dashboard/events?event=${event._id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

