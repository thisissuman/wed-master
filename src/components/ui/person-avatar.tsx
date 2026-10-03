import { View } from "react-native";

import { AppText } from "./AppText";

const sizeClassNames = {
  md: "h-12 w-12",
  lg: "h-14 w-14",
  sm: "h-10 w-10",
} as const;

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return `${first}${last}`.toLocaleUpperCase("en-IN");
}

export function PersonAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: keyof typeof sizeClassNames;
}) {
  return (
    <View
      accessibilityElementsHidden
      className={`${sizeClassNames[size]} shrink-0 items-center justify-center rounded-full bg-primarySoft`}
      importantForAccessibility="no-hide-descendants"
    >
      <AppText tone="primary" variant={size === "lg" ? "heading" : "label"}>
        {initialsForName(name)}
      </AppText>
    </View>
  );
}
