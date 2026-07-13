import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateField, Disclosure, Screen, SelectField, TextField } from "@/components/ui";

import { expenseFormSchema, fromPaise, toPaise, type ExpenseFormValues } from "./forms";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { paymentStatuses, type Expense } from "./types";
import { FormShell } from "./ui";

export function ExpenseForm({ expense }: { expense?: Expense }) {
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
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
      vendorName: values.vendorName || undefined,
      dueDate: (values.dueDate || undefined) as Expense["dueDate"],
      notes: values.notes || undefined,
    };
    await mutation.mutateAsync((repositories) =>
      expense
        ? repositories.expenses.updateExpense({ ...expense, ...valuesForStore })
        : repositories.expenses.createExpense(valuesForStore),
    );
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
    name: "categoryId" | "paymentStatus",
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

  const detailsAlreadyAdded = expense
    ? Boolean(
        expense.estimatedPaise ||
          expense.paidPaise ||
          expense.paymentStatus !== "Not Paid" ||
          expense.vendorName ||
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
          {text("vendorName", "Payee or vendor")}
          {text("notes", "Notes", undefined, true)}
        </Disclosure>
      </FormShell>
    </Screen>
  );
}
