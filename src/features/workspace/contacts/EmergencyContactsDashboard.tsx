import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import MessageCircle from "lucide-react-native/icons/message-circle";
import Pencil from "lucide-react-native/icons/pencil";
import Phone from "lucide-react-native/icons/phone";
import Trash2 from "lucide-react-native/icons/trash-2";
import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppText,
  ConfirmationDialog,
  CreatedItemPulse,
  EmptyState,
  ErrorState,
  FloatingActionButton,
  IconButton,
  LoadingState,
  PersonAvatar,
  Screen,
} from "@/components/ui";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { toUserMessage } from "@/lib/errors";
import { isExpandedLayout } from "@/lib/responsive";
import { tokens, useAppTheme } from "@/theme";

import { useCreatedItemHighlight } from "../created-item-highlight";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { EmergencyContact } from "../types";
import { openContactLink } from "./contact-links";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const fabInset = Number.parseInt(tokens.spacing.md, 10);
const listBottomClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["4xl"], 10);

function ContactCard({
  contact,
  disabled,
  onDelete,
}: {
  contact: EmergencyContact;
  disabled: boolean;
  onDelete: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View className="gap-md overflow-hidden rounded-card bg-elevatedSurface p-md shadow-card">
      <View className="flex-row items-center gap-sm">
        <PersonAvatar name={contact.name} size="lg" />
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText numberOfLines={2} variant="heading">
            {contact.name}
          </AppText>
          <AppText numberOfLines={1} tone="primary" variant="caption">
            {contact.role}
          </AppText>
          <AppText selectable>{contact.phone}</AppText>
        </View>
        <IconButton
          accessibilityLabel={`Edit ${contact.name}`}
          icon={Pencil}
          onPress={() =>
            router.navigate({
              pathname: "/more/emergency-contacts/edit",
              params: { id: contact.id },
            })
          }
          size="sm"
        />
      </View>
      <View className="flex-row gap-sm">
        <Pressable
          accessibilityLabel={`Call ${contact.name}`}
          accessibilityRole="button"
          android_ripple={{ color: theme.colors.primarySoft }}
          className="min-h-12 flex-1 flex-row items-center justify-center gap-xs overflow-hidden rounded-control bg-primarySoft px-sm"
          onPress={() => void openContactLink("tel", contact.phone)}
        >
          <Phone color={theme.colors.primary} size={tokens.iconSize.md} />
          <AppText tone="primary" variant="label">
            Call
          </AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={`Message ${contact.name}`}
          accessibilityRole="button"
          android_ripple={{ color: theme.colors.surfaceMuted }}
          className="min-h-12 flex-1 flex-row items-center justify-center gap-xs overflow-hidden rounded-control bg-surfaceMuted px-sm"
          onPress={() => void openContactLink("sms", contact.phone)}
        >
          <MessageCircle color={theme.colors.accent} size={tokens.iconSize.md} />
          <AppText variant="label">Message</AppText>
        </Pressable>
        <IconButton
          accessibilityLabel={`Delete ${contact.name}`}
          disabled={disabled}
          icon={Trash2}
          onPress={onDelete}
          size="sm"
          variant="danger"
        />
      </View>
    </View>
  );
}

export function EmergencyContactsDashboard() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const createdHighlight = useCreatedItemHighlight((state) => state.current);
  const clearCreatedHighlight = useCreatedItemHighlight((state) => state.clear);
  const [deleteContact, setDeleteContact] = useState<EmergencyContact>();
  const columns = isExpandedLayout(width) ? 2 : 1;

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open contacts"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening contacts" />
      </Screen>
    );
  }

  const header = (
    <View className="gap-xs pb-lg">
      <MoreScreenHeader title="Emergency contacts" />
      <AppText tone="muted" variant="caption">
        Keep the people and services your family may need close at hand.
      </AppText>
    </View>
  );
  const contacts = workspace.data.emergencyContacts;

  return (
    <Screen>
      <FlashList
        contentContainerStyle={{
          padding: contentPadding,
          paddingBottom: listBottomClearance,
        }}
        data={contacts}
        key={`contact-grid-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            actionLabel="Add contact"
            description="Add a family coordinator, venue, doctor, driver, or another useful number."
            onAction={() => router.navigate("/more/emergency-contacts/new")}
            title="No emergency contacts"
          />
        }
        ListHeaderComponent={header}
        numColumns={columns}
        renderItem={({ item }) => (
          <View className={`${columns > 1 ? "px-xs" : ""} pb-sm`}>
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
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
      {contacts.length ? (
        <FloatingActionButton
          accessibilityHint="Opens the emergency contact form"
          accessibilityLabel="Add emergency contact"
          bottomInset={insets.bottom + fabInset}
          onPress={() => router.navigate("/more/emergency-contacts/new")}
        />
      ) : null}
      <ConfirmationDialog
        confirmLabel="Delete contact"
        description={`${deleteContact?.name ?? "This contact"} will be removed from this device.`}
        onCancel={() => setDeleteContact(undefined)}
        onConfirm={() => {
          if (!deleteContact) return;
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
        }}
        pending={mutation.isPending}
        title="Delete this contact?"
        visible={Boolean(deleteContact)}
      />
    </Screen>
  );
}
