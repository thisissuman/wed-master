import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";

import { AppText, Button, Card, EmptyState, LoadingState, Screen } from "@/components/ui";
import { expenseTotals, taskProgress, useWorkspace } from "@/features/workspace";
import { EventCard, MoneyLine, PageHeader, TaskCard } from "@/features/workspace/ui";

export default function HomeScreen() {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useWorkspace();
  if (isLoading || !data)
    return (
      <Screen>
        <LoadingState label="Opening your wedding workspace" />
      </Screen>
    );
  const progress = taskProgress(data.tasks);
  const totals = expenseTotals(data.expenses);
  const upcomingEvents = [...data.events]
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = upcomingEvents[0];
  const upcomingTasks = [...data.tasks]
    .filter((task) => task.status !== "Completed" && task.status !== "Cancelled")
    .sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"))
    .slice(0, 3);
  const days = Math.max(
    0,
    Math.ceil(
      (new Date(`${data.wedding.date}T12:00:00`).getTime() -
        new Date(`${today}T12:00:00`).getTime()) /
        86_400_000,
    ),
  );
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <PageHeader eyebrow={data.wedding.type} title={data.wedding.name} />
        <Card className="gap-md">
          <View className="gap-2xs">
            <AppText className="text-brand" variant="label">
              WEDDING COUNTDOWN
            </AppText>
            <AppText variant="display">{days} days to go</AppText>
            <AppText variant="caption">
              {data.wedding.location} · {data.wedding.date}
            </AppText>
          </View>
          {nextEvent ? (
            <EventCard
              event={nextEvent}
              onPress={() => router.push(`/events/${nextEvent.id}`)}
              taskCount={data.tasks.filter((task) => task.eventId === nextEvent.id).length}
            />
          ) : (
            <EmptyState
              description="Add your first ceremony to start planning."
              title="No upcoming event"
            />
          )}
        </Card>
        <View className="gap-sm">
          <AppText variant="heading">At a glance</AppText>
          <Card className="gap-sm">
            <MoneyLine emphasis label="Estimated budget" value={totals.estimatedPaise} />
            <MoneyLine label="Actual spending" value={totals.actualPaise} />
            <MoneyLine label="Amount paid" value={totals.paidPaise} />
            <MoneyLine label="Outstanding" value={totals.outstandingPaise} />
          </Card>
          <Card className="gap-2xs">
            <AppText variant="heading">Task progress</AppText>
            <AppText>
              {progress.completed} of {progress.total} active tasks completed
            </AppText>
          </Card>
        </View>
        <View className="gap-sm">
          <AppText variant="heading">Upcoming tasks</AppText>
          {upcomingTasks.length ? (
            upcomingTasks.map((task) => (
              <TaskCard
                eventName={data.events.find((event) => event.id === task.eventId)?.name}
                key={task.id}
                onPress={() => router.push(`/tasks/${task.id}`)}
                task={task}
              />
            ))
          ) : (
            <EmptyState description="Everything is clear for now." title="No upcoming tasks" />
          )}
        </View>
        <View className="gap-sm">
          <AppText variant="heading">Quick actions</AppText>
          <Button label="Add task" onPress={() => router.push("/tasks/new")} />
          <Button
            label="Add expense"
            onPress={() => router.push("/expenses/new")}
            variant="secondary"
          />
          <Button
            label="Add event"
            onPress={() => router.push("/events/new")}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
