import type { LucideIcon } from "lucide-react-native";
import BedDouble from "lucide-react-native/icons/bed-double";
import CheckCircle2 from "lucide-react-native/icons/circle-check";
import Clock3 from "lucide-react-native/icons/clock-3";
import HeartHandshake from "lucide-react-native/icons/heart-handshake";
import Mail from "lucide-react-native/icons/mail";
import MailCheck from "lucide-react-native/icons/mail-check";
import NotebookPen from "lucide-react-native/icons/notebook-pen";
import Send from "lucide-react-native/icons/send";
import TramFront from "lucide-react-native/icons/tram-front";
import UserRound from "lucide-react-native/icons/user-round";
import UsersRound from "lucide-react-native/icons/users-round";
import XCircle from "lucide-react-native/icons/circle-x";
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
import { uiFieldLimits } from "@/lib/forms/fieldLimits";
import { useSingleFlightSubmission } from "@/lib/forms/useSingleFlightSubmission";

import { useCreatedItemHighlight } from "../created-item-highlight";
import { householdFormSchema, type HouseholdFormValues } from "../forms";
import { useWorkspace, useWorkspaceMutation } from "../provider";
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
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const markCreatedItem = useCreatedItemHighlight((state) => state.mark);
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

  const saveValues = useSingleFlightSubmission(async (values: HouseholdFormValues) => {
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
    const snapshot = await mutation.mutateAsync((repositories) =>
      household
        ? repositories.households.updateHousehold({ ...record, id: household.id })
        : repositories.households.createHousehold(record),
    );
    if (!household) {
      const existingIds = new Set(workspace.data?.households.map((item) => item.id) ?? []);
      const created = snapshot.households.find((item) => !existingIds.has(item.id));
      if (created) markCreatedItem("household", [created.id]);
    }
    exitAfterSave();
  });
  const save = handleSubmit(saveValues);

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
          maxLength={name === "notes" ? uiFieldLimits.longText : uiFieldLimits.shortText}
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
    fieldOptions?: {
      optional?: boolean;
      presentation?: "dialog" | "sheet";
      required?: boolean;
    },
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
          presentation={fieldOptions?.presentation}
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
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={requestExit}
        onSubmit={save}
        submitLabel={household ? "Save household" : "Add household"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={household ? "Edit household" : "Add household"}
      >
        {text("name", "Household or guest name", UsersRound, {
          placeholder: "Mishra family",
          required: true,
        })}
        {select("side", "Wedding side", HeartHandshake, sideOptions, {
          presentation: "dialog",
          required: true,
        })}
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
            placeholder: "Meal or travel notes",
          })}
        </Disclosure>
      </FormShell>
    </Screen>
  );
}
