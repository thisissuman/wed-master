import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { todayDateOnly } from "./index";

const nextLocalMidnightDelay = () => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1, nextMidnight.getTime() - now.getTime());
};

/**
 * Returns the device's current local date and refreshes it at midnight and when
 * the app returns to the foreground.
 */
export function useTodayDateOnly(): string {
  const [today, setToday] = useState(() => todayDateOnly());

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnightRefresh = () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      midnightTimer = setTimeout(() => {
        setToday(todayDateOnly());
        scheduleMidnightRefresh();
      }, nextLocalMidnightDelay());
    };

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      setToday(todayDateOnly());
      scheduleMidnightRefresh();
    });

    scheduleMidnightRefresh();

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      appStateSubscription.remove();
    };
  }, []);

  return today;
}
