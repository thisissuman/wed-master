import CalendarHeart from "lucide-react-native/icons/calendar-heart";
import Car from "lucide-react-native/icons/car";
import Gift from "lucide-react-native/icons/gift";
import HandCoins from "lucide-react-native/icons/hand-coins";
import ListChecks from "lucide-react-native/icons/list-checks";
import Shapes from "lucide-react-native/icons/shapes";
import ShoppingBag from "lucide-react-native/icons/shopping-bag";
import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { tokens, useAppTheme, type AppThemeColorRole } from "@/theme";

import type { BudgetCategoryIconKey } from "../types";

type CategoryPresentation = {
  color: string;
  icon: LucideIcon;
  label: string;
  softColor: string;
};

type CategoryPresentationDefinition = Omit<CategoryPresentation, "color" | "softColor"> & {
  colorRole: AppThemeColorRole;
  softColorRole: AppThemeColorRole;
};

const expenseCategoryPresentationDefinitions: Record<
  BudgetCategoryIconKey,
  CategoryPresentationDefinition
> = {
  event: {
    colorRole: "eventBotanical",
    icon: CalendarHeart,
    label: "Event",
    softColorRole: "primarySoft",
  },
  task: {
    colorRole: "primary",
    icon: ListChecks,
    label: "Task",
    softColorRole: "primarySoft",
  },
  shopping: {
    colorRole: "eventTerracotta",
    icon: ShoppingBag,
    label: "Shopping",
    softColorRole: "dangerSoft",
  },
  commute: {
    colorRole: "eventSage",
    icon: Car,
    label: "Commute",
    softColorRole: "successSoft",
  },
  gift: {
    colorRole: "eventGold",
    icon: Gift,
    label: "Gift",
    softColorRole: "accentSoft",
  },
  advance: {
    colorRole: "accent",
    icon: HandCoins,
    label: "Advance",
    softColorRole: "warningSoft",
  },
  other: {
    colorRole: "textSecondary",
    icon: Shapes,
    label: "Other",
    softColorRole: "surfaceMuted",
  },
};

export function useExpenseCategoryPresentation(): Record<
  BudgetCategoryIconKey,
  CategoryPresentation
> {
  const theme = useAppTheme();

  return Object.fromEntries(
    Object.entries(expenseCategoryPresentationDefinitions).map(([key, presentation]) => [
      key,
      {
        color: theme.colors[presentation.colorRole],
        icon: presentation.icon,
        label: presentation.label,
        softColor: theme.colors[presentation.softColorRole],
      },
    ]),
  ) as Record<BudgetCategoryIconKey, CategoryPresentation>;
}

export function ExpenseCategoryIcon({
  iconKey,
  size = "md",
}: {
  iconKey: BudgetCategoryIconKey;
  size?: "md" | "sm";
}) {
  const expenseCategoryPresentation = useExpenseCategoryPresentation();
  const presentation = expenseCategoryPresentation[iconKey];
  const Icon = presentation.icon;
  const boxSize = size === "sm" ? 40 : 48;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center rounded-control"
      style={{ backgroundColor: presentation.softColor, height: boxSize, width: boxSize }}
    >
      <Icon
        color={presentation.color}
        size={size === "sm" ? tokens.iconSize.sm : tokens.iconSize.md}
        strokeWidth={1.8}
      />
    </View>
  );
}
