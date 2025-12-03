"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import {
  Ticket,
  LayoutDashboard,
  Calendar,
  User,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  ShieldAlert,
  Home,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

const navigation = [
  { name: "Overview", href: "/artist-dashboard", icon: LayoutDashboard },
  { name: "Events", href: "/artist-dashboard/events", icon: Calendar },
  { name: "Profile", href: "/artist-dashboard/profile", icon: User },
  { name: "Analytics", href: "/artist-dashboard/analytics", icon: BarChart3 },
];

function ArtistDashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  const currentUser = useQuery(api.auth.getCurrentUserWithRole);
  const isLoading = currentUser === undefined;
  const isArtist = currentUser?.role === "artist";
  const isStaff = currentUser?.role === "staff";
  const hasAccess = isArtist || isStaff;

  const isActive = (href: string) => {
    if (href === "/artist-dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-tm-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not an artist - show access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="size-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="size-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Artist Access Required
          </h1>
          <p className="text-gray-600 mb-6">
            This dashboard is only available for artists. If you&apos;re an artist and want to manage your events, please contact support to upgrade your account.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full bg-tm-blue hover:bg-tm-blue-dark">
                <Home className="size-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-tm-navy text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-tm-blue flex size-8 items-center justify-center rounded-md">
              <Ticket className="size-5" />
            </div>
            <span className="text-lg font-bold">NexusPass</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Artist Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-linear-to-br from-tm-blue to-purple-600 flex items-center justify-center text-sm font-bold">
              {currentUser?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-400">Artist Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-tm-blue text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="size-5" />
                {item.name}
                {active && <ChevronRight className="size-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="size-5" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Artist Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your events and profile
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/artist-dashboard/events/new">
                <Button className="bg-tm-blue hover:bg-tm-blue-dark text-white rounded-lg">
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArtistDashboardLayoutContent>{children}</ArtistDashboardLayoutContent>;
}

