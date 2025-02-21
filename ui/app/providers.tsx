// app/providers.tsx
"use client";
import { Toaster } from 'react-hot-toast';


import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>
              <QueryClientProvider client={queryClient}>
                <Toaster />
                {children}
              </QueryClientProvider>
      </SessionProvider>;
}