import { createContext, type PropsWithChildren, useContext } from "react";

import type { ThemeMode } from "@/theme";

const ThemeContext = createContext<ThemeMode>("light");

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value="light">{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeMode {
  return useContext(ThemeContext);
}
