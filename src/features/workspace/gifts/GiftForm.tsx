import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { TextInput } from "react-native";

import { Button, ConfirmationDialog, Disclosure, Screen, TextField } from "@/components/ui";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { toUserMessage } from "@/lib/errors";

import { useCreatedItemHighlight } from "../created-item-highlight";
import { fromPaise, giftFormSchema, toPaise, type GiftFormValues } from "../forms";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { GiftRecord } from "../types";
import { FormShell } from "../ui";
import { useUnsavedChangesGuard } from "../useUnsavedChangesGuard";

export function GiftForm({ gift }: { gift?: GiftRecord }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const markCreatedItem = useCreatedItemHighlight((state) => state.mark);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const valueInputRef = useRef<TextInput>(null);
  const relationshipInputRef = useRef<TextInput>(null);
  const itemInputRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GiftFormValues>({
    resolver: zodResolver(giftFormSchema),
    mode: "onTouched",
    defaultValues: {
      personName: gift?.personName ?? "",
      relationship: gift?.relationship ?? "",
      itemName: gift?.itemName ?? "",
      value: fromPaise(gift?.valuePaise),
    },
  });
  const { exitAfterSave, requestExit } = useUnsavedChangesGuard({
    isDirty,
    isSubmitting: isSubmitting || mutation.isPending,
  });

  const save = handleSubmit(async (values) => {
    const record = {
      ...(gift ?? {}),
      personName: values.personName,
      relationship: values.relationship || undefined,
      itemName: values.itemName || undefined,
      valuePaise: values.value ? toPaise(values.value) : undefined,
    };
    const snapshot = await mutation.mutateAsync((repositories) =>
      gift
        ? repositories.gifts.updateGift({ ...record, id: gift.id })
        : repositories.gifts.createGift(record),
    );
    if (!gift) {
      const existingIds = new Set(workspace.data?.gifts.map((item) => item.id) ?? []);
      const created = snapshot.gifts.find((item) => !existingIds.has(item.id));
      if (created) markCreatedItem("gift", [created.id]);
    }
    exitAfterSave();
  });

  const text = (
    name: "itemName" | "personName" | "relationship" | "value",
    label: string,
    options?: { keyboardType?: "decimal-pad"; optional?: boolean; placeholder?: string },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          autoCapitalize={name === "value" ? "none" : "sentences"}
          autoComplete={name === "personName" ? "name" : "off"}
          autoFocus={name === "personName"}
          error={errors[name]?.message}
          keyboardType={options?.keyboardType}
          label={label}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          onSubmitEditing={
            name === "personName"
              ? () => valueInputRef.current?.focus()
              : name === "relationship"
                ? () => itemInputRef.current?.focus()
                : undefined
          }
          optional={options?.optional}
          placeholder={options?.placeholder}
          ref={
            name === "value"
              ? valueInputRef
              : name === "relationship"
                ? relationshipInputRef
                : name === "itemName"
                  ? itemInputRef
                  : undefined
          }
          returnKeyType={name === "value" || name === "itemName" ? "done" : "next"}
          value={field.value}
        />
      )}
    />
  );

  return (
    <Screen>
      <FormShell
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={requestExit}
        onSubmit={save}
        submitLabel={gift ? "Save gift" : "Add gift"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={gift ? "Edit gift" : "Add gift"}
      >
        {text("personName", "Received from")}
        {text("value", "Value (₹)", { keyboardType: "decimal-pad", optional: true })}
        <Disclosure
          description="Add a relationship or describe the gift when useful."
          initiallyExpanded={Boolean(gift?.relationship || gift?.itemName)}
          title="More details"
        >
          {text("relationship", "Relationship", {
            optional: true,
            placeholder: "e.g. Cousin or family friend",
          })}
          {text("itemName", "Gift description", {
            optional: true,
            placeholder: "e.g. Silver dinner set",
          })}
        </Disclosure>
        {gift ? (
          <Button label="Delete gift" onPress={() => setDeleteOpen(true)} variant="dangerGhost" />
        ) : null}
      </FormShell>
      <ConfirmationDialog
        confirmLabel="Delete gift"
        description="This gift will be removed from this device."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!gift) return;
          mutation.mutate((repositories) => repositories.gifts.deleteGift(gift.id), {
            onSuccess: () => {
              showFeedback({
                actionLabel: "Undo",
                message: "Gift deleted",
                onAction: () =>
                  mutation.mutateAsync((repositories) => repositories.gifts.restoreGift(gift)),
              });
              exitAfterSave();
            },
          });
        }}
        pending={mutation.isPending}
        title="Delete this gift?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
