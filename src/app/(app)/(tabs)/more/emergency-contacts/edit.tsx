import { useLocalSearchParams } from "expo-router";

import { AppText, LoadingState, Screen } from "@/components/ui";
import { ContactForm, useWorkspace } from "@/features/workspace";

export default function EditContactRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const contact = data.emergencyContacts.find((item) => item.id === id);
  return contact ? (
    <ContactForm contact={contact} />
  ) : (
    <Screen className="p-md">
      <AppText>Contact not found.</AppText>
    </Screen>
  );
}
