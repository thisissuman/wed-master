import { useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { WalletCards } from "lucide-react-native";

import { AppText } from "@/components/ui";
import { formatInr, formatInrCompact } from "@/lib/money";
import { tokens } from "@/theme";

import type { HomeBudgetSummary } from "../selectors";

const stackedMetricsTextScale = 1.45;

function BudgetMetric({
  accessibilityValue,
  label,
  stacked,
  value,
  withDivider,
}: {
  accessibilityValue: string;
  label: string;
  stacked: boolean;
  value: string;
  withDivider: boolean;
}) {
  const dividerClass = withDivider
    ? stacked
      ? "border-t border-primarySoft pt-md"
      : "border-l border-primarySoft pl-md"
    : "";

  return (
    <View
      accessibilityLabel={`${label}, ${accessibilityValue}`}
      accessible
      className={`min-w-0 flex-1 gap-2xs ${dividerClass}`}
      style={stacked ? { width: "100%" } : undefined}
    >
      <AppText tone="onPrimary" variant="caption">
        {label}
      </AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.74}
        numberOfLines={1}
        tone="onPrimary"
        variant="heading"
      >
        {value}
      </AppText>
    </View>
  );
}

export function HomeBudgetOverview({ summary }: { summary: HomeBudgetSummary }) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= stackedMetricsTextScale;
  const hasPlan = summary.percentage !== undefined;
  const roundedPercentage = hasPlan ? Math.round(summary.percentage ?? 0) : undefined;
  const clampedPercentage = Math.min(100, Math.max(0, roundedPercentage ?? 0));
  const isOverBudget = summary.overBudgetPaise > 0 && hasPlan;
  const progressAccessibility = hasPlan
    ? `${roundedPercentage}% of the planned budget spent${
        isOverBudget ? `, over by ${formatInr(summary.overBudgetPaise)}` : ""
      }`
    : "No planned amount yet";
  const plannedAccessibility = hasPlan
    ? `${formatInr(summary.plannedPaise)}, ${
        summary.plannedSource === "target" ? "wedding target" : "expense estimates"
      }`
    : "No planned amount";

  return (
    <View className="gap-lg overflow-hidden rounded-card border border-primary bg-primary p-md shadow-elevated">
      <View className="flex-row items-center justify-between gap-sm">
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText tone="onPrimary" variant="caption">
            Wedding budget
          </AppText>
          <AppText tone="onPrimary" variant="heading">
            {roundedPercentage === undefined
              ? "Build your spending plan"
              : `${roundedPercentage}% used`}
          </AppText>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-accentSoft">
          <WalletCards color={tokens.colors.accent} size={tokens.iconSize.md} strokeWidth={1.8} />
        </View>
      </View>

      <View className="gap-xs">
        <View
          accessibilityLabel="Budget progress"
          accessibilityRole="progressbar"
          accessibilityValue={{
            max: 100,
            min: 0,
            now: clampedPercentage,
            text: progressAccessibility,
          }}
          accessible
          className="h-sm overflow-hidden rounded-full bg-primarySoft"
        >
          <LinearGradient
            colors={[tokens.colors.elevatedSurface, tokens.gradients.homeProgress[1]]}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={{ height: "100%", width: `${clampedPercentage}%` }}
          />
        </View>
      </View>

      <View className="gap-md" style={{ flexDirection: stacked ? "column" : "row" }}>
        <BudgetMetric
          accessibilityValue={plannedAccessibility}
          label="Planned"
          stacked={stacked}
          value={hasPlan ? formatInrCompact(summary.plannedPaise) : "—"}
          withDivider={false}
        />
        <BudgetMetric
          accessibilityValue={formatInr(summary.actualPaise)}
          label="Spent"
          stacked={stacked}
          value={formatInrCompact(summary.actualPaise)}
          withDivider
        />
        <BudgetMetric
          accessibilityValue={progressAccessibility}
          label="Progress"
          stacked={stacked}
          value={roundedPercentage === undefined ? "—" : `${roundedPercentage}%`}
          withDivider
        />
      </View>

      {!hasPlan ? (
        <AppText tone="onPrimary" variant="caption">
          Add a wedding target or expense estimates to calculate budget progress.
        </AppText>
      ) : null}
      {isOverBudget ? (
        <View
          accessibilityRole="alert"
          className="self-start rounded-control bg-dangerSoft px-sm py-xs"
        >
          <AppText tone="danger" variant="label">
            Over by {formatInr(summary.overBudgetPaise)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
