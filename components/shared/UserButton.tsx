"use client";

import Image from "next/image";
import { User, LogOut, Ticket, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

interface UserButtonProps {
  variant: "desktop" | "mobile" | "menu";
}

export function UserButton({ variant }: UserButtonProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  // Desktop: Dropdown with user info and actions
  if (variant === "desktop") {
    if (session?.user) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden md:flex items-center gap-2 hover:bg-white/10 rounded-md px-3 py-2 transition-colors">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="size-5" />
                </div>
              )}
              <span className="text-white font-semibold max-w-[120px] truncate">
                {session.user.name || session.user.email}
              </span>
              <ChevronDown className="size-4 text-white/70" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-tm-blue-light flex items-center justify-center">
                    <User className="size-5 text-tm-blue" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link href="/tickets" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <Ticket className="size-4" />
                My Tickets
              </Link>
              <Link href="/support" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <HelpCircle className="size-4" />
                Support
              </Link>
            </div>

            {/* Sign Out */}
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors w-full"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Link href="/login" className="hidden md:flex">
        <Button
          variant="ghost"
          size="lg"
          className="text-white hover:text-white rounded-none hover:bg-white/10 h-12 font-semibold"
        >
          <User className="size-6 mr-2" />
          Sign In/Register
        </Button>
      </Link>
    );
  }

  // Mobile: Icon only with dropdown
  if (variant === "mobile") {
    if (session?.user) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className="block md:hidden">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="size-5 text-white" />
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-tm-blue-light flex items-center justify-center">
                    <User className="size-5 text-tm-blue" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link href="/tickets" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <Ticket className="size-4" />
                My Tickets
              </Link>
              <Link href="/support" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <HelpCircle className="size-4" />
                Support
              </Link>
            </div>

            {/* Sign Out */}
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors w-full"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Link href="/login" className="block md:hidden">
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <User className="size-6" />
        </Button>
      </Link>
    );
  }

  // Menu: Full width button/link in mobile menu
  if (variant === "menu") {
    if (session?.user) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="size-5 text-white" />
              </div>
            )}
            <span className="text-white font-semibold truncate flex-1 min-w-0">
              {session.user.name || session.user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-red-300 hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      );
    }

    return (
      <Link href="/login">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-white hover:bg-white/10 font-semibold w-full"
        >
          Sign In/Register
        </Button>
      </Link>
    );
  }

  return null;
}
