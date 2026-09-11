import { type ReactNode, useState } from "react";
import { ScrollView, View } from "react-native";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import type { Href } from "expo-router";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, IconButton } from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { tokens } from "@/theme";
import { goBackOr } from "@/lib/navigation";

export const formatDate = formatDateOnly;

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
