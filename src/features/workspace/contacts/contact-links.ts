import * as Linking from "expo-linking";
import { Alert } from "react-native";

export async function openContactLink(kind: "tel" | "sms", phone: string) {
  const normalized = phone.replace(/[^+0-9]/g, "");
  const url = `${kind}:${normalized}`;
  try {
    if (!normalized || !(await Linking.canOpenURL(url))) {
      throw new Error("unsupported");
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Action unavailable",
      kind === "tel"
        ? "This device cannot place a call to that number."
        : "This device cannot open a message for that number.",
    );
  }
}
