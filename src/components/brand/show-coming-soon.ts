import { Alert } from "react-native";

export function showComingSoon(feature: string) {
  Alert.alert(feature, `${feature} is coming in a future Mangalya release.`);
}
