import type { Href } from "expo-router";
import { router } from "expo-router";

const rootTabPaths = new Set(["/", "/plan", "/budget", "/more"]);

export const moreTabResetOptions = { popToTopOnBlur: true } as const;

export function expenseCreationNavigationOptions(reduceMotion: boolean) {
  return {
    animation: reduceMotion ? ("none" as const) : ("fade" as const),
    contentStyle: { backgroundColor: "transparent" },
    presentation: "transparentModal" as const,
  };
}

export function isRootTabPath(pathname: string) {
  return rootTabPaths.has(pathname);
}

export function goBackOr(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
