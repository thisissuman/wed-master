import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FeedbackHost } from "@/features/feedback/FeedbackHost";
import { InspirationRepositoryProvider } from "@/features/inspire/provider";
import { LocalLifecycleStartupRepair } from "@/features/workspace/lifecycle/LocalLifecycleStartupRepair";
import { RepositoryProvider } from "@/features/workspace/provider";

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
      <KeyboardProvider preload={false}>
        <QueryClientProvider client={queryClient}>
          <RepositoryProvider>
            <InspirationRepositoryProvider>
              <LocalLifecycleStartupRepair />
              {children}
              <FeedbackHost />
            </InspirationRepositoryProvider>
          </RepositoryProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
