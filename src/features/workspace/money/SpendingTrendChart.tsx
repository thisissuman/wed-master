import { useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { AppText, Card } from "@/components/ui";
import { formatDateOnly, formatShortDateOnly } from "@/lib/dates";
import { formatInr, formatInrCompact } from "@/lib/money";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";
import { stateEnteringTransition } from "@/theme/motion";

import type { SpendingTrendPoint } from "../selectors";

const chartWidth = 320;
const chartHeight = 144;
const plotLeft = 8;
const plotRight = 312;
const plotTop = 10;
const plotBottom = 122;
const plotHeight = plotBottom - plotTop;

type PlotPoint = {
  amount: number;
  x: number;
  y: number;
};

function smoothPath(points: PlotPoint[]): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0}`;

  let path = `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    if (!previous || !current || !next || !afterNext) continue;
    const firstControlX = current.x + (next.x - previous.x) / 6;
    const firstControlY = current.y + (next.y - previous.y) / 6;
    const secondControlX = next.x - (afterNext.x - current.x) / 6;
    const secondControlY = next.y - (afterNext.y - current.y) / 6;
    path += ` C ${firstControlX} ${firstControlY}, ${secondControlX} ${secondControlY}, ${next.x} ${next.y}`;
  }
  return path;
}

function periodLabel(point: SpendingTrendPoint): string {
  return point.startDate === point.endDate
    ? formatDateOnly(point.startDate)
    : `${formatShortDateOnly(point.startDate)}–${formatDateOnly(point.endDate)}`;
}

