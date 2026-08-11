import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, WalletCards } from "lucide-react-native";
import { useWindowDimensions, View } from "react-native";

import { AppText, MotionPressable } from "@/components/ui";
import { formatInr, formatInrCompact } from "@/lib/money";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import type { HomeBudgetSummary } from "../selectors";

function BudgetMetric({
  label,
  stacked,
  value,
  withDivider,
}: {
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
      className={`min-w-0 flex-1 gap-2xs ${dividerClass}`}
      style={stacked ? { width: "100%" } : undefined}
    >
      <AppText tone="onPrimary" variant="caption">
        {label}
      </AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={{ fontVariant: ["tabular-nums"] }}
        tone="onPrimary"
        variant="heading"
      >
        {value}
      </AppText>
    </View>
  );
}

export function HomeBudgetOverview({
  onPress,
  summary,
}: {
  onPress: () => void;
  summary: HomeBudgetSummary;
}) {
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);
  const hasTarget = summary.targetPaise !== undefined;
  const roundedPercentage =
    summary.percentage === undefined ? undefined : Math.round(summary.percentage);
  const clampedPercentage = Math.min(100, Math.max(0, roundedPercentage ?? 0));
  const isOverBudget = summary.overBudgetPaise > 0;
  const pendingValue = isOverBudget
    ? `Over ${formatInrCompact(summary.overBudgetPaise)}`
    : summary.remainingPaise === undefined
      ? "—"
      : formatInrCompact(summary.remainingPaise);
  const summaryLabel = isOverBudget
    ? `Target ${formatInr(summary.targetPaise ?? 0)}. Spent ${formatInr(summary.spentPaise)}. Over budget by ${formatInr(summary.overBudgetPaise)}. ${roundedPercentage}% of target spent`
    : hasTarget
      ? `Target ${formatInr(summary.targetPaise ?? 0)}. Spent ${formatInr(summary.spentPaise)}. ${formatInr(summary.remainingPaise ?? 0)} pending. ${roundedPercentage}% of target spent`
      : `No target set, ${formatInr(summary.spentPaise)} spent`;

  return (
    <MotionPressable
      accessibilityHint="Opens Budget & expenses"
      accessibilityLabel={`Open Budget & expenses. ${summaryLabel}`}
      accessibilityLiveRegion={isOverBudget ? "polite" : "none"}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className="gap-lg overflow-hidden rounded-card border border-primary bg-primary p-md shadow-elevated active:opacity-90"
      onPress={onPress}
    >
      <LinearGradient
        colors={[tokens.colors.primary, tokens.gradients.primaryAction[1]]}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={{ bottom: 0, left: 0, opacity: 0.72, position: "absolute", right: 0, top: 0 }}
      />
      <View className="flex-row items-center gap-sm">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-accentSoft">
          <WalletCards color={tokens.colors.accent} size={tokens.iconSize.md} strokeWidth={1.8} />
        </View>
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText tone="onPrimary" variant="caption">
            Wedding budget
          </AppText>
          <AppText style={{ fontVariant: ["tabular-nums"] }} tone="onPrimary" variant="heading">
            {isOverBudget
              ? `Over by ${formatInr(summary.overBudgetPaise)}`
              : hasTarget
                ? `${formatInr(summary.remainingPaise ?? 0)} pending`
                : "Set your budget target"}
          </AppText>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-translucentSurface">
          <ChevronRight color={tokens.colors.primary} size={tokens.iconSize.md} />
        </View>
      </View>

      {hasTarget ? (
        <View className="gap-2xs">
          <View
            accessibilityLabel="Budget progress"
            accessibilityRole="progressbar"
            accessibilityValue={{
              max: 100,
              min: 0,
              now: clampedPercentage,
              text: `${roundedPercentage}% of target spent`,
            }}
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
      ) : null}

      <View className="gap-md" style={{ flexDirection: stacked ? "column" : "row" }}>
        <BudgetMetric
          label="Target"
          stacked={stacked}
          value={hasTarget ? formatInrCompact(summary.targetPaise ?? 0) : "Not set"}
          withDivider={false}
        />
        <BudgetMetric
          label="Spent"
          stacked={stacked}
          value={formatInrCompact(summary.spentPaise)}
          withDivider
        />
        <BudgetMetric
          label={isOverBudget ? "Over by" : "Pending"}
          stacked={stacked}
          value={pendingValue}
          withDivider
        />
      </View>
    </MotionPressable>
  );
}
