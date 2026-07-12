import { Alert, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppText, Button, Card, LoadingState, Screen } from "@/components/ui";
import { useWorkspace, useWorkspaceMutation } from "@/features/workspace";
import { formatDate, TaskCard } from "@/features/workspace/ui";
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const event = data.events.find((item) => item.id === id);
  if (!event)
    return (
      <Screen>
        <AppText>Event not found.</AppText>
      </Screen>
    );
  const tasks = data.tasks.filter((task) => task.eventId === event.id);
  const remove = () =>
    Alert.alert("Delete event?", "Related tasks will remain, but become general tasks.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await mutation.mutateAsync((repositories) => repositories.events.deleteEvent(event.id));
          router.replace("/(app)/(tabs)/plan");
        },
      },
    ]);
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-lg p-md">
        <View className="gap-2xs">
          <AppText variant="title">{event.name}</AppText>
          <AppText variant="caption">
            {formatDate(event.date)}
            {event.time ? ` · ${event.time}` : ""}
          </AppText>
          <AppText variant="caption">{event.location ?? "Location to be decided"}</AppText>
        </View>
        <Card>
          <AppText variant="heading">Readiness</AppText>
          <AppText>
            {tasks.filter((task) => task.status === "Completed").length} of {tasks.length} related
            tasks complete
          </AppText>
        </Card>
        {event.notes ? (
          <Card>
            <AppText variant="heading">Notes</AppText>
            <AppText>{event.notes}</AppText>
          </Card>
        ) : null}
        <View className="gap-sm">
          <Button
            label="Edit event"
            onPress={() =>
              router.push({ pathname: "/events/edit", params: { id: event.id } } as never)
            }
          />
          <Button label="Delete event" onPress={remove} variant="destructive" />
        </View>
        <View className="gap-sm">
          <AppText variant="heading">Related tasks</AppText>
          {tasks.map((task) => (
            <TaskCard key={task.id} onPress={() => router.push(`/tasks/${task.id}`)} task={task} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
