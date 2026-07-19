import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateField, Disclosure, Screen, SelectField, TextField } from "@/components/ui";

import { expenseFormSchema, fromPaise, toPaise, type ExpenseFormValues } from "./forms";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { paymentStatuses, type Expense } from "./types";
import { FormShell } from "./ui";
import { AttachmentField } from "./files/AttachmentField";
import { pickWorkspaceAttachment, removeWorkspaceAttachment } from "./files/workspace-files";
import { toUserMessage } from "@/lib/errors";

export function ExpenseForm({ expense }: { expense?: Expense }) {
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [receipt, setReceipt] = useState(expense?.receipt);
  const [attachmentError, setAttachmentError] = useState<string>();
  const [pickingAttachment, setPickingAttachment] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense
      ? {
          title: expense.title,
          categoryId: expense.categoryId,
          estimated: fromPaise(expense.estimatedPaise),
          actual: fromPaise(expense.actualPaise),
          paid: fromPaise(expense.paidPaise),
          paymentStatus: expense.paymentStatus,
          date: expense.date ?? expense.dueDate ?? "",
          eventId: expense.eventId ?? "",
          vendorName: expense.vendorName ?? "",
          dueDate: expense.dueDate ?? "",
          notes: expense.notes ?? "",
        }
      : {
          title: "",
          categoryId: data?.categories[0]?.id ?? "",
          estimated: "",
          actual: "0.00",
          paid: "0.00",
          paymentStatus: "Not Paid",
          date: "",
          eventId: "",
          vendorName: "",
          dueDate: "",
          notes: "",
        },
  });

  const save = handleSubmit(async (values) => {
    const valuesForStore = {
      title: values.title,
      categoryId: values.categoryId,
      estimatedPaise: values.estimated ? toPaise(values.estimated) : undefined,
      actualPaise: toPaise(values.actual),
      paidPaise: toPaise(values.paid),
      paymentStatus: values.paymentStatus,
      date: values.date as Expense["date"],
      eventId: values.eventId || undefined,
      vendorName: values.vendorName || undefined,
      dueDate: (values.dueDate || undefined) as Expense["dueDate"],
      notes: values.notes || undefined,
      receipt,
    };
    await mutation.mutateAsync((repositories) =>
      expense
        ? repositories.expenses.updateExpense({ ...expense, ...valuesForStore })
        : repositories.expenses.createExpense(valuesForStore),
    );
    if (expense?.receipt && expense.receipt.id !== receipt?.id) {
      removeWorkspaceAttachment(expense.receipt);
    }
    router.back();
  });

  const text = (
    name: keyof ExpenseFormValues,
    label: string,
    placeholder?: string,
    multiline?: boolean,
    keyboardType?: "decimal-pad" | "default",
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
          placeholder={placeholder}
          value={field.value}
        />
      )}
    />
  );

  const select = (
    name: "categoryId" | "paymentStatus" | "eventId",
    label: string,
    options: { label: string; value: string }[],
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          error={errors[name]?.message}
          label={label}
          onChange={field.onChange}
          options={options}
          value={field.value}
        />
      )}
    />
  );

  const dueDateField = (
    <Controller
      control={control}
      name="dueDate"
      render={({ field }) => (
        <DateField
          error={errors.dueDate?.message}
          label="Payment due date"
          onChange={field.onChange}
          value={field.value}
        />
      )}
    />
  );

  const transactionDateField = (
    <Controller
      control={control}
      name="date"
      render={({ field }) => (
        <DateField
          error={errors.date?.message}
          label="Expense date"
          onChange={field.onChange}
          value={field.value}
        />
      )}
    />
  );

  const pickReceipt = async () => {
    setPickingAttachment(true);
    setAttachmentError(undefined);
    try {
      const picked = await pickWorkspaceAttachment();
      if (picked) {
        if (receipt && receipt.id !== expense?.receipt?.id) removeWorkspaceAttachment(receipt);
        setReceipt(picked);
      }
    } catch (error) {
      setAttachmentError(toUserMessage(error));
    } finally {
      setPickingAttachment(false);
    }
  };

  const detailsAlreadyAdded = expense
    ? Boolean(
        expense.estimatedPaise ||
        expense.paidPaise ||
        expense.paymentStatus !== "Not Paid" ||
        expense.vendorName ||
        expense.eventId ||
        expense.receipt ||
        expense.dueDate ||
        expense.notes,
      )
    : false;

  return (
    <Screen>
      <FormShell
        description="Record the cost first. Payment and planning details can wait until you need them."
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={() => router.back()}
        onSubmit={save}
        submitLabel={expense ? "Save changes" : "Create expense"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={expense ? "Edit expense" : "Add expense"}
      >
        {text("title", "What is this for?", "e.g. Venue advance")}
        {select(
          "categoryId",
          "Category",
          (data?.categories ?? []).map((category) => ({
            label: category.name,
            value: category.id,
          })),
        )}
        {text("actual", "Amount spent (₹)", "0.00", false, "decimal-pad")}
        {transactionDateField}
        <Disclosure
          description="Add planned, paid, due-date, payee, or note details."
          initiallyExpanded={detailsAlreadyAdded}
          title="Add payment and planning details"
        >
          {text("estimated", "Planned amount (₹)", "0.00", false, "decimal-pad")}
          {text("paid", "Amount paid (₹)", "0.00", false, "decimal-pad")}
          {select(
            "paymentStatus",
            "Payment status",
            paymentStatuses.map((value) => ({
              label: value === "Not Paid" ? "Payment due" : value,
              value,
            })),
          )}
          {dueDateField}
          {select("eventId", "Linked event", [
            { label: "No linked event", value: "" },
            ...(data?.events ?? []).map((event) => ({ label: event.name, value: event.id })),
          ])}
          {text("vendorName", "Payee or vendor")}
          {text("notes", "Notes", undefined, true)}
          <AttachmentField
            attachment={receipt}
            error={attachmentError}
            label="Receipt or bill"
            loading={pickingAttachment}
            onPick={() => void pickReceipt()}
            onRemove={() => {
              if (receipt && receipt.id !== expense?.receipt?.id)
                removeWorkspaceAttachment(receipt);
              setReceipt(undefined);
            }}
          />
        </Disclosure>
      </FormShell>
    </Screen>
  );
}
