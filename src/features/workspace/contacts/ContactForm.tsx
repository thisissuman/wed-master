import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Screen, TextField } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";

import { contactFormSchema, type ContactFormValues } from "../forms";
import { useWorkspaceMutation } from "../provider";
import type { EmergencyContact } from "../types";
import { FormShell } from "../ui";

export function ContactForm({ contact }: { contact?: EmergencyContact }) {
  const mutation = useWorkspaceMutation();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contact
      ? { name: contact.name, role: contact.role, phone: contact.phone }
      : { name: "", role: "", phone: "" },
  });
  const save = handleSubmit(async (values) => {
    await mutation.mutateAsync((repositories) =>
      contact
        ? repositories.emergencyContacts.updateContact({ ...contact, ...values })
        : repositories.emergencyContacts.createContact(values),
    );
    router.back();
  });
  const field = (name: keyof ContactFormValues, label: string, keyboardType?: "phone-pad") => (
    <Controller
      control={control}
      name={name}
      render={({ field: input }) => (
        <TextField
          error={errors[name]?.message}
          keyboardType={keyboardType}
          label={label}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          value={input.value}
        />
      )}
    />
  );
  return (
    <Screen>
      <FormShell
        description="Store important numbers locally for quick access during the wedding."
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={() => router.back()}
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
