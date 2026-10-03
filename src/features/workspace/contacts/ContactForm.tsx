import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import * as Contacts from "expo-contacts/legacy";
import { Alert, Linking, Platform, View } from "react-native";
import type { TextInput } from "react-native";

import { AppBottomSheet, AppText, Button, Screen, TextField } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { uiFieldLimits } from "@/lib/forms/fieldLimits";
import { useSingleFlightSubmission } from "@/lib/forms/useSingleFlightSubmission";

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
  const [picking, setPicking] = useState(false);
  const pickerBusy = useRef(false);
  const [phoneChoices, setPhoneChoices] = useState<{
    name: string;
    phones: { label: string; number: string }[];
  }>();
  const roleInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    setValue,
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
  const saveValues = useSingleFlightSubmission(async (values: ContactFormValues) => {
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
  const applyPhoneContact = (name: string, number: string) => {
    setValue("name", name, { shouldDirty: true, shouldValidate: true });
    setValue("phone", number, { shouldDirty: true, shouldValidate: true });
    setPhoneChoices(undefined);
  };
  const pickContact = async () => {
    if (pickerBusy.current) return;
    pickerBusy.current = true;
    setPicking(true);
    try {
      if (Platform.OS === "android") {
        const permission = await Contacts.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Contact access is off",
            "You can still enter a name and phone number yourself.",
            [
              { text: "OK", style: "cancel" },
              ...(!permission.canAskAgain
                ? [
                    {
                      text: "Open Settings",
                      onPress: () => {
                        void Linking.openSettings().catch(() =>
                          Alert.alert(
                            "Could not open Settings",
                            "Open your phone settings to allow contact access.",
                          ),
                        );
                      },
                    },
                  ]
                : []),
            ],
          );
          return;
        }
      }
      const selected = await Contacts.presentContactPickerAsync();
      if (!selected) return;
      const phones = (selected.phoneNumbers ?? []).flatMap((phone) =>
        phone.number?.trim()
          ? [{ label: phone.label ?? "Phone", number: phone.number.trim() }]
          : [],
      );
      if (!phones.length) {
        Alert.alert(
          "No phone number saved",
          "Choose another contact or enter the number yourself.",
        );
        return;
      }
      const name =
        selected.name || [selected.firstName, selected.lastName].filter(Boolean).join(" ");
      if (phones.length === 1) applyPhoneContact(name, phones[0].number);
      else setPhoneChoices({ name, phones });
    } catch {
      Alert.alert(
        "Could not open contacts",
        "Try again, or enter a name and phone number yourself.",
      );
    } finally {
      pickerBusy.current = false;
      setPicking(false);
    }
  };
  const save = handleSubmit(saveValues);
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
          maxLength={name === "phone" ? uiFieldLimits.phone : uiFieldLimits.shortText}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          onSubmitEditing={
            name === "name"
              ? () => roleInputRef.current?.focus()
              : name === "role"
                ? () => phoneInputRef.current?.focus()
                : undefined
          }
          placeholder={
            name === "name"
              ? "Family coordinator"
              : name === "role"
                ? "Driver, doctor…"
                : "Phone number"
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
        {Platform.OS !== "web" ? (
          <Button
            label="Choose from contacts"
            loading={picking}
            disabled={isSubmitting || mutation.isPending}
            onPress={() => void pickContact()}
            variant="secondary"
          />
        ) : null}
        <AppText tone="muted" variant="caption">
          Use a saved contact or enter one below. You can change the name for this wedding.
        </AppText>
        {field("name", "Name")}
        {field("role", "Role or service")}
        {field("phone", "Phone number", "phone-pad")}
      </FormShell>
      <AppBottomSheet
        visible={Boolean(phoneChoices)}
        title="Choose a phone number"
        onClose={() => setPhoneChoices(undefined)}
      >
        <View className="gap-sm">
          {phoneChoices?.phones.map((phone, index) => (
            <Button
              key={`${phone.number}-${index}`}
              label={`${phone.label}: ${phone.number}`}
              variant="secondary"
              onPress={() => applyPhoneContact(phoneChoices.name, phone.number)}
            />
          ))}
        </View>
      </AppBottomSheet>
    </Screen>
  );
}
