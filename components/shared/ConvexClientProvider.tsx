"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "~/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  // Pause queries until the user is authenticated
  // Note: This checks ctx.auth.getUserIdentity(), which might differ from authComponent.getAuthUser()
  expectAuth: true,
});

// Log client initialization
if (typeof window !== "undefined") {
  console.log("[ConvexClientProvider] Convex client initialized with expectAuth: true");
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
