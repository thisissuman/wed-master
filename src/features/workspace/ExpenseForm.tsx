import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { ArrowLeft, Check, ChevronRight, IndianRupee, X } from "lucide-react-native";
import { type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";

import {
  AppText,
  Button,
  DateField,
  IconButton,
  MotionPressable,
  Screen,
  TextField,
} from "@/components/ui";
import { formatShortDateOnly, todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";
import { sheetEnteringTransition } from "@/theme/motion";

import { selectableBudgetCategories } from "./expense-categories";
import { AttachmentField } from "./files/AttachmentField";
import { pickWorkspaceAttachment, removeWorkspaceAttachment } from "./files/workspace-files";
import {
  expenseFormSchema,
  fromPaise,
  quickExpenseFormSchema,
  toPaise,
  type ExpenseFormValues,
  type QuickExpenseFormValues,
} from "./forms";
import { ExpenseCategoryIcon } from "./money/ExpenseCategoryIcon";
import { useCreateExpenseMutation, useWorkspace, useWorkspaceMutation } from "./provider";
import { selectExpenseTitleSuggestions } from "./selectors";
import type { AttachmentRef, BudgetCategory, Expense, Task, WeddingEvent } from "./types";
import { FormShell } from "./ui";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";
import { useCreatedItemHighlight } from "./created-item-highlight";

type PendingReceipt = {
  attachment: AttachmentRef;
  preserve: () => void;
  remove: () => void;
};

type CategorySelection = {
  category: BudgetCategory;
  eventId?: string;
  relatedLabel?: string;
  title?: string;
};

type CategoryPickerView = "categories" | "events" | "tasks";

const categoryPickerOrder: Record<BudgetCategory["iconKey"], number> = {
  other: 0,
  task: 1,
  event: 2,
  shopping: 3,
  commute: 4,
  gift: 5,
  advance: 6,
};

function createPendingReceipt(attachment: AttachmentRef): PendingReceipt {
  let removable = true;
  return {
    attachment,
    preserve: () => {
      removable = false;
    },
    remove: () => {
      if (!removable) return;
      removable = false;
      removeWorkspaceAttachment(attachment);
    },
  };
}

function AndroidKeyboardAwareSheetFrame({
  children,
  testID,
}: {
  children: ReactNode;
  testID: string;
}) {
  // Transparent native-stack modals do not reliably resize with the IME on every Android device.
  // Subscribe before child autofocus and move the sheet from the native keyboard height instead.
  const keyboard = useAnimatedKeyboard({
    isNavigationBarTranslucentAndroid: true,
    isStatusBarTranslucentAndroid: true,
  });
  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  return (
    <Animated.View className="flex-1 justify-end bg-overlay" style={keyboardStyle} testID={testID}>
      {children}
    </Animated.View>
  );
}

function KeyboardAwareSheetFrame({ children, testID }: { children: ReactNode; testID: string }) {
  if (Platform.OS === "android") {
    return (
      <AndroidKeyboardAwareSheetFrame testID={testID}>{children}</AndroidKeyboardAwareSheetFrame>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 justify-end bg-overlay"
      testID={testID}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

function QuickExpenseSheet({
  accessibilityLabel,
  children,
  footer,
  onCancel,
  submissionError,
}: {
  accessibilityLabel: string;
  children: ReactNode;
  footer: ReactNode;
  onCancel: () => void;
  submissionError?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <KeyboardAwareSheetFrame testID="quick-expense-overlay">
      <Pressable
        accessible={false}
        className="absolute inset-0"
        importantForAccessibility="no"
        onPress={onCancel}
      />
      <Animated.View
        className="overflow-hidden rounded-t-sheet border border-borderSubtle bg-elevatedSurface shadow-floating"
        entering={reduceMotion ? undefined : sheetEnteringTransition}
        style={{ maxHeight: "92%" }}
      >
        <SafeAreaView
          accessibilityLabel={accessibilityLabel}
          accessibilityViewIsModal
          edges={["bottom"]}
          style={{ maxHeight: "100%" }}
        >
          <View className="min-h-12 flex-row items-center justify-end px-md">
            <IconButton accessibilityLabel="Close expense form" icon={X} onPress={onCancel} />
          </View>
          <ScrollView
            contentContainerClassName="gap-md px-md pb-lg"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1 }}
          >
            {submissionError ? (
              <View accessibilityRole="alert" className="rounded-control bg-dangerSoft p-md">
                <AppText tone="danger" variant="caption">
                  {submissionError}
                </AppText>
              </View>
            ) : null}
            {children}
          </ScrollView>
          <View className="border-t border-borderSubtle px-md pb-xs pt-sm">{footer}</View>
        </SafeAreaView>
      </Animated.View>
    </KeyboardAwareSheetFrame>
  );
}

type CategoryPickerProps = {
  categories: BudgetCategory[];
  events?: WeddingEvent[];
  onClose: () => void;
  onSelect: (selection: CategorySelection) => void;
  selectedId: string;
  tasks?: Task[];
};

function CategoryPickerPanel({
  categories,
  events,
  onClose,
  onSelect,
  selectedId,
  tasks,
}: CategoryPickerProps) {
  const [activeView, setActiveView] = useState<CategoryPickerView>("categories");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("en-IN"));
  const orderedCategories = useMemo(
    () =>
      [...categories].sort(
        (left, right) =>
          categoryPickerOrder[left.iconKey] - categoryPickerOrder[right.iconKey] ||
          left.sortOrder - right.sortOrder,
      ),
    [categories],
  );
  const eventById = useMemo(
    () => new Map((events ?? []).map((event) => [event.id, event])),
    [events],
  );
  const eventCategory = categories.find((category) => category.iconKey === "event");
  const taskCategory = categories.find((category) => category.iconKey === "task");
  const canChooseRelatedItem = events !== undefined && tasks !== undefined;

  const filteredEvents = useMemo(
    () =>
      [...(events ?? [])]
        .filter((event) => event.name.toLocaleLowerCase("en-IN").includes(deferredQuery))
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [deferredQuery, events],
  );
  const filteredTasks = useMemo(
    () =>
      (tasks ?? []).filter((task) => task.title.toLocaleLowerCase("en-IN").includes(deferredQuery)),
    [deferredQuery, tasks],
  );
  const closePicker = () => {
    setActiveView("categories");
    setQuery("");
    onClose();
  };
  const choose = (selection: CategorySelection) => {
    setActiveView("categories");
    setQuery("");
    onSelect(selection);
  };

  const title =
    activeView === "tasks"
      ? "Select task"
      : activeView === "events"
        ? "Select event"
        : "Select category";

  return (
    <SafeAreaView
      accessibilityViewIsModal
      edges={["bottom"]}
      className="min-h-0 flex-1 gap-sm px-md pb-md pt-xs"
    >
      <View className="flex-row items-center gap-sm">
        {activeView !== "categories" ? (
          <IconButton
            accessibilityLabel="Back to expense categories"
            icon={ArrowLeft}
            onPress={() => {
              setActiveView("categories");
              setQuery("");
            }}
          />
        ) : null}
        <AppText className="min-w-0 flex-1" tone="primary" variant="heading">
          {title}
        </AppText>
        <IconButton accessibilityLabel="Close category picker" icon={X} onPress={closePicker} />
      </View>
      {activeView === "categories" ? (
        <ScrollView
          accessibilityLabel="Expense categories"
          contentContainerClassName="gap-xs pb-sm"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {orderedCategories.map((category) => {
            const selected = category.id === selectedId;
            const opensItems =
              canChooseRelatedItem && (category.iconKey === "task" || category.iconKey === "event");
            return (
              <MotionPressable
                accessibilityLabel={
                  opensItems
                    ? `${category.name}, choose existing ${category.name.toLowerCase()}`
                    : category.name
                }
                accessibilityRole="button"
                accessibilityState={{ selected }}
                android_ripple={{ color: tokens.colors.primarySoft }}
                className={`min-h-14 flex-row items-center gap-sm rounded-control border px-sm py-xs active:opacity-80 ${
                  selected ? "border-primary bg-primarySoft" : "border-borderSubtle bg-canvas"
                }`}
                key={category.id}
                onPress={() => {
                  if (opensItems) {
                    setActiveView(category.iconKey === "task" ? "tasks" : "events");
                    return;
                  }
                  choose({ category });
                }}
              >
                <ExpenseCategoryIcon iconKey={category.iconKey} size="sm" />
                <AppText
                  className="min-w-0 flex-1"
                  tone={selected ? "primary" : undefined}
                  variant="label"
                >
                  {category.name}
                </AppText>
                {opensItems ? (
                  <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
                ) : selected ? (
                  <Check color={tokens.colors.primary} size={tokens.iconSize.sm} />
                ) : null}
              </MotionPressable>
            );
          })}
        </ScrollView>
      ) : activeView === "events" ? (
        <View className="min-h-0 flex-1 gap-sm">
          <TextField
            autoCapitalize="none"
            label="Search events"
            onChangeText={setQuery}
            placeholder="Type an event name"
            value={query}
          />
          {filteredEvents.length && eventCategory ? (
            <FlashList
              accessibilityLabel="Wedding events"
              data={filteredEvents}
              ItemSeparatorComponent={() => <View className="h-xs" />}
              keyExtractor={(event) => event.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: event }) => (
                <MotionPressable
                  accessibilityLabel={`Event: ${event.name}`}
                  accessibilityRole="button"
                  android_ripple={{ color: tokens.colors.primarySoft }}
                  className="min-h-16 flex-row items-center gap-sm rounded-control border border-borderSubtle bg-canvas px-sm py-xs active:bg-primarySoft"
                  key={event.id}
                  onPress={() =>
                    choose({
                      category: eventCategory,
                      eventId: event.id,
                      relatedLabel: event.name,
                      title: event.name,
                    })
                  }
                >
                  <ExpenseCategoryIcon iconKey="event" size="sm" />
                  <View className="min-w-0 flex-1">
                    <AppText numberOfLines={2} variant="label">
                      {event.name}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {formatShortDateOnly(event.date)}
                      {event.location ? ` · ${event.location}` : ""}
                    </AppText>
                  </View>
                  <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
                </MotionPressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="min-h-16 justify-center rounded-control bg-surfaceMuted px-md">
              <AppText tone="muted">No events available.</AppText>
            </View>
          )}
        </View>
      ) : (
        <View className="min-h-0 flex-1 gap-sm">
          <TextField
            autoCapitalize="none"
            label="Search tasks"
            onChangeText={setQuery}
            placeholder="Type a task title"
            value={query}
          />
          {filteredTasks.length && taskCategory ? (
            <FlashList
              accessibilityLabel="Wedding tasks"
              data={filteredTasks}
              ItemSeparatorComponent={() => <View className="h-xs" />}
              keyExtractor={(task) => task.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: task }) => {
                const linkedEvent = task.eventId ? eventById.get(task.eventId) : undefined;
                return (
                  <MotionPressable
                    accessibilityLabel={`Task: ${task.title}`}
                    accessibilityRole="button"
                    android_ripple={{ color: tokens.colors.primarySoft }}
                    className="min-h-16 flex-row items-center gap-sm rounded-control border border-borderSubtle bg-canvas px-sm py-xs active:bg-primarySoft"
                    key={task.id}
                    onPress={() =>
                      choose({
                        category: taskCategory,
                        eventId: task.eventId,
                        relatedLabel: task.title,
                        title: task.title,
                      })
                    }
                  >
                    <ExpenseCategoryIcon iconKey="task" size="sm" />
                    <View className="min-w-0 flex-1">
                      <AppText numberOfLines={2} variant="label">
                        {task.title}
                      </AppText>
                      <AppText tone="muted" variant="caption">
                        {task.status}
                        {linkedEvent ? ` · ${linkedEvent.name}` : ""}
                      </AppText>
                    </View>
                    <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
                  </MotionPressable>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="min-h-16 justify-center rounded-control bg-surfaceMuted px-md">
              <AppText tone="muted">No tasks available.</AppText>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function CategoryPickerOverlay(props: CategoryPickerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <KeyboardAwareSheetFrame testID="category-picker-overlay">
      <Pressable
        accessible={false}
        className="absolute inset-0"
        importantForAccessibility="no"
        onPress={props.onClose}
      />
      <Animated.View
        className="min-h-[60%] max-h-[84%] overflow-hidden rounded-t-sheet bg-elevatedSurface shadow-elevated"
        entering={reduceMotion ? undefined : sheetEnteringTransition}
      >
        <CategoryPickerPanel {...props} />
      </Animated.View>
    </KeyboardAwareSheetFrame>
  );
}

function CategoryPickerSheet({
  visible,
  ...props
}: CategoryPickerProps & {
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={props.onClose}
      transparent
      visible={visible}
    >
      <CategoryPickerOverlay {...props} />
    </Modal>
  );
}

function CategoryField({
  category,
  error,
  onPress,
  relatedLabel,
}: {
  category?: BudgetCategory;
  error?: string;
  onPress: () => void;
  relatedLabel?: string;
}) {
  return (
    <View className="gap-2xs">
      <View className="flex-row items-center gap-2xs">
        <AppText variant="label">Category</AppText>
        <AppText tone="danger" variant="label">
          *
        </AppText>
      </View>
      <MotionPressable
        accessibilityLabel={
          category
            ? `Category: ${category.name}${relatedLabel ? `, ${relatedLabel}` : ""}`
            : "Select category, required"
        }
        accessibilityRole="button"
        android_ripple={{ color: tokens.colors.primarySoft }}
        className={`min-h-14 flex-row items-center gap-sm rounded-control border bg-elevatedSurface px-sm active:bg-primarySoft ${
          error ? "border-danger" : "border-borderStrong"
        }`}
        onPress={onPress}
      >
        {category ? <ExpenseCategoryIcon iconKey={category.iconKey} size="sm" /> : null}
        <AppText
          className="min-w-0 flex-1"
          numberOfLines={1}
          tone={category ? "primary" : "muted"}
          variant="label"
        >
          {category
            ? `${category.name}${relatedLabel ? ` · ${relatedLabel}` : ""}`
            : "Select category"}
        </AppText>
        <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.md} />
      </MotionPressable>
      {error ? (
        <AppText accessibilityRole="alert" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function ExpenseTitleSuggestions({
  categories,
  expenses,
  onSelect,
  query,
}: {
  categories: BudgetCategory[];
  expenses: Expense[];
  onSelect: (title: string, categoryId: string) => void;
  query: string;
}) {
  const suggestions = useMemo(
    () => selectExpenseTitleSuggestions(expenses, query),
    [expenses, query],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  if (!suggestions.length) return null;

  return (
    <View className="overflow-hidden rounded-card border border-borderStrong bg-elevatedSurface shadow-elevated">
      <View className="border-b border-borderSubtle px-md py-xs">
        <AppText tone="muted" variant="caption">
          Previously added
        </AppText>
      </View>
      {suggestions.map((suggestion) => {
        const category = categoryById.get(suggestion.categoryId);
        return (
          <Pressable
            accessibilityHint="Reuses its category and moves to amount"
            accessibilityLabel={`Use expense title: ${suggestion.title}`}
            accessibilityRole="button"
            android_ripple={{ color: tokens.colors.primarySoft }}
            className="min-h-14 flex-row items-center gap-sm border-b border-borderSubtle px-md py-xs last:border-b-0 active:bg-primarySoft"
            key={`${suggestion.categoryId}-${suggestion.title}`}
            onPress={() => onSelect(suggestion.title, suggestion.categoryId)}
          >
            {category ? <ExpenseCategoryIcon iconKey={category.iconKey} size="sm" /> : null}
            <View className="min-w-0 flex-1">
              <AppText numberOfLines={1} variant="label">
                {suggestion.title}
              </AppText>
              <AppText tone="muted" variant="caption">
                {category?.name ?? "Saved category"}
              </AppText>
            </View>
            <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
          </Pressable>
        );
      })}
    </View>
  );
}

function CreateExpenseForm() {
  const workspace = useWorkspace();
  const createMutation = useCreateExpenseMutation();
  const markCreatedItem = useCreatedItemHighlight((state) => state.mark);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [relatedSelection, setRelatedSelection] = useState<{
    eventId?: string;
    label: string;
  }>();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);
  const pendingCategoryOpenRef = useRef<
    | {
        subscription: ReturnType<typeof Keyboard.addListener>;
        timeout: ReturnType<typeof setTimeout>;
      }
    | undefined
  >(undefined);
  const titleFocusFrameRef = useRef<number | undefined>(undefined);
  const titleFocusInnerFrameRef = useRef<number | undefined>(undefined);
  const submissionInFlight = useRef(false);
  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<QuickExpenseFormValues>({
    defaultValues: { amount: "", categoryId: "", title: "" },
    mode: "onChange",
    resolver: zodResolver(quickExpenseFormSchema),
  });
  const title = useWatch({ control, name: "title" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const categories = useMemo(() => workspace.data?.categories ?? [], [workspace.data?.categories]);
  const selectableCategories = useMemo(() => selectableBudgetCategories(categories), [categories]);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const busy = isSubmitting || createMutation.isPending;
  const { exitAfterSaveDismissTo, requestExit } = useUnsavedChangesGuard({
    isDirty,
    isSubmitting: busy,
  });

  useEffect(() => {
    titleFocusFrameRef.current = requestAnimationFrame(() => {
      titleFocusInnerFrameRef.current = requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    });

    return () => {
      if (titleFocusFrameRef.current !== undefined) {
        cancelAnimationFrame(titleFocusFrameRef.current);
      }
      if (titleFocusInnerFrameRef.current !== undefined) {
        cancelAnimationFrame(titleFocusInnerFrameRef.current);
      }
      pendingCategoryOpenRef.current?.subscription.remove();
      if (pendingCategoryOpenRef.current) {
        clearTimeout(pendingCategoryOpenRef.current.timeout);
      }
    };
  }, []);

  const focusAmount = () =>
    requestAnimationFrame(() => requestAnimationFrame(() => amountInputRef.current?.focus()));
  const openCategoryPicker = () => {
    setSuggestionsOpen(false);
    if (titleFocusFrameRef.current !== undefined) {
      cancelAnimationFrame(titleFocusFrameRef.current);
      titleFocusFrameRef.current = undefined;
    }
    if (titleFocusInnerFrameRef.current !== undefined) {
      cancelAnimationFrame(titleFocusInnerFrameRef.current);
      titleFocusInnerFrameRef.current = undefined;
    }
    titleInputRef.current?.blur();
    amountInputRef.current?.blur();

    if (!Keyboard.isVisible()) {
      setCategoryPickerOpen(true);
      return;
    }

    pendingCategoryOpenRef.current?.subscription.remove();
    if (pendingCategoryOpenRef.current) {
      clearTimeout(pendingCategoryOpenRef.current.timeout);
    }

    const finishOpening = () => {
      pendingCategoryOpenRef.current?.subscription.remove();
      if (pendingCategoryOpenRef.current) {
        clearTimeout(pendingCategoryOpenRef.current.timeout);
      }
      pendingCategoryOpenRef.current = undefined;
      setCategoryPickerOpen(true);
    };
    const subscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      finishOpening,
    );
    const timeout = setTimeout(finishOpening, 500);
    pendingCategoryOpenRef.current = { subscription, timeout };
    Keyboard.dismiss();
  };
  const selectCategory = (selection: CategorySelection) => {
    const { category, eventId, relatedLabel, title: relatedTitle } = selection;
    setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
    if (relatedTitle) {
      setValue("title", relatedTitle, { shouldDirty: true, shouldValidate: true });
    }
    setRelatedSelection(relatedLabel ? { eventId, label: relatedLabel } : undefined);
    setCategoryPickerOpen(false);
    setSuggestionsOpen(false);
    void Haptics.selectionAsync();
    focusAmount();
  };
  const selectSuggestion = (nextTitle: string, nextCategoryId: string) => {
    setValue("title", nextTitle, { shouldDirty: true, shouldValidate: true });
    setValue("categoryId", nextCategoryId, { shouldDirty: true, shouldValidate: true });
    setRelatedSelection(undefined);
    setSuggestionsOpen(false);
    void Haptics.selectionAsync();
    focusAmount();
  };
  const save = () =>
    handleSubmit(async (values) => {
      if (submissionInFlight.current) return;
      submissionInFlight.current = true;
      setSuggestionsOpen(false);
      let createdExpense: Expense;
      try {
        const result = await createMutation.mutateAsync({
          actualPaise: toPaise(values.amount),
          categoryId: values.categoryId,
          date: todayDateOnly() as Expense["date"],
          ...(relatedSelection?.eventId ? { eventId: relatedSelection.eventId } : {}),
          title: values.title,
        });
        createdExpense = result.expense;
      } catch {
        return;
      } finally {
        submissionInFlight.current = false;
      }
      markCreatedItem("expense", [createdExpense.id]);
      exitAfterSaveDismissTo("/budget");
    })();

  const footer = (
    <Button disabled={!isValid || busy} label="Add expense" loading={busy} onPress={save} />
  );

  return (
    <View className="flex-1">
      <View
        className="flex-1"
        importantForAccessibility={categoryPickerOpen ? "no-hide-descendants" : "auto"}
      >
        <QuickExpenseSheet
          accessibilityLabel="Add expense"
          footer={footer}
          onCancel={requestExit}
          submissionError={createMutation.error ? toUserMessage(createMutation.error) : undefined}
        >
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <TextField
                autoCapitalize="sentences"
                autoComplete="off"
                error={errors.title?.message}
                label="Expense title"
                onBlur={field.onBlur}
                onChangeText={(value) => {
                  field.onChange(value);
                  setSuggestionsOpen(Boolean(value.trim()));
                }}
                onFocus={() => setSuggestionsOpen(Boolean(field.value.trim()))}
                onSubmitEditing={() => {
                  setSuggestionsOpen(false);
                  if (getValues("categoryId")) focusAmount();
                  else openCategoryPicker();
                }}
                placeholder="e.g. Venue advance"
                ref={titleInputRef}
                required
                returnKeyType="next"
                value={field.value}
              />
            )}
          />
          {suggestionsOpen ? (
            <ExpenseTitleSuggestions
              categories={categories}
              expenses={workspace.data?.expenses ?? []}
              onSelect={selectSuggestion}
              query={title}
            />
          ) : null}
          <CategoryField
            category={selectedCategory}
            error={errors.categoryId?.message}
            onPress={openCategoryPicker}
            relatedLabel={relatedSelection?.label}
          />
          {categoryId ? (
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <TextField
                  autoCapitalize="none"
                  error={errors.amount?.message}
                  icon={IndianRupee}
                  keyboardType="decimal-pad"
                  label="Amount"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="0.00"
                  ref={amountInputRef}
                  required
                  value={field.value}
                />
              )}
            />
          ) : null}
        </QuickExpenseSheet>
      </View>
      {categoryPickerOpen ? (
        <View className="absolute inset-0">
          <CategoryPickerOverlay
            categories={selectableCategories}
            events={workspace.data?.events ?? []}
            onClose={() => setCategoryPickerOpen(false)}
            onSelect={selectCategory}
            selectedId={categoryId}
            tasks={workspace.data?.tasks ?? []}
          />
        </View>
      ) : null}
    </View>
  );
}

function EditExpenseForm({ expense }: { expense: Expense }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [receipt, setReceipt] = useState(expense.receipt);
  const [pendingReceipt, setPendingReceipt] = useState<PendingReceipt>();
  const [attachmentError, setAttachmentError] = useState<string>();
  const [pickingAttachment, setPickingAttachment] = useState(false);
  const submissionInFlight = useRef(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      amount: fromPaise(expense.actualPaise),
      categoryId: expense.categoryId,
      date: expense.date ?? todayDateOnly(),
      notes: expense.notes ?? "",
      title: expense.title,
    },
    mode: "onTouched",
    resolver: zodResolver(expenseFormSchema),
  });
  const categoryId = useWatch({ control, name: "categoryId" });
  const categories = useMemo(() => workspace.data?.categories ?? [], [workspace.data?.categories]);
  const currentCategory = categories.find((category) => category.id === categoryId);
  const selectableCategories = useMemo(() => {
    const active = selectableBudgetCategories(categories);
    if (!currentCategory || active.some((category) => category.id === currentCategory.id)) {
      return active;
    }
    return [currentCategory, ...active];
  }, [categories, currentCategory]);
  const receiptDirty = receipt?.id !== expense.receipt?.id;
  const busy = isSubmitting || mutation.isPending || pickingAttachment;
  const { exitAfterSave, requestExit } = useUnsavedChangesGuard({
    isDirty: isDirty || receiptDirty,
    isSubmitting: busy,
  });

  useEffect(
    () => () => {
      pendingReceipt?.remove();
    },
    [pendingReceipt],
  );

  const pickReceipt = async () => {
    if (pickingAttachment) return;
    setPickingAttachment(true);
    setAttachmentError(undefined);
    try {
      const picked = await pickWorkspaceAttachment();
      if (!picked) return;
      pendingReceipt?.remove();
      setPendingReceipt(createPendingReceipt(picked));
      setReceipt(picked);
    } catch (error) {
      setAttachmentError(toUserMessage(error));
    } finally {
      setPickingAttachment(false);
    }
  };

  const save = () =>
    handleSubmit(async (values) => {
      if (submissionInFlight.current) return;
      submissionInFlight.current = true;
      try {
        await mutation.mutateAsync((repositories) =>
          repositories.expenses.updateExpense({
            ...expense,
            actualPaise: toPaise(values.amount),
            categoryId: values.categoryId,
            date: values.date as Expense["date"],
            notes: values.notes || undefined,
            receipt,
            title: values.title,
          }),
        );
      } catch {
        return;
      } finally {
        submissionInFlight.current = false;
      }
      pendingReceipt?.preserve();
      if (expense.receipt && expense.receipt.id !== receipt?.id) {
        removeWorkspaceAttachment(expense.receipt);
      }
      exitAfterSave();
    })();

  return (
    <Screen>
      <FormShell
        isSubmitting={busy}
        onCancel={requestExit}
        onSubmit={save}
        submitLabel="Save changes"
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title="Edit expense"
      >
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <TextField
              autoCapitalize="sentences"
              autoFocus
              error={errors.title?.message}
              label="Expense title"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              required
              value={field.value}
            />
          )}
        />
        <CategoryField
          category={currentCategory}
          error={errors.categoryId?.message}
          onPress={() => {
            Keyboard.dismiss();
            requestAnimationFrame(() => setCategoryPickerOpen(true));
          }}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <TextField
              error={errors.amount?.message}
              icon={IndianRupee}
              keyboardType="decimal-pad"
              label="Amount"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              required
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateField
              error={errors.date?.message}
              label="Expense date"
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextField
              error={errors.notes?.message}
              label="Note"
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              optional
              value={field.value}
            />
          )}
        />
        <AttachmentField
          attachment={receipt}
          error={attachmentError}
          label="Attachment or receipt"
          loading={pickingAttachment}
          onPick={() => void pickReceipt()}
          onRemove={() => {
            pendingReceipt?.remove();
            setPendingReceipt(undefined);
            setReceipt(undefined);
          }}
        />
        <CategoryPickerSheet
          categories={selectableCategories}
          onClose={() => setCategoryPickerOpen(false)}
          onSelect={({ category }) => {
            setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
            setCategoryPickerOpen(false);
            void Haptics.selectionAsync();
          }}
          selectedId={categoryId}
          visible={categoryPickerOpen}
        />
      </FormShell>
    </Screen>
  );
}

export function ExpenseForm({ expense }: { expense?: Expense }) {
  return expense ? <EditExpenseForm expense={expense} /> : <CreateExpenseForm />;
}
