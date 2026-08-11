import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import {
  BedDouble,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Mail,
  MailCheck,
  NotebookPen,
  Send,
  TramFront,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Disclosure,
  NumberStepper,
  Screen,
  SelectField,
  type SelectOption,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { useFeedbackStore } from "@/features/feedback/feedback-store";

import { householdFormSchema, type HouseholdFormValues } from "../forms";
import { useWorkspaceMutation } from "../provider";
import { invitationStatuses, rsvpStatuses, serviceStatuses, type Household } from "../types";
import { FormShell } from "../ui";
import { useUnsavedChangesGuard } from "../useUnsavedChangesGuard";

const sideOptions: SelectOption[] = [
  { icon: UserRound, label: "Partner one’s family", value: "partnerOne" },
  { icon: UserRound, label: "Partner two’s family", value: "partnerTwo" },
  { icon: HeartHandshake, label: "Both families", value: "both" },
  { icon: UsersRound, label: "Other guests", value: "other" },
];

const rsvpIcons = {
  Confirmed: CheckCircle2,
  Declined: XCircle,
  Pending: Clock3,
} as const;

const invitationIcons = {
  Delivered: MailCheck,
  "Not Sent": Mail,
  Sent: Send,
} as const;

const serviceTone = (value: string): SelectOption["tone"] =>
  value === "Booked" ? "success" : value === "Needed" ? "warning" : "muted";

export function HouseholdForm({ household }: { household?: Household }) {
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    mode: "onTouched",
    defaultValues: household
      ? {
          name: household.name,
          side: household.side,
          guestCount: String(household.guestCount ?? Math.max(1, household.guests.length)),
          rsvpStatus: household.rsvpStatus,
          invitationStatus: household.invitationStatus,
          accommodationStatus: household.accommodationStatus,
          transportStatus: household.transportStatus,
          notes: household.notes ?? "",
        }
      : {
          name: "",
          side: "both",
          guestCount: "1",
          rsvpStatus: "Pending",
          invitationStatus: "Not Sent",
          accommodationStatus: "Not Needed",
          transportStatus: "Not Needed",
          notes: "",
        },
  });
  const { exitAfterSave, requestExit } = useUnsavedChangesGuard({
    isDirty,
    isSubmitting: isSubmitting || mutation.isPending,
  });

  const save = handleSubmit(async (values) => {
    const record = {
      name: values.name,
      side: values.side,
      guestCount: Number(values.guestCount),
      rsvpStatus: values.rsvpStatus,
      invitationStatus: values.invitationStatus,
      accommodationStatus: values.accommodationStatus,
      transportStatus: values.transportStatus,
      notes: values.notes || undefined,
      guests: household?.guests ?? [],
    };
    await mutation.mutateAsync((repositories) =>
      household
        ? repositories.households.updateHousehold({ ...record, id: household.id })
        : repositories.households.createHousehold(record),
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showFeedback({ message: household ? "Household updated" : "Household added" });
    exitAfterSave();
  });

  const text = (
    name: "name" | "notes",
    label: string,
    icon: LucideIcon,
    options?: {
      helperText?: string;
      multiline?: boolean;
      optional?: boolean;
      placeholder?: string;
      required?: boolean;
    },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          autoCapitalize="words"
          autoComplete={name === "name" ? "name" : "off"}
          autoFocus={name === "name"}
          error={errors[name]?.message}
          helperText={options?.helperText}
          icon={icon}
          label={label}
          multiline={options?.multiline}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          optional={options?.optional}
          placeholder={options?.placeholder}
          returnKeyType={options?.multiline ? "default" : "done"}
          required={options?.required}
          value={field.value}
        />
      )}
    />
  );

  const select = (
    name: "accommodationStatus" | "invitationStatus" | "rsvpStatus" | "side" | "transportStatus",
    label: string,
    icon: LucideIcon,
    options: SelectOption[],
    fieldOptions?: { optional?: boolean; required?: boolean },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          error={errors[name]?.message}
          icon={icon}
          label={label}
          onChange={field.onChange}
          optional={fieldOptions?.optional}
          options={options}
          required={fieldOptions?.required}
          value={field.value}
        />
      )}
    />
  );

  const planningDetailsAdded = Boolean(
    household &&
    (household.invitationStatus !== "Not Sent" ||
      household.accommodationStatus !== "Not Needed" ||
      household.transportStatus !== "Not Needed" ||
      household.notes),
  );

  return (
    <Screen>
      <FormShell
        description="Invite a household and add only the planning details you need."
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={requestExit}
        onSubmit={save}
        submitLabel={household ? "Save household" : "Add household"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={household ? "Edit household" : "Add household"}
      >
        {text("name", "Household or guest name", UsersRound, {
          placeholder: "e.g. Mishra family",
          required: true,
        })}
        {select("side", "Wedding side", HeartHandshake, sideOptions, { required: true })}
        <Controller
          control={control}
          name="guestCount"
          render={({ field }) => (
            <NumberStepper
              error={errors.guestCount?.message}
              label="Guest count"
              onChange={field.onChange}
              required
              value={field.value}
            />
          )}
        />
        {select(
          "rsvpStatus",
          "Household RSVP",
          rsvpIcons.Pending,
          rsvpStatuses.map((value) => ({
            icon: rsvpIcons[value],
            label: value,
            tone: value === "Confirmed" ? "success" : value === "Declined" ? "danger" : "warning",
            value,
          })),
          { required: true },
        )}
        <Disclosure
          description="Invitation, stay, transport, and private notes."
          initiallyExpanded={planningDetailsAdded}
          title="Planning details"
        >
          {select(
            "invitationStatus",
            "Invitation status",
            Mail,
            invitationStatuses.map((value) => ({
              icon: invitationIcons[value],
              label: value,
              tone: value === "Delivered" ? "success" : value === "Sent" ? "primary" : "muted",
              value,
            })),
            { optional: true },
          )}
          {select(
            "accommodationStatus",
            "Accommodation",
            BedDouble,
            serviceStatuses.map((value) => ({
              icon: BedDouble,
              label: value,
              tone: serviceTone(value),
              value,
            })),
            { optional: true },
          )}
          {select(
            "transportStatus",
            "Transport",
            TramFront,
            serviceStatuses.map((value) => ({
              icon: TramFront,
              label: value,
              tone: serviceTone(value),
              value,
            })),
            { optional: true },
          )}
          {text("notes", "Notes", NotebookPen, {
            multiline: true,
            optional: true,
            placeholder: "Meal, accessibility, or travel notes",
          })}
        </Disclosure>
      </FormShell>
    </Screen>
  );
}
