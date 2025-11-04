// app/providers.tsx
"use client";

import { ProtectedRoute } from "@/components/auth/protectedRoute";
import { SupabaseAuthProvider } from "@/providers/supabaseAuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <ProtectedRoute>{children}</ProtectedRoute>
      </SupabaseAuthProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
