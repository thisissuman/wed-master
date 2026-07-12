import { Alert, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppText, Button, Card, LoadingState, Screen } from "@/components/ui";
import { useWorkspace, useWorkspaceMutation } from "@/features/workspace";
import { MoneyLine } from "@/features/workspace/ui";
export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const expense = data.expenses.find((item) => item.id === id);
  if (!expense)
    return (
      <Screen>
        <AppText>Expense not found.</AppText>
      </Screen>
    );
  const remove = () =>
    Alert.alert("Delete expense?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await mutation.mutateAsync((repositories) =>
            repositories.expenses.deleteExpense(expense.id),
          );
          router.replace("/(app)/(tabs)/budget");
        },
      },
    ]);
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-lg p-md">
        <View className="gap-2xs">
          <AppText variant="title">{expense.title}</AppText>
          <AppText variant="caption">
            {data.categories.find((category) => category.id === expense.categoryId)?.name ??
              "Uncategorised"}{" "}
            · {expense.paymentStatus}
          </AppText>
        </View>
        <Card className="gap-sm">
          <MoneyLine label="Estimated" value={expense.estimatedPaise ?? 0} />
          <MoneyLine label="Actual" value={expense.actualPaise} />
          <MoneyLine emphasis label="Paid" value={expense.paidPaise} />
          <MoneyLine label="Outstanding" value={expense.actualPaise - expense.paidPaise} />
        </Card>
        {expense.vendorName || expense.dueDate || expense.notes ? (
          <Card className="gap-2xs">
            <AppText variant="heading">Details</AppText>
            {expense.vendorName ? <AppText>{expense.vendorName}</AppText> : null}
            {expense.dueDate ? <AppText>Due {expense.dueDate}</AppText> : null}
            {expense.notes ? <AppText>{expense.notes}</AppText> : null}
          </Card>
        ) : null}
        <Button
          label="Edit expense"
          onPress={() =>
            router.push({ pathname: "/expenses/edit", params: { id: expense.id } } as never)
          }
        />
        <Button label="Delete expense" onPress={remove} variant="destructive" />
      </ScrollView>
    </Screen>
  );
}
