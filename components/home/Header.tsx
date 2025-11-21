"use client";

import { useState } from "react";
import Image from "next/image";
import { Ticket, Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { SearchBar } from "./SearchBar";
import { UserButton } from "~/components/shared/UserButton";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#0A23F0] text-white">
      {/* Top Bar - Dark */}
      <div className="bg-black border-b border-gray-800">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between text-md">
            <div className="flex items-center gap-4">
              <span className="text-gray-300">🇵🇰 PK</span>
            </div>
              <div className="hidden items-center gap-4 md:flex">
                <div className="hidden md:flex items-center gap-4">
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Hotels
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Sell
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Gift Cards
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Help
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    VIP
                  </a>
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
            <div className="flex items-center gap-2">
              <div className="bg-white text-[#0A23F0] flex size-8 items-center justify-center rounded-md">
                <Ticket className="size-5" />
              </div>
              <span className="text-xl font-bold">NexusPass</span>
            </div>
          </div>

          {/* Desktop Navigation - Same level as logo */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <a href="#" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Concerts
            </a>
            <a href="#" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Sports
            </a>
            <a href="#" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Arts, Theater & Comedy
            </a>
            <a href="#" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Family
            </a>
            <a href="#" className="text-lg font-extrabold hover:text-gray-200 transition-colors">
              Cities
            </a>
          </nav>

          {/* Sign In - Same level */}
          <UserButton variant="desktop" />

          {/* Mobile Sign In */}
          <UserButton variant="mobile" />
        </div>
        
        {/* Search Bar Container - Centered with max width */}
        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <SearchBar />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mb-4 pb-4 pt-8 border-b border-white/20">
            <nav className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-white hover:bg-white/10 font-semibold"
              >
                Concerts
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-white hover:bg-white/10 font-semibold"
              >
                Sports
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-white hover:bg-white/10 font-semibold"
              >
                Arts, Theater & Comedy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-white hover:bg-white/10 font-semibold"
              >
                Family
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-white hover:bg-white/10 font-semibold"
              >
                Cities
              </Button>
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

