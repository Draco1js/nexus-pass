"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import Link from "next/link";

interface UserButtonProps {
  variant: "desktop" | "mobile" | "menu";
}

export function UserButton({ variant }: UserButtonProps) {
  const { data: session } = authClient.useSession();

  // Desktop: Full button with icon and text
  if (variant === "desktop") {
    if (session?.user) {
      return (
        <Link
          href="/profile"
          className="hidden md:flex items-center gap-2 hover:bg-white/10 rounded-md px-3 py-2 transition-colors"
        >
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
        </Link>
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

  // Mobile: Icon only
  if (variant === "mobile") {
    if (session?.user) {
      return (
        <Link href="/profile" className="block md:hidden">
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
        </Link>
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
        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-md transition-colors"
        >
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
        </Link>
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

