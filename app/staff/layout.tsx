"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import {
  Shield,
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

const navigation = [
  { name: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { name: "Events", href: "/staff/events", icon: Calendar },
  { name: "Venues", href: "/staff/venues", icon: MapPin },
  { name: "Support", href: "/staff/support", icon: MessageSquare },
  { name: "Users", href: "/staff/users", icon: Users },
];

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const currentUser = useQuery(api.auth.getCurrentUser);

  const isActive = (href: string) => {
    if (href === "/staff") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

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
          <Link href="/staff" className="flex items-center gap-2">
            <div className="bg-orange-500 flex size-8 items-center justify-center rounded-md">
              <Shield className="size-5" />
            </div>
            <span className="text-lg font-bold">Staff Portal</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Staff Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold">
              {currentUser?.name?.charAt(0) || "S"}
            </div>
            <div className="flex-1 min-w-0">
              {currentUser ? (
                <>
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-400">Staff Member</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-4 w-24 bg-white/10" />
                  <Skeleton className="h-3 w-16 mt-1 bg-white/10" />
                </>
              )}
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
                    ? "bg-orange-500 text-white"
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
                  Staff Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Manage platform content and support
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50">
                <AlertTriangle className="size-4" />
                <span className="hidden sm:inline">Reports</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

