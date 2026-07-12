import { Link } from "expo-router";

import { AppText, Button, Screen } from "@/components/ui";

export default function NotFoundRoute() {
  return (
    <Screen className="items-start justify-center gap-lg p-md">
      <AppText variant="title">This page is unavailable</AppText>
      <AppText className="text-textSecondary">Return to the Wed Master foundation shell.</AppText>
      <Link href="/(app)/(tabs)" asChild>
        <Button label="Go home" />
      </Link>
    </Screen>
  );
}