export function SpendingTrendChart({
  points,
  rangeLabel,
}: {
  points: SpendingTrendPoint[];
  rangeLabel: string;
}) {
  const { fontScale } = useWindowDimensions();
  const maximum = Math.max(0, ...points.map((point) => point.actualPaise));
  const total = points.reduce((sum, point) => sum + point.actualPaise, 0);
  const count = points.reduce((sum, point) => sum + point.expenseCount, 0);
  const peak = points.reduce<SpendingTrendPoint | undefined>(
    (current, point) => (!current || point.actualPaise > current.actualPaise ? point : current),
    undefined,
  );
  const plotPoints = useMemo<PlotPoint[]>(
    () =>
      points.map((point, index) => {
        const x =
          points.length === 1
            ? chartWidth / 2
            : plotLeft + (index / (points.length - 1)) * (plotRight - plotLeft);
        const y =
          maximum > 0 ? plotBottom - (point.actualPaise / maximum) * plotHeight : plotBottom;
        return { amount: point.actualPaise, x, y };
      }),
    [maximum, points],
  );
  const linePath = smoothPath(plotPoints);
  const firstPlotPoint = plotPoints[0];
  const lastPlotPoint = plotPoints.at(-1);
  const areaPath =
    plotPoints.length >= 4 && firstPlotPoint && lastPlotPoint
      ? `${linePath} L ${lastPlotPoint.x} ${plotBottom} L ${firstPlotPoint.x} ${plotBottom} Z`
      : "";
  const firstDate = points[0]?.startDate;
  const lastDate = points.at(-1)?.endDate;
  const accessibilitySummary = points.length
    ? `Spending trend for ${rangeLabel}. ${formatInr(total)} across ${count} ${count === 1 ? "expense" : "expenses"}. Highest plotted period was ${formatInr(peak?.actualPaise ?? 0)} on ${peak ? periodLabel(peak) : "this period"}.`
    : `No dated spending was recorded for ${rangeLabel}.`;
  const stackedHeader = isLargeText(fontScale);

  return (
    <Card className="gap-md overflow-hidden">
      <View
        className="gap-sm"
        style={{
          alignItems: stackedHeader ? "flex-start" : "center",
          flexDirection: stackedHeader ? "column" : "row",
          justifyContent: "space-between",
        }}
        testID="spending-trend-header"
      >
        <View className="min-w-0 flex-1 flex-row items-center gap-xs">
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
          <AppText className="flex-1" variant="label">
            Spend by expense date
          </AppText>
        </View>
        <AppText
          className={stackedHeader ? "self-start" : "text-right"}
          style={{ fontVariant: ["tabular-nums"] }}
          tone="primary"
          variant="label"
        >
          {total ? `${formatInrCompact(total)} total` : "No spend"}
        </AppText>
      </View>

      {points.length ? (
        <Animated.View entering={stateEnteringTransition}>
          <View
            accessible
            accessibilityLabel={accessibilitySummary}
            accessibilityRole="image"
            className="gap-xs"
            testID="spending-trend-chart"
          >
            <View
              className="w-full self-center"
              style={{ aspectRatio: chartWidth / chartHeight, maxWidth: 520 }}
            >
              <Svg
                height="100%"
                pointerEvents="none"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                width="100%"
              >
                <Defs>
                  <SvgLinearGradient id="moneyTrendArea" x1="0" x2="0" y1="0" y2="1">
                    <Stop offset="0" stopColor={tokens.colors.primary} stopOpacity={0.3} />
                    <Stop offset="1" stopColor={tokens.colors.primary} stopOpacity={0.02} />
                  </SvgLinearGradient>
                </Defs>
                {[plotTop, plotTop + plotHeight / 2, plotBottom].map((y) => (
                  <Line
                    key={y}
                    stroke={tokens.colors.borderSubtle}
                    strokeDasharray="4 6"
                    strokeWidth={1}
                    x1={plotLeft}
                    x2={plotRight}
                    y1={y}
                    y2={y}
                  />
                ))}
                {plotPoints.length >= 4 ? (
                  <>
                    <Path d={areaPath} fill="url(#moneyTrendArea)" />
                    <Path
                      d={linePath}
                      fill="none"
                      stroke={tokens.colors.primary}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                    />
                    {plotPoints.map((point, index) => (
                      <Circle
                        cx={point.x}
                        cy={point.y}
                        fill={tokens.colors.elevatedSurface}
                        key={`${points[index]?.endDate}-${point.amount}`}
                        r={4}
                        stroke={tokens.colors.primary}
                        strokeWidth={2.5}
                      />
                    ))}
                  </>
                ) : (
                  plotPoints.map((point, index) => {
                    const width = Math.min(
                      44,
                      (plotRight - plotLeft) / Math.max(3, points.length * 2),
                    );
                    return (
                      <Rect
                        fill={tokens.colors.primary}
                        height={Math.max(5, plotBottom - point.y)}
                        key={`${points[index]?.endDate}-${point.amount}`}
                        opacity={0.9}
                        rx={6}
                        width={width}
                        x={point.x - width / 2}
                        y={Math.min(point.y, plotBottom - 5)}
                      />
                    );
                  })
                )}
              </Svg>
            </View>
            <View className="flex-row items-center justify-between gap-sm">
              <AppText style={{ fontVariant: ["tabular-nums"] }} tone="muted" variant="caption">
                {firstDate ? formatShortDateOnly(firstDate) : ""}
              </AppText>
              <AppText tone="muted" variant="caption">
                Expense date
              </AppText>
              <AppText style={{ fontVariant: ["tabular-nums"] }} tone="muted" variant="caption">
                {lastDate ? formatShortDateOnly(lastDate) : ""}
              </AppText>
            </View>
          </View>
          <View className="mt-sm gap-2xs rounded-control bg-primarySoft p-sm">
            <AppText tone="primary" variant="label">
              Highest plotted period
            </AppText>
            <AppText style={{ fontVariant: ["tabular-nums"] }}>
              {peak ? `${formatInr(peak.actualPaise)} · ${periodLabel(peak)}` : "No dated spend"}
            </AppText>
          </View>
          <AppText className="mt-xs" tone="muted" variant="caption">
            Exact records and dates remain available in Recent expenses below.
          </AppText>
        </Animated.View>
      ) : (
        <View className="min-h-36 items-center justify-center gap-xs rounded-control bg-surfaceMuted p-lg">
          <AppText variant="heading">No dated spending in this range</AppText>
          <AppText className="text-center" tone="muted" variant="caption">
            Choose another range or add an expense to build the trend.
          </AppText>
        </View>
      )}
    </Card>
  );
}
