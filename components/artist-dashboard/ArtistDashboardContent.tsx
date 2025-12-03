"use client";

import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

interface ArtistDashboardContentProps {
  artistData: FunctionReturnType<typeof api.artists.getArtistDashboardData> | undefined;
}

export function ArtistDashboardContent({ artistData }: ArtistDashboardContentProps) {
  const isLoading = artistData === undefined;

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
      <div className="space-y-8">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Events Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!artistData?.artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-100 rounded-full p-6 mb-6">
          <Users className="size-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No Artist Profile Found
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Your account is not linked to an artist profile yet. Please contact
          support to set up your artist dashboard.
        </p>
        <Link href="/">
          <Button variant="outline">Return to Home</Button>
        </Link>
      </div>
    );
  }

  const { artist, stats, upcomingEvents, recentOrders } = artistData;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-tm-blue to-purple-600 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Welcome back, {artist.name}!
        </h1>
        <p className="text-white/80">
          Here&apos;s what&apos;s happening with your events and sales.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="size-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <TrendingUp className="size-4 text-green-600" />
              <span className="text-gray-500">Total revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalEvents}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Calendar className="size-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <ArrowUpRight className="size-4 text-blue-600" />
              <span className="text-blue-600 font-medium">
                {stats.upcomingEvents} upcoming
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.ticketsSold}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Users className="size-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <ArrowUpRight className="size-4 text-purple-600" />
              <span className="text-purple-600 font-medium">
                {stats.ticketsSold} total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgAttendance}%
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Users className="size-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <ArrowDownRight className="size-4 text-gray-400" />
              <span className="text-gray-500">Average rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Link href="/artist-dashboard/events">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.slice(0, 5).map((event: typeof upcomingEvents[0]) => (
                <Link
                  key={event._id}
                  href={`/artist-dashboard/events/${event._id}`}
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {new Date(event.startTime).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-4" />
                          {formatDate(event.startTime)}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-4" />
                            {event.venue.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(event.revenue || 0)}
                      </p>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {recentOrders && recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order: typeof recentOrders[0]) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 rounded-full p-2">
                      <Users className="size-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 justify-end">
                      <Clock className="size-3" />
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

