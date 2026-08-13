import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import type { TextInput } from "react-native";

import { Screen, TextField } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";

import { useCreatedItemHighlight } from "../created-item-highlight";
import { contactFormSchema, type ContactFormValues } from "../forms";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { EmergencyContact } from "../types";
import { FormShell } from "../ui";
import { useUnsavedChangesGuard } from "../useUnsavedChangesGuard";

export function ContactForm({ contact }: { contact?: EmergencyContact }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const markCreatedItem = useCreatedItemHighlight((state) => state.mark);
  const roleInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched",
    defaultValues: contact
      ? { name: contact.name, role: contact.role, phone: contact.phone }
      : { name: "", role: "", phone: "" },
  });
  const { exitAfterSave, requestExit } = useUnsavedChangesGuard({
    isDirty,
    isSubmitting: isSubmitting || mutation.isPending,
  });
  const save = handleSubmit(async (values) => {
    const snapshot = await mutation.mutateAsync((repositories) =>
      contact
        ? repositories.emergencyContacts.updateContact({ ...contact, ...values })
        : repositories.emergencyContacts.createContact(values),
    );
    if (!contact) {
      const existingIds = new Set(workspace.data?.emergencyContacts.map((item) => item.id) ?? []);
      const created = snapshot.emergencyContacts.find((item) => !existingIds.has(item.id));
      if (created) markCreatedItem("contact", [created.id]);
    }
    exitAfterSave();
  });
  const field = (name: keyof ContactFormValues, label: string, keyboardType?: "phone-pad") => (
    <Controller
      control={control}
      name={name}
      render={({ field: input }) => (
        <TextField
          autoCapitalize={name === "phone" ? "none" : "words"}
          autoComplete={name === "phone" ? "tel" : name === "name" ? "name" : "off"}
          autoFocus={name === "name"}
          error={errors[name]?.message}
          keyboardType={keyboardType}
          label={label}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          onSubmitEditing={
            name === "name"
              ? () => roleInputRef.current?.focus()
              : name === "role"
                ? () => phoneInputRef.current?.focus()
                : undefined
          }
          ref={name === "role" ? roleInputRef : name === "phone" ? phoneInputRef : undefined}
          returnKeyType={name === "phone" ? "done" : "next"}
          value={input.value}
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
        submitLabel={contact ? "Save contact" : "Add contact"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={contact ? "Edit emergency contact" : "Add emergency contact"}
      >
        {field("name", "Name")}
        {field("role", "Role or service")}
        {field("phone", "Phone number", "phone-pad")}
      </FormShell>
    </Screen>
  );
}
