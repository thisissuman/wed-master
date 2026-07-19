import { useLocalSearchParams } from "expo-router";

import { AppText, LoadingState, Screen } from "@/components/ui";
import { GiftForm, useWorkspace } from "@/features/workspace";

export default function EditGiftRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const gift = data.gifts.find((item) => item.id === id);
  return gift ? (
    <GiftForm gift={gift} />
  ) : (
    <Screen className="p-md">
      <AppText>Gift not found.</AppText>
    </Screen>
  );
}
