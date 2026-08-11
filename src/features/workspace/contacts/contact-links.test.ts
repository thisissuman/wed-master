import * as Linking from "expo-linking";
import { Alert } from "react-native";

import { openContactLink } from "./contact-links";

jest.mock("expo-linking", () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

const mockedLinking = jest.mocked(Linking);

describe("emergency contact actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens a normalized phone link after an explicit action", async () => {
    mockedLinking.canOpenURL.mockResolvedValue(true);
    mockedLinking.openURL.mockResolvedValue(true);

    await openContactLink("tel", "+91 98765-43210");

    expect(mockedLinking.openURL).toHaveBeenCalledWith("tel:+919876543210");
  });

  it("shows feedback when the device cannot handle the action", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockedLinking.canOpenURL.mockResolvedValue(false);

    await openContactLink("sms", "100");

    expect(alert).toHaveBeenCalledWith(
      "Action unavailable",
      "This device cannot open a message for that number.",
    );
    expect(mockedLinking.openURL).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
