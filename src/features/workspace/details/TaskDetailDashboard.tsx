import { Image } from "expo-image";
import { router } from "expo-router";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  MoreVertical,
  Paperclip,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  ErrorState,
  LoadingState,
  ProgressBar,
  Screen,
  SectionHeader,
  StatusBadge,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import { pickWorkspaceAttachment, removeWorkspaceAttachment } from "../files/workspace-files";
import { makeWorkspaceId } from "../local-repositories";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { Task } from "../types";
import { DetailHeader, formatDate } from "../ui";

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-sm border-b border-borderSubtle py-md last:border-b-0">
      <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.md} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
        <AppText tone="primary">{value}</AppText>
      </View>
    </View>
  );
}

export function TaskDetailDashboard({ taskId }: { taskId: string }) {
  const reduceMotion = useReducedMotion();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [attachmentError, setAttachmentError] = useState<string>();

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open this task"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening task" />
      </Screen>
    );
  }

  const task = workspace.data.tasks.find((item) => item.id === taskId);
  if (!task) {
    return (
      <Screen className="justify-center p-md">
        <ErrorState message="This task may have been deleted." title="Task not found" />
      </Screen>
    );
  }
  const event = workspace.data.events.find((item) => item.id === task.eventId);
  const completed = task.status === "Completed";
  const completedChecklist = task.checklist.filter((item) => item.completed).length;
  const progress = task.checklist.length ? (completedChecklist / task.checklist.length) * 100 : 0;

  const updateTask = (next: Task) => {
    if (mutation.isPending) return;
    mutation.mutate((repositories) => repositories.tasks.updateTask(next));
  };

  const deleteTask = async () => {
    await mutation.mutateAsync((repositories) => repositories.tasks.deleteTask(task.id));
    task.attachments.forEach(removeWorkspaceAttachment);
    router.replace("/plan");
  };

  const pickAttachment = async () => {
    if (mutation.isPending) return;
    setAttachmentError(undefined);
    try {
      const attachment = await pickWorkspaceAttachment();
      if (attachment) {
        mutation.mutate(
          (repositories) =>
            repositories.tasks.updateTask({
              ...task,
              attachments: [...task.attachments, attachment],
            }),
          { onError: () => removeWorkspaceAttachment(attachment) },
        );
      }
    } catch (error) {
      setAttachmentError(toUserMessage(error));
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader eyebrow={workspace.data.wedding.name} title="Task detail" />
        <Card className="gap-lg shadow-card">
          <View className="flex-row items-start gap-sm">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primarySoft">
              <ClipboardList color={tokens.colors.primary} size={tokens.iconSize.lg} />
            </View>
            <View className="min-w-0 flex-1 gap-sm">
              <AppText tone="primary" variant="title">
                {task.title}
              </AppText>
              <View className="flex-row flex-wrap gap-xs">
                <StatusBadge
                  label={`${task.priority} priority`}
                  tone={
                    task.priority === "Critical"
                      ? "danger"
                      : task.priority === "High"
                        ? "warning"
                        : "neutral"
                  }
                />
                <StatusBadge label={task.status} tone={completed ? "success" : "neutral"} />
              </View>
              {task.description ? <AppText>{task.description}</AppText> : null}
            </View>
          </View>
          <View className="rounded-card border border-borderSubtle px-md">
            <MetaRow
              icon={CalendarDays}
              label="Linked event"
              value={event?.name ?? "General task"}
            />
            {task.dueDate ? (
              <MetaRow icon={CalendarDays} label="Due date" value={formatDate(task.dueDate)} />
            ) : null}
            {task.responsiblePerson ? (
              <MetaRow icon={UserRound} label="Responsible" value={task.responsiblePerson} />
            ) : null}
            {task.category ? <MetaRow icon={Tag} label="Category" value={task.category} /> : null}
          </View>
        </Card>

        {task.notes || task.attachments.length ? (
          <Card className="gap-md">
            <SectionHeader title="Notes & attachments" />
            {task.notes ? <AppText>{task.notes}</AppText> : null}
            {task.attachments.map((attachment) =>
              attachment.mimeType.startsWith("image/") ? (
                <View className="overflow-hidden rounded-control" key={attachment.id}>
                  <Image
                    contentFit="cover"
                    source={{ uri: attachment.uri }}
                    style={{ height: 160, width: "100%" }}
                  />
                  <AppText className="p-xs" variant="caption">
                    {attachment.name}
                  </AppText>
                </View>
              ) : (
                <View className="flex-row items-center gap-sm" key={attachment.id}>
                  <FileText color={tokens.colors.primary} size={tokens.iconSize.md} />
                  <AppText numberOfLines={1}>{attachment.name}</AppText>
                </View>
              ),
            )}
          </Card>
        ) : null}

        <Card className="gap-md">
          <View className="flex-row items-center justify-between gap-sm">
            <View className="min-w-0 flex-1">
              <SectionHeader title="Checklist" />
            </View>
            <AppText className="shrink-0 text-right" tone="primary" variant="caption">
              {completedChecklist} of {task.checklist.length} completed
            </AppText>
          </View>
          <ProgressBar accessibilityLabel="Checklist progress" value={progress} />
          {task.checklist.length ? (
            task.checklist.map((item) => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.completed, disabled: mutation.isPending }}
                className="min-h-12 flex-row items-center gap-sm border-b border-borderSubtle"
                disabled={mutation.isPending}
                key={item.id}
                onPress={() =>
                  updateTask({
                    ...task,
                    checklist: task.checklist.map((candidate) =>
                      candidate.id === item.id
                        ? { ...candidate, completed: !candidate.completed }
                        : candidate,
                    ),
                  })
                }
              >
                {item.completed ? (
                  <CheckCircle2 color={tokens.colors.success} size={tokens.iconSize.md} />
                ) : (
                  <View className="h-5 w-5 rounded-full border border-textSecondary" />
                )}
                <AppText tone={item.completed ? "muted" : undefined}>{item.title}</AppText>
              </Pressable>
            ))
          ) : (
            <AppText tone="muted">Use More actions to add a checklist.</AppText>
          )}
        </Card>

        <View className="gap-xs">
          <View className="flex-row gap-sm">
            <Button
              className="flex-1"
              icon={Check}
              label={completed ? "Reopen task" : "Mark complete"}
              loading={mutation.isPending}
              onPress={() =>
                updateTask({ ...task, status: completed ? "Not Started" : "Completed" })
              }
            />
            <Button
              className="flex-1"
              label="Edit"
              onPress={() => router.push({ pathname: "/tasks/edit", params: { id: task.id } })}
              variant="secondary"
            />
          </View>
          <Button
            icon={MoreVertical}
            label="More actions"
            onPress={() => setActionsOpen(true)}
            variant="secondary"
          />
        </View>
      </ScrollView>

      <Modal
        animationType={reduceMotion ? "none" : "slide"}
        onRequestClose={() => setActionsOpen(false)}
        transparent
        visible={actionsOpen}
      >
        <View className="flex-1 justify-end bg-overlay">
          <View className="max-h-[82%] gap-md rounded-t-sheet bg-elevatedSurface p-lg shadow-elevated">
            <View className="flex-row items-center justify-between">
              <AppText tone="primary" variant="heading">
                Task actions
              </AppText>
              <Pressable
                accessibilityLabel="Close task actions"
                className="min-h-12 min-w-12 items-center justify-center"
                onPress={() => setActionsOpen(false)}
              >
                <X color={tokens.colors.textPrimary} size={tokens.iconSize.md} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="gap-md" keyboardShouldPersistTaps="handled">
              <TextField
                label="New checklist item"
                onChangeText={setNewChecklistItem}
                placeholder="e.g. Confirm availability"
                value={newChecklistItem}
              />
              <Button
                disabled={!newChecklistItem.trim() || mutation.isPending}
                label="Add checklist item"
                onPress={() => {
                  updateTask({
                    ...task,
                    checklist: [
                      ...task.checklist,
                      {
                        id: makeWorkspaceId("checklist"),
                        title: newChecklistItem.trim(),
                        completed: false,
                      },
                    ],
                  });
                  setNewChecklistItem("");
                }}
                variant="secondary"
              />
              {task.checklist.map((item) => (
                <View className="flex-row items-center gap-xs" key={item.id}>
                  <AppText className="flex-1">{item.title}</AppText>
                  <Pressable
                    accessibilityLabel={`Remove ${item.title}`}
                    className="min-h-12 min-w-12 items-center justify-center"
                    onPress={() =>
                      updateTask({
                        ...task,
                        checklist: task.checklist.filter((candidate) => candidate.id !== item.id),
                      })
                    }
                  >
                    <Trash2 color={tokens.colors.danger} size={tokens.iconSize.sm} />
                  </Pressable>
                </View>
              ))}
              <Button
                disabled={mutation.isPending}
                icon={Paperclip}
                label="Add attachment"
                onPress={() => void pickAttachment()}
                variant="secondary"
              />
              {attachmentError ? (
                <AppText tone="danger" variant="caption">
                  {attachmentError}
                </AppText>
              ) : null}
              {task.attachments.map((attachment) => (
                <View className="flex-row items-center gap-xs" key={attachment.id}>
                  <AppText className="flex-1" numberOfLines={1}>
                    {attachment.name}
                  </AppText>
                  <Pressable
                    accessibilityLabel={`Remove ${attachment.name}`}
                    className="min-h-12 min-w-12 items-center justify-center"
                    onPress={() =>
                      mutation.mutate(
                        (repositories) =>
                          repositories.tasks.updateTask({
                            ...task,
                            attachments: task.attachments.filter(
                              (item) => item.id !== attachment.id,
                            ),
                          }),
                        { onSuccess: () => removeWorkspaceAttachment(attachment) },
                      )
                    }
                  >
                    <Trash2 color={tokens.colors.danger} size={tokens.iconSize.sm} />
                  </Pressable>
                </View>
              ))}
              <Button
                label="Delete task"
                onPress={() => {
                  setActionsOpen(false);
                  setDeleteOpen(true);
                }}
                variant="dangerGhost"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ConfirmationDialog
        confirmLabel="Delete task"
        description="This task and its local attachments will be removed."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteTask()}
        pending={mutation.isPending}
        title="Delete this task?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
