"use client";

import { api } from "~/convex/_generated/api";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Preloaded, usePreloadedQuery } from "convex/react";

type StatsQuery = typeof api.staff.getDashboardStats;

interface StaffDashboardContentProps {
  preloadedStats: Preloaded<StatsQuery>;
}

export function StaffDashboardContent({
  preloadedStats,
}: StaffDashboardContentProps) {
  const stats = usePreloadedQuery(preloadedStats);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-tm-navy to-purple-900 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Staff Dashboard</h1>
        <p className="text-white/80">
          Monitor platform activity and manage content moderation.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Venues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.pendingVenues || 0}
                </p>
              </div>
              <div className="size-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <MapPin className="size-6 text-yellow-600" />
              </div>
            </div>
            <Link href="/staff/venues">
              <Button variant="link" className="mt-2 p-0 h-auto text-orange-600">
                Review venues →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalEvents || 0}
                </p>
              </div>
              <div className="size-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="size-6 text-green-600" />
              </div>
            </div>
            <Link href="/staff/events">
              <Button variant="link" className="mt-2 p-0 h-auto text-orange-600">
                Manage events →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="size-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="size-6 text-purple-600" />
              </div>
            </div>
            <Link href="/staff/users">
              <Button variant="link" className="mt-2 p-0 h-auto text-orange-600">
                View users →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Venue Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Venue Verifications</CardTitle>
            <Link href="/staff/venues">
              <Button variant="ghost" size="sm" className="text-orange-600">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.pendingVenuesList?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="size-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">All venues verified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.pendingVenuesList?.map((venue) => (
                  <div
                    key={venue._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {venue.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {venue.city}
                        {venue.state ? `, ${venue.state}` : ""} • Capacity:{" "}
                        {venue.capacity.toLocaleString()}
                      </p>
                    </div>
                    <Link href={`/staff/venues?id=${venue._id}`}>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/staff/venues">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <MapPin className="size-6 text-orange-600" />
                <span>Verify Venues</span>
              </Button>
            </Link>
            <Link href="/staff/events">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <Calendar className="size-6 text-orange-600" />
                <span>Moderate Events</span>
              </Button>
            </Link>
            <Link href="/staff/users">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <Users className="size-6 text-orange-600" />
                <span>Manage Users</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

