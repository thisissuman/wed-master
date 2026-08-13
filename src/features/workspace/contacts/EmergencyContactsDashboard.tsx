import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { MessageCircle, Pencil, Phone, Plus, ShieldCheck, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  AppText,
  Button,
  ConfirmationDialog,
  CreatedItemPulse,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { tokens } from "@/theme";

import { useWorkspace, useWorkspaceMutation } from "../provider";
import { useCreatedItemHighlight } from "../created-item-highlight";
import type { EmergencyContact } from "../types";
import { openContactLink } from "./contact-links";
import { MoreScreenHeader } from "../more/MoreScreenHeader";

function ContactCard({
  contact,
  disabled,
  onDelete,
}: {
  contact: EmergencyContact;
  disabled: boolean;
  onDelete: () => void;
}) {
  return (
    <View className="gap-sm overflow-hidden rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-card">
      <View className="absolute bottom-0 left-0 top-0 w-2xs bg-accent" />
      <View className="flex-row items-center gap-sm">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
          <ShieldCheck color={tokens.colors.onPrimary} size={tokens.iconSize.lg} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText numberOfLines={2} variant="heading">
            {contact.name}
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {contact.role}
          </AppText>
          <AppText>{contact.phone}</AppText>
        </View>
        <Pressable
          accessibilityLabel={`Edit ${contact.name}`}
          accessibilityRole="button"
          className="min-h-12 min-w-12 items-center justify-center"
          onPress={() =>
            router.navigate({
              pathname: "/more/emergency-contacts/edit",
              params: { id: contact.id },
            })
          }
        >
          <Pencil color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
        </Pressable>
        <Pressable
          accessibilityLabel={`Delete ${contact.name}`}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          className="min-h-12 min-w-12 items-center justify-center"
          disabled={disabled}
          onPress={onDelete}
        >
          <Trash2 color={tokens.colors.danger} size={tokens.iconSize.sm} />
        </Pressable>
      </View>
      <View className="flex-row gap-sm pl-16">
        <Pressable
          accessibilityLabel={`Call ${contact.name}`}
          accessibilityRole="button"
          className="min-h-12 flex-1 flex-row items-center justify-center gap-xs rounded-control border border-borderSubtle"
          onPress={() => void openContactLink("tel", contact.phone)}
        >
          <Phone color={tokens.colors.primary} size={tokens.iconSize.md} />
          <AppText variant="label">Call</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={`Message ${contact.name}`}
          accessibilityRole="button"
          className="min-h-12 flex-1 flex-row items-center justify-center gap-xs rounded-control border border-borderSubtle"
          onPress={() => void openContactLink("sms", contact.phone)}
        >
          <MessageCircle color={tokens.colors.accent} size={tokens.iconSize.md} />
          <AppText variant="label">Message</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function EmergencyContactsDashboard() {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const createdHighlight = useCreatedItemHighlight((state) => state.current);
  const clearCreatedHighlight = useCreatedItemHighlight((state) => state.clear);
  const [deleteContact, setDeleteContact] = useState<EmergencyContact>();
  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError)
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open contacts"
          />
        </Screen>
      );
    return (
      <Screen>
        <LoadingState label="Opening contacts" />
      </Screen>
    );
  }
  const header = (
    <View className="pb-md">
      <MoreScreenHeader title="Emergency contacts" />
    </View>
  );
  return (
    <Screen>
      <FlashList
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        data={workspace.data.emergencyContacts}
        ItemSeparatorComponent={() => <View className="h-sm" />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            actionLabel="Add contact"
            description="Add a family coordinator, venue, doctor, driver, or other useful number."
            onAction={() => router.navigate("/more/emergency-contacts/new")}
            title="No emergency contacts"
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <CreatedItemPulse
            active={Boolean(
              createdHighlight?.kind === "contact" && createdHighlight.ids.includes(item.id),
            )}
            onFinished={() => {
              if (createdHighlight) clearCreatedHighlight(createdHighlight.nonce);
            }}
          >
            <ContactCard
              contact={item}
              disabled={mutation.isPending}
              onDelete={() => setDeleteContact(item)}
            />
          </CreatedItemPulse>
        )}
        showsVerticalScrollIndicator={false}
      />
      {workspace.data.emergencyContacts.length ? (
        <View className="absolute bottom-md right-md">
          <Button
            icon={Plus}
            label="Add contact"
            onPress={() => router.navigate("/more/emergency-contacts/new")}
            variant="primary"
          />
        </View>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Delete contact"
        description={`${deleteContact?.name ?? "This contact"} will be removed from this device.`}
        onCancel={() => setDeleteContact(undefined)}
        onConfirm={() => {
          if (deleteContact) {
            const deleted = deleteContact;
            mutation.mutate(
              (repositories) => repositories.emergencyContacts.deleteContact(deleted.id),
              {
                onSuccess: () => {
                  setDeleteContact(undefined);
                  showFeedback({
                    actionLabel: "Undo",
                    message: "Contact deleted",
                    onAction: () =>
                      mutation.mutateAsync((repositories) =>
                        repositories.emergencyContacts.restoreContact(deleted),
                      ),
                  });
                },
              },
            );
          }
        }}
        pending={mutation.isPending}
        title="Delete this contact?"
        visible={Boolean(deleteContact)}
      />
    </Screen>
  );
}
