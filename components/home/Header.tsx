"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ticket, Menu, X, LayoutDashboard, Users, Search, Ticket as TicketIcon, HelpCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { SearchBar } from "./SearchBar";
import { UserButton } from "~/components/shared/UserButton";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";

interface HeaderProps {
  hideSearch?: boolean;
}

export function Header({ hideSearch = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = useQuery(api.auth.getCurrentUserWithRole);

  const isArtist = currentUser?.role === "artist";
  const isStaff = currentUser?.role === "staff";
  // Staff can access everything
  const isAuthenticated = currentUser !== null && currentUser !== undefined;

  return (
    <header className="bg-tm-blue text-white">
      {/* Top Bar - Dark */}
      <div className="bg-black border-b border-gray-800">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between text-md">
            <div className="flex items-center gap-4">
              <span className="text-gray-300">🇵🇰 PK</span>
            </div>
              <div className="hidden items-center gap-4 md:flex">
                <div className="hidden md:flex items-center gap-4">
                  {/* Role-based dashboard links */}
                  {(isArtist || isStaff) && (
                    <Link href="/artist-dashboard" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                      <LayoutDashboard className="size-4" />
                      Artist Dashboard
                    </Link>
                  )}
                  {isStaff && (
                    <Link href="/staff" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                      <Users className="size-4" />
                      Staff Portal
                    </Link>
                  )}
                  {isAuthenticated && (
                    <>
                      <Link href="/tickets" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                        <TicketIcon className="size-4" />
                        My Tickets
                      </Link>
                      <Link href="/support" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                        <HelpCircle className="size-4" />
                        Support
                      </Link>
                    </>
                  )}
                  <Link href="/search" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                    <Search className="size-4" />
                    Browse All
                  </Link>
                </div>
                <div className="flex items-center gap-2 bg-[#26232c] px-3 py-1.5 rounded">
                  <Image src="/polar.png" alt="Polar" width={80} height={80} className="brightness-0 invert opacity-80" />
                  <div className="text-[9px] leading-tight flex flex-col items-start text-gray-300">
                    <span>Preferred</span>
                    <span>Payments Partner</span>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
      
      {/* Main Header */}
      <div className="px-6 py-4">
        {/* Logo, Navigation, and Sign In - All on same level for desktop */}
        <div className="flex items-center justify-between mb-6">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white text-tm-blue flex size-8 items-center justify-center rounded-md">
                <Ticket className="size-5" />
              </div>
              <span className="text-xl font-bold">NexusPass</span>
            </Link>
          </div>

          {/* Desktop Navigation - Same level as logo */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <Link href="/search?category=concerts" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Concerts
            </Link>
            <Link href="/search?category=sports" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Sports
            </Link>
            <Link href="/search?category=arts" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Arts, Theater & Comedy
            </Link>
            <Link href="/search?category=family" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Family
            </Link>
            <Link href="/search" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Browse All
            </Link>
          </nav>

          {/* Sign In - Same level */}
          <UserButton variant="desktop" />

          {/* Mobile Sign In */}
          <UserButton variant="mobile" />
        </div>
        
        {/* Search Bar Container - Centered with max width */}
        {!hideSearch && (
          <div className="flex justify-center">
            <div className="w-full max-w-5xl">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mb-4 pb-4 pt-8 border-b border-white/20">
            <nav className="flex flex-col gap-2">
              <Link href="/search?category=concerts">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                >
                  Concerts
                </Button>
              </Link>
              <Link href="/search?category=sports">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                >
                  Sports
                </Button>
              </Link>
              <Link href="/search?category=arts">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                >
                  Arts, Theater & Comedy
                </Button>
              </Link>
              <Link href="/search?category=family">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                >
                  Family
                </Button>
              </Link>
              <Link href="/search">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                >
                  Browse All Events
                </Button>
              </Link>
              
              {/* Role-based links in mobile menu */}
              {isAuthenticated && (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/20">
                  {(isArtist || isStaff) && (
                    <Link href="/artist-dashboard">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                      >
                        <LayoutDashboard className="size-4 mr-2" />
                        Artist Dashboard
                      </Button>
                    </Link>
                  )}
                  {isStaff && (
                    <Link href="/staff">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                      >
                        <Users className="size-4 mr-2" />
                        Staff Portal
                      </Button>
                    </Link>
                  )}
                  <Link href="/tickets">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                    >
                      <TicketIcon className="size-4 mr-2" />
                      My Tickets
                    </Button>
                  </Link>
                  <Link href="/support">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-white hover:bg-white/10 font-semibold w-full"
                    >
                      <HelpCircle className="size-4 mr-2" />
                      Support
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/20">
                <UserButton variant="menu" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

