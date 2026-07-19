import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateField, Disclosure, Screen, SelectField, TextField } from "@/components/ui";
import { toDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";

import { fromPaise, giftFormSchema, toPaise, type GiftFormValues } from "../forms";
import { useWorkspaceMutation } from "../provider";
import { giftKinds, giftProgressStatuses, type GiftRecord } from "../types";
import { FormShell } from "../ui";

export function GiftForm({
  gift,
  initialKind = "Received",
}: {
  gift?: GiftRecord;
  initialKind?: GiftRecord["kind"];
}) {
  const mutation = useWorkspaceMutation();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GiftFormValues>({
    resolver: zodResolver(giftFormSchema),
    defaultValues: gift
      ? {
          kind: gift.kind,
          personName: gift.personName,
          relationship: gift.relationship ?? "",
          itemName: gift.itemName,
          value: fromPaise(gift.valuePaise),
          valueIsEstimated: gift.valueIsEstimated ? "Yes" : "No",
          date: gift.date ?? "",
          thankedStatus: gift.thankedStatus,
          returnGiftStatus: gift.returnGiftStatus,
          notes: gift.notes ?? "",
        }
      : {
          kind: initialKind,
          personName: "",
          relationship: "",
          itemName: "",
          value: "",
          valueIsEstimated: "No",
          date: "",
          thankedStatus: "Pending",
          returnGiftStatus: "Pending",
          notes: "",
        },
  });

  const save = handleSubmit(async (values) => {
    const today = toDateOnly(new Date()) as GiftRecord["thankedDate"];
    const record = {
      kind: values.kind,
      personName: values.personName,
      relationship: values.relationship || undefined,
      itemName: values.itemName,
      valuePaise: values.value ? toPaise(values.value) : undefined,
      valueIsEstimated: values.valueIsEstimated === "Yes" || undefined,
      date: (values.date || undefined) as GiftRecord["date"],
      thankedStatus: values.thankedStatus,
      thankedDate: values.thankedStatus === "Done" ? (gift?.thankedDate ?? today) : undefined,
      returnGiftStatus: values.returnGiftStatus,
      returnGiftDate:
        values.returnGiftStatus === "Done" ? (gift?.returnGiftDate ?? today) : undefined,
      notes: values.notes || undefined,
    };
    await mutation.mutateAsync((repositories) =>
      gift
        ? repositories.gifts.updateGift({ ...record, id: gift.id })
        : repositories.gifts.createGift(record),
    );
    router.back();
  });

  const text = (
    name: "personName" | "relationship" | "itemName" | "value" | "notes",
    label: string,
    multiline = false,
    keyboardType?: "decimal-pad",
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          error={errors[name]?.message}
          keyboardType={keyboardType}
          label={label}
          multiline={multiline}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={field.value}
        />
      )}
    />
  );
  const select = (
    name: "kind" | "valueIsEstimated" | "thankedStatus" | "returnGiftStatus",
    label: string,
    values: readonly string[],
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          error={errors[name]?.message}
          label={label}
          onChange={field.onChange}
          options={values.map((value) => ({ label: value, value }))}
          value={field.value}
        />
      )}
    />
  );

  return (
    <Screen>
      <FormShell
        description="Track gifts and follow-ups without adding private records outside this device."
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={() => router.back()}
        onSubmit={save}
        submitLabel={gift ? "Save gift" : "Add gift"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={gift ? "Edit gift" : "Add gift"}
      >
        {select("kind", "Gift type", giftKinds)}
        {text("personName", "Given by or for")}
        {text("relationship", "Relationship")}
        {text("itemName", "Gift")}
        {text("value", "Value (₹)", false, "decimal-pad")}
        {select("valueIsEstimated", "Estimated value", ["No", "Yes"])}
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateField
              error={errors.date?.message}
              label="Date"
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />
        <Disclosure description="Track thank-you and return-gift follow-up." title="Follow-up">
          {select("thankedStatus", "Thanked", giftProgressStatuses)}
          {select("returnGiftStatus", "Return gift", giftProgressStatuses)}
          {text("notes", "Notes", true)}
        </Disclosure>
      </FormShell>
    </Screen>
  );
}
