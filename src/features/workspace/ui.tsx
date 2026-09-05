import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import MapPin from "lucide-react-native/icons/map-pin";
import type { Href } from "expo-router";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, IconButton, ListRow } from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { tokens, useAppTheme } from "@/theme";
import { goBackOr } from "@/lib/navigation";

import type { Expense, WeddingEvent } from "./types";

export const formatDate = formatDateOnly;

export function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View className="gap-2xs">
      {eyebrow ? <AppText variant="label">{eyebrow}</AppText> : null}
      <AppText tone="brand" variant="title">
        {title}
      </AppText>
    </View>
  );
}

export function DetailHeader({
  eyebrow,
  fallback = "/",
  title,
}: {
  eyebrow?: string;
  fallback?: Href;
  title: string;
}) {
  return (
    <View className="flex-row items-start gap-xs">
      <IconButton
        accessibilityLabel="Go back"
        icon={ChevronLeft}
        onPress={() => goBackOr(fallback)}
      />
      <View className="flex-1 gap-2xs pt-xs">
        {eyebrow ? <AppText variant="caption">{eyebrow}</AppText> : null}
        <AppText tone="brand" variant="title">
          {title}
        </AppText>
      </View>
    </View>
  );
}

export function EventTimelineRow({
  event,
  onPress,
  taskProgress,
}: {
  event: WeddingEvent;
  onPress: () => void;
  taskProgress: { completed: number; total: number };
}) {
  const theme = useAppTheme();
  const progressLabel =
    taskProgress.total === 0
      ? "No tasks linked"
      : `${taskProgress.completed} of ${taskProgress.total} tasks done`;

  return (
    <View className="flex-row gap-sm">
      <View className="items-center pt-xl">
        <View className="h-2xs w-2xs rounded-full bg-primary" />
      </View>
      <Pressable
        accessibilityLabel={`Open event: ${event.name}`}
        accessibilityRole="button"
        android_ripple={{ color: theme.colors.surfaceMuted }}
        className="flex-1 border-b border-borderSubtle py-md active:bg-surfaceMuted"
        onPress={onPress}
      >
        <View className="gap-2xs">
          <AppText variant="heading">{event.name}</AppText>
          <AppText variant="caption">
            {formatDateOnly(event.date)}
            {event.location ? ` · ${event.location}` : ""}
          </AppText>
          <AppText tone="muted" variant="caption">
            {progressLabel}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

export function ExpenseListItem({
  categoryName,
  expense,
  onPress,
}: {
  categoryName: string;
  expense: Expense;
  onPress: () => void;
}) {
  return (
    <ListRow
      accessibilityLabel={`Open expense: ${expense.title}`}
      description={categoryName}
      onPress={onPress}
      title={expense.title}
      trailing={
        <AppText tone={expense.actualPaise > 0 ? undefined : "warning"} variant="label">
          {expense.actualPaise > 0 ? formatInr(expense.actualPaise) : "Amount not recorded"}
        </AppText>
      }
    />
  );
}

type FormShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submissionError?: string;
  title: string;
};

export function FormShell({
  children,
  footer,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
  submissionError,
  title,
}: FormShellProps) {
  const [footerHeight, setFooterHeight] = useState(0);
  const keyboardOffset = footerHeight + Number.parseInt(tokens.spacing.sm, 10);
  const keyboardContentPadding = keyboardOffset + Number.parseInt(tokens.spacing["2xl"], 10);
  const formContent = (
    <>
      <View className="mb-xs flex-row items-center gap-xs pr-xl">
        <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={onCancel} />
        <View className="min-w-0 flex-1">
          <AppText accessibilityRole="header" tone="brand" variant="formTitle">
            {title}
          </AppText>
        </View>
      </View>
      {submissionError ? (
        <View accessibilityRole="alert" className="rounded-control bg-dangerSoft p-md">
          <AppText tone="danger" variant="caption">
            {submissionError}
          </AppText>
        </View>
      ) : null}
      {children}
    </>
  );
  const formFooter = (
    <SafeAreaView
      edges={["bottom"]}
      className="gap-xs border-t border-translucentBorder bg-translucentSurface px-md pb-xs pt-sm shadow-floating"
      onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
    >
      {footer ?? (
        <Button
          disabled={isSubmitting}
          label={submitLabel}
          loading={isSubmitting}
          onPress={onSubmit}
        />
      )}
    </SafeAreaView>
  );

  return (
    <View className="flex-1">
      {process.env.EXPO_OS === "web" ? (
        <ScrollView
          contentContainerClassName="gap-lg p-md pb-2xl"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {formContent}
        </ScrollView>
      ) : (
        <KeyboardAwareScrollView
          bottomOffset={keyboardOffset}
          contentContainerClassName="gap-lg p-md pb-2xl"
          contentContainerStyle={{ paddingBottom: keyboardContentPadding }}
          contentInsetAdjustmentBehavior="automatic"
          disableScrollOnKeyboardHide
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          mode="insets"
          showsVerticalScrollIndicator={false}
          testID="keyboard-aware-form-scroll"
        >
          {formContent}
        </KeyboardAwareScrollView>
      )}
      {process.env.EXPO_OS === "web" ? (
        formFooter
      ) : (
        <KeyboardStickyView testID="keyboard-sticky-form-footer">{formFooter}</KeyboardStickyView>
      )}
    </View>
  );
}

export function LocationLine({ location }: { location?: string }) {
  const theme = useAppTheme();
  if (!location) return null;

  return (
    <View className="flex-row items-center gap-2xs">
      <MapPin color={theme.colors.textSecondary} size={tokens.iconSize.sm} />
      <AppText variant="body">{location}</AppText>
    </View>
  );
}
