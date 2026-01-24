"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, isTokenExpired } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if token is expired
    if (isTokenExpired()) {
      // Clear auth and redirect to home
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_token_expiry");
        localStorage.removeItem("auth_user");
        router.push("/");
      }
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }
  }, [router, pathname]);

  // Don't render children if not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
