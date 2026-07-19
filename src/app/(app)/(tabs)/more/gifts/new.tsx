import { GiftForm } from "@/features/workspace";
import { useLocalSearchParams } from "expo-router";
import type { GiftKind } from "@/features/workspace";

export default function NewGiftRoute() {
  const { kind } = useLocalSearchParams<{ kind?: GiftKind }>();
  return <GiftForm initialKind={kind} />;
}
