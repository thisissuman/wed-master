import {
  CalendarHeart,
  Car,
  Gift,
  HandCoins,
  ListChecks,
  Shapes,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react-native";
import { View } from "react-native";

import { tokens } from "@/theme";

import type { BudgetCategoryIconKey } from "../types";

type CategoryPresentation = {
  color: string;
  icon: LucideIcon;
  label: string;
  softColor: string;
};

export const expenseCategoryPresentation: Record<BudgetCategoryIconKey, CategoryPresentation> = {
  event: {
    color: tokens.colors.eventBotanical,
    icon: CalendarHeart,
    label: "Event",
    softColor: tokens.colors.primarySoft,
  },
  task: {
    color: tokens.colors.primary,
    icon: ListChecks,
    label: "Task",
    softColor: tokens.colors.primarySoft,
  },
  shopping: {
    color: tokens.colors.eventTerracotta,
    icon: ShoppingBag,
    label: "Shopping",
    softColor: tokens.colors.dangerSoft,
  },
  commute: {
    color: tokens.colors.eventSage,
    icon: Car,
    label: "Commute",
    softColor: tokens.colors.successSoft,
  },
  gift: {
    color: tokens.colors.eventGold,
    icon: Gift,
    label: "Gift",
    softColor: tokens.colors.accentSoft,
  },
  advance: {
    color: tokens.colors.accent,
    icon: HandCoins,
    label: "Advance",
    softColor: tokens.colors.warningSoft,
  },
  other: {
    color: tokens.colors.textSecondary,
    icon: Shapes,
    label: "Other",
    softColor: tokens.colors.surfaceMuted,
  },
};

export function ExpenseCategoryIcon({
  iconKey,
  size = "md",
}: {
  iconKey: BudgetCategoryIconKey;
  size?: "md" | "sm";
}) {
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
