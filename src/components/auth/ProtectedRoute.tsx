"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/providers/supabaseAuthProvider";
import { useRouter, usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define routes that don't require authentication
  const publicRoutes = ["/login"];

  useEffect(() => {
    if (!loading) {
      // If not logged in and route is not public, redirect to login
      if (!user && !publicRoutes.includes(pathname)) {
        router.replace("/login");
      }

      // If already logged in and tries to go to /login, redirect home
      if (user && pathname === "/login") {
        router.replace("/");
      }
    }
  }, [user, loading, pathname, router]);

  // While checking session, show nothing (to prevent flicker)
  if (loading) return null;

  // Block rendering until authenticated or public
  if (!user && !publicRoutes.includes(pathname)) return null;

  return <>{children}</>;
}
