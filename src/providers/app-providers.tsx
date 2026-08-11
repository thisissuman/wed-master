import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RepositoryProvider } from "@/features/workspace";
import { FeedbackHost } from "@/features/feedback/FeedbackHost";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RepositoryProvider>
          {children}
          <FeedbackHost />
        </RepositoryProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
