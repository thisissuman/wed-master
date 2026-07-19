import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  BedDouble,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Mail,
  MailCheck,
  MailOpen,
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

import { householdFormSchema, type HouseholdFormValues } from "../forms";
import { makeWorkspaceId } from "../local-repositories";
import { useWorkspaceMutation } from "../provider";
import { invitationStatuses, rsvpStatuses, serviceStatuses, type Household } from "../types";
import { FormShell } from "../ui";

const sideOptions: SelectOption[] = [
  { icon: UserRound, label: "Partner one family", value: "partnerOne" },
  { icon: UserRound, label: "Partner two family", value: "partnerTwo" },
  { icon: HeartHandshake, label: "Both families", value: "both" },
  { icon: UsersRound, label: "Friends or other guests", value: "other" },
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
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: household
      ? {
          name: household.name,
          side: household.side,
          guestCount: String(household.guestCount ?? Math.max(1, household.guests.length)),
          guestNames: household.guests.map((guest) => guest.name).join("\n"),
          guestRsvpStatus: household.guests[0]?.rsvpStatus ?? "Pending",
          invitationStatus: household.invitationStatus,
          accommodationStatus: household.accommodationStatus,
          transportStatus: household.transportStatus,
          notes: household.notes ?? "",
        }
      : {
          name: "",
          side: "both",
          guestCount: "1",
          guestNames: "",
          guestRsvpStatus: "Pending",
          invitationStatus: "Not Sent",
          accommodationStatus: "Not Needed",
          transportStatus: "Not Needed",
          notes: "",
        },
  });

  const save = handleSubmit(async (values) => {
    const names = values.guestNames
      .split(/[\n,]/)
      .map((name) => name.trim())
      .filter(Boolean);
    const previousGuests = new Map(
      household?.guests.map((guest) => [guest.name.toLowerCase(), guest]),
    );
    const record = {
      name: values.name,
      side: values.side,
      guestCount: Number(values.guestCount),
      invitationStatus: values.invitationStatus,
      accommodationStatus: values.accommodationStatus,
      transportStatus: values.transportStatus,
      notes: values.notes || undefined,
      guests: names.map(
        (name) =>
          previousGuests.get(name.toLowerCase()) ?? {
            id: makeWorkspaceId("guest"),
            name,
            rsvpStatus: values.guestRsvpStatus,
          },
      ),
    };
    await mutation.mutateAsync((repositories) =>
      household
        ? repositories.households.updateHousehold({ ...record, id: household.id })
        : repositories.households.createHousehold(record),
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  });

  const text = (
    name: "guestNames" | "name" | "notes",
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
          error={errors[name]?.message}
          helperText={options?.helperText}
          icon={icon}
          label={label}
          multiline={options?.multiline}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          optional={options?.optional}
          placeholder={options?.placeholder}
          required={options?.required}
          value={field.value}
        />
      )}
    />
  );

  const select = (
    name:
      "accommodationStatus" | "guestRsvpStatus" | "invitationStatus" | "side" | "transportStatus",
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
        onCancel={() => router.back()}
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
        <Disclosure
          description="Individual names are optional and can be added later."
          initiallyExpanded={Boolean(household?.guests.length)}
          title="Guest names"
        >
          {text("guestNames", "Individual guest names", UserRound, {
            helperText: "Add one name per line or separate names with commas.",
            multiline: true,
            optional: true,
            placeholder: "Add names when you know them",
          })}
          {select(
            "guestRsvpStatus",
            "Starting RSVP status",
            MailOpen,
            rsvpStatuses.map((value) => ({
              icon: rsvpIcons[value],
              label: value,
              tone: value === "Confirmed" ? "success" : value === "Declined" ? "danger" : "warning",
              value,
            })),
            { optional: true },
          )}
        </Disclosure>
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
