import { useLocalSearchParams } from "expo-router";

import { ContactForm, useWorkspace } from "@/features/workspace";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";

export default function EditContactRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workspace = useWorkspace();
  if (workspace.isError)
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/more/emergency-contacts"
        onRetry={() => void workspace.refetch()}
        title="We could not open this contact"
      />
    );
  if (!workspace.data) return <RouteLoading label="Opening contact" />;
  const contact = workspace.data.emergencyContacts.find((item) => item.id === id);
  return contact ? (
    <ContactForm contact={contact} />
  ) : (
    <RouteNotFound entity="Contact" fallback="/more/emergency-contacts" />
  );
}
