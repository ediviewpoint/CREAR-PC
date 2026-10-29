"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tooltip } from "radix-ui";
export function AdminProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <Tooltip.Provider delayDuration={250}>{children}</Tooltip.Provider>
    </QueryClientProvider>
  );
}
