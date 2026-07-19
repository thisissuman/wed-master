import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { CalendarDays, Clock3, MapPin, Minus, Pencil, Plus, Store, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  Screen,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { formatTimeOfDay, todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

import { makeWorkspaceId } from "../local-repositories";
import { removeEventCoverPhoto } from "../files/workspace-files";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { TaskCompletionRow } from "../TaskCompletionRow";
import type { Task, WeddingEvent } from "../types";
import { DetailHeader, ExpenseListItem, formatDate } from "../ui";

export function EventDetailDashboard({ eventId }: { eventId: string }) {
  const reduceMotion = useReducedMotion();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [today] = useState(() => todayDateOnly());

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError)
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open this event"
          />
        </Screen>
      );
    return (
      <Screen>
        <LoadingState label="Opening event" />
      </Screen>
    );
  }
  const event = workspace.data.events.find((item) => item.id === eventId);
  if (!event)
    return (
      <Screen className="justify-center p-md">
        <ErrorState message="This event may have been deleted." title="Event not found" />
      </Screen>
    );

  const tasks = workspace.data.tasks.filter((task) => task.eventId === event.id);
  const expenses = workspace.data.expenses.filter((expense) => expense.eventId === event.id);
  const categories = new Map(
    workspace.data.categories.map((category) => [category.id, category.name]),
  );
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const vendors = [
    ...new Set(
      expenses.map((expense) => expense.vendorName).filter((name): name is string => Boolean(name)),
    ),
  ];
  const spent = expenses.reduce((sum, expense) => sum + expense.actualPaise, 0);
  const paid = expenses.reduce((sum, expense) => sum + expense.paidPaise, 0);

  const updateEvent = (next: WeddingEvent) => {
    if (mutation.isPending) return;
    mutation.mutate((repositories) => repositories.events.updateEvent(next));
  };
  const toggleTask = (task: Task) => {
    if (mutation.isPending) return;
    mutation.mutate(
      (repositories) =>
        repositories.tasks.updateTask({
          ...task,
          status: task.status === "Completed" ? "Not Started" : "Completed",
        }),
      {
        onSuccess: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    );
  };
  const deleteEvent = async () => {
    await mutation.mutateAsync((repositories) => repositories.events.deleteEvent(event.id));
    if (event.coverPhotoUri) removeEventCoverPhoto(event.coverPhotoUri);
    router.replace("/plan");
  };

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-xs">
          <View className="flex-1">
            <DetailHeader eyebrow={workspace.data.wedding.name} title={event.name} />
          </View>
          <Button
            icon={Pencil}
            label="Edit"
            onPress={() => router.push({ pathname: "/events/edit", params: { id: event.id } })}
            variant="ghost"
          />
        </View>
        <View className="min-h-64 overflow-hidden rounded-card bg-primary p-lg shadow-card">
          <Image
            accessible={false}
            contentFit="cover"
            pointerEvents="none"
            source={
              event.coverPhotoUri
                ? { uri: event.coverPhotoUri }
                : require("../../../../assets/images/mangalya/mangalya-mandap.jpg")
            }
            style={{
              bottom: 0,
              opacity: 0.62,
              position: "absolute",
              right: 0,
              top: 0,
              width: "58%",
            }}
          />
          <View className="w-[58%] gap-md">
            <View className="flex-row items-center gap-xs">
              <CalendarDays color={tokens.colors.onPrimary} size={tokens.iconSize.md} />
              <AppText tone="onPrimary">{formatDate(event.date)}</AppText>
            </View>
            {event.time ? (
              <View className="flex-row items-center gap-xs">
                <Clock3 color={tokens.colors.onPrimary} size={tokens.iconSize.md} />
                <AppText tone="onPrimary">
                  {formatTimeOfDay(event.time)}
                  {event.endTime ? ` – ${formatTimeOfDay(event.endTime)}` : ""}
                </AppText>
              </View>
            ) : null}
            {event.location ? (
              <View className="flex-row items-start gap-xs">
                <MapPin color={tokens.colors.onPrimary} size={tokens.iconSize.md} />
                <AppText tone="onPrimary">{event.location}</AppText>
              </View>
            ) : null}
          </View>
          <View className="mt-xl gap-xs border-t border-translucentBorder pt-md">
            <View className="flex-row justify-between">
              <AppText tone="onPrimary" variant="caption">
                Event progress
              </AppText>
              <AppText tone="onPrimary" variant="caption">
                {completedTasks}/{tasks.length} tasks
              </AppText>
            </View>
            <ProgressBar accessibilityLabel="Event task progress" value={progress} />
          </View>
        </View>

        <View className="gap-xs">
          <SectionHeader title="Related tasks" />
          {mutation.isError ? (
            <View accessibilityRole="alert" className="rounded-control bg-dangerSoft p-md">
              <AppText tone="danger" variant="caption">
                {toUserMessage(mutation.error)} Try the task update again.
              </AppText>
            </View>
          ) : null}
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCompletionRow
                disabled={mutation.isPending}
                eventName={event.name}
                key={task.id}
                onPress={() => router.push(`/tasks/${task.id}`)}
                onToggle={() => toggleTask(task)}
                task={task}
                today={today}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add task"
              description="Add preparation work for this event."
              onAction={() =>
                router.push({ pathname: "/tasks/new", params: { eventId: event.id } })
              }
              title="No related tasks"
            />
          )}
        </View>

        {event.notes ? (
          <Card className="gap-xs">
            <SectionHeader title="Event notes" />
            <AppText>{event.notes}</AppText>
          </Card>
        ) : null}

        <View className="gap-xs">
          <View className="flex-row items-center justify-between">
            <SectionHeader title="Required items" />
            <Button label="Manage" onPress={() => setItemsOpen(true)} variant="ghost" />
          </View>
          {event.requiredItems.length ? (
            <Card className="gap-md">
              {event.requiredItems.map((item) => (
                <View className="gap-xs" key={item.id}>
                  <View className="flex-row justify-between">
                    <AppText>{item.label}</AppText>
                    <AppText tone="muted" variant="caption">
                      {item.completed}/{item.total}
                    </AppText>
                  </View>
                  <ProgressBar
                    accessibilityLabel={`${item.label} progress`}
                    value={item.total ? (item.completed / item.total) * 100 : 0}
                  />
                </View>
              ))}
            </Card>
          ) : (
            <AppText tone="muted">No required-item groups yet.</AppText>
          )}
        </View>

        <View className="gap-xs">
          <SectionHeader title="Linked vendors" />
          {vendors.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {vendors.map((vendor) => (
                <Card className="mr-sm min-w-44 flex-row items-center gap-sm" key={vendor}>
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-accentSoft">
                    <Store color={tokens.colors.accent} size={tokens.iconSize.md} />
                  </View>
                  <AppText numberOfLines={2} variant="label">
                    {vendor}
                  </AppText>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <AppText tone="muted">Vendor names appear here from linked expenses.</AppText>
          )}
        </View>

        <View className="gap-xs">
          <SectionHeader title="Linked expenses" />
          {expenses.length ? (
            <Card className="gap-md">
              <View className="flex-row justify-between">
                <View>
                  <AppText tone="muted" variant="caption">
                    Spent
                  </AppText>
                  <AppText variant="heading">{formatInr(spent)}</AppText>
                </View>
                <View>
                  <AppText tone="muted" variant="caption">
                    Paid
                  </AppText>
                  <AppText variant="heading">{formatInr(paid)}</AppText>
                </View>
                <View>
                  <AppText tone="muted" variant="caption">
                    Outstanding
                  </AppText>
                  <AppText variant="heading">{formatInr(Math.max(0, spent - paid))}</AppText>
                </View>
              </View>
              {expenses.map((expense) => (
                <ExpenseListItem
                  categoryName={categories.get(expense.categoryId) ?? "Uncategorised"}
                  expense={expense}
                  key={expense.id}
                  onPress={() => router.push(`/expenses/${expense.id}`)}
                />
              ))}
            </Card>
          ) : (
            <AppText tone="muted">Link expenses to this event to see totals here.</AppText>
          )}
        </View>
        <Button label="Delete event" onPress={() => setDeleteOpen(true)} variant="dangerGhost" />
      </ScrollView>

      <Modal
        animationType={reduceMotion ? "none" : "slide"}
        onRequestClose={() => setItemsOpen(false)}
        transparent
        visible={itemsOpen}
      >
        <View className="flex-1 justify-end bg-overlay">
          <View className="max-h-[78%] gap-md rounded-t-sheet bg-elevatedSurface p-lg shadow-elevated">
            <View className="flex-row items-center justify-between">
              <AppText tone="primary" variant="heading">
                Required items
              </AppText>
              <Pressable
                accessibilityLabel="Close required items"
                className="min-h-12 min-w-12 items-center justify-center"
                onPress={() => setItemsOpen(false)}
              >
                <X color={tokens.colors.textPrimary} size={tokens.iconSize.md} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="gap-md" keyboardShouldPersistTaps="handled">
              <TextField
                label="New item group"
                onChangeText={setNewItem}
                placeholder="e.g. Decor items"
                value={newItem}
              />
              <Button
                disabled={!newItem.trim()}
                label="Add group"
                onPress={() => {
                  updateEvent({
                    ...event,
                    requiredItems: [
                      ...event.requiredItems,
                      {
                        id: makeWorkspaceId("required"),
                        label: newItem.trim(),
                        completed: 0,
                        total: 1,
                      },
                    ],
                  });
                  setNewItem("");
                }}
                variant="secondary"
              />
              {event.requiredItems.map((item) => (
                <Card className="gap-xs" key={item.id}>
                  <AppText variant="label">{item.label}</AppText>
                  <View className="flex-row items-center justify-between">
                    <Pressable
                      accessibilityLabel={`Decrease completed ${item.label}`}
                      className="min-h-12 min-w-12 items-center justify-center"
                      onPress={() =>
                        updateEvent({
                          ...event,
                          requiredItems: event.requiredItems.map((candidate) =>
                            candidate.id === item.id
                              ? { ...candidate, completed: Math.max(0, candidate.completed - 1) }
                              : candidate,
                          ),
                        })
                      }
                    >
                      <Minus color={tokens.colors.primary} />
                    </Pressable>
                    <AppText>
                      {item.completed} of {item.total}
                    </AppText>
                    <Pressable
                      accessibilityLabel={`Increase completed ${item.label}`}
                      className="min-h-12 min-w-12 items-center justify-center"
                      onPress={() =>
                        updateEvent({
                          ...event,
                          requiredItems: event.requiredItems.map((candidate) =>
                            candidate.id === item.id
                              ? {
                                  ...candidate,
                                  completed: Math.min(candidate.total, candidate.completed + 1),
                                }
                              : candidate,
                          ),
                        })
                      }
                    >
                      <Plus color={tokens.colors.primary} />
                    </Pressable>
                  </View>
                  <Button
                    label="Add one to total"
                    onPress={() =>
                      updateEvent({
                        ...event,
                        requiredItems: event.requiredItems.map((candidate) =>
                          candidate.id === item.id
                            ? { ...candidate, total: candidate.total + 1 }
                            : candidate,
                        ),
                      })
                    }
                    variant="ghost"
                  />
                </Card>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ConfirmationDialog
        confirmLabel="Delete event"
        description="Related tasks and expenses will remain, but their event link will be removed."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteEvent()}
        pending={mutation.isPending}
        title="Delete this event?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
