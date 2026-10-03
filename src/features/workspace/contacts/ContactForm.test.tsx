import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Contacts from "expo-contacts/legacy";
import { Alert, Platform } from "react-native";
import { ContactForm } from "./ContactForm";
import { demoWorkspace as mockDemoWorkspace } from "../seed";

jest.mock("expo-contacts/legacy", () => ({
  PermissionStatus: { GRANTED: "granted", DENIED: "denied" },
  requestPermissionsAsync: jest.fn(),
  presentContactPickerAsync: jest.fn(),
}));
jest.mock("../provider", () => ({
  useWorkspace: () => ({ data: mockDemoWorkspace }),
  useWorkspaceMutation: () => ({ isPending: false, error: null, mutateAsync: jest.fn() }),
}));
jest.mock("../useUnsavedChangesGuard", () => ({
  useUnsavedChangesGuard: () => ({ exitAfterSave: jest.fn(), requestExit: jest.fn() }),
}));
const picker = jest.mocked(Contacts.presentContactPickerAsync);
const permission = jest.mocked(Contacts.requestPermissionsAsync);
const originalPlatform = Platform.OS;
const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
const original = { id: "contact", name: "Original name", phone: "9876543210", role: "Driver" };

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
  permission.mockResolvedValue({
    granted: true,
    canAskAgain: true,
    status: Contacts.PermissionStatus.GRANTED,
    expires: "never",
  });
});
afterAll(() => {
  Object.defineProperty(Platform, "OS", { value: originalPlatform });
  alert.mockRestore();
});

it("copies a saved contact and allows a custom wedding name", async () => {
  picker.mockResolvedValue({
    id: "phone-contact",
    contactType: "person",
    name: "Saved name",
    phoneNumbers: [{ label: "mobile", number: "9123456789" }],
  });
  const screen = await render(<ContactForm />);
  await fireEvent.press(screen.getByRole("button", { name: "Choose from contacts" }));
  await waitFor(() => expect(screen.getByLabelText("Name").props.value).toBe("Saved name"));
  expect(screen.getByLabelText("Phone number").props.value).toBe("9123456789");
  await fireEvent.changeText(screen.getByLabelText("Name"), "Wedding driver");
  expect(screen.getByLabelText("Name").props.value).toBe("Wedding driver");
});

it("asks which number to use and preserves the role", async () => {
  picker.mockResolvedValue({
    id: "phone-contact",
    contactType: "person",
    name: "Saved name",
    phoneNumbers: [
      { label: "mobile", number: "9123456789" },
      { label: "work", number: "9987654321" },
    ],
  });
  const screen = await render(<ContactForm contact={original} />);
  await fireEvent.press(screen.getByRole("button", { name: "Choose from contacts" }));
  await fireEvent.press(await screen.findByRole("button", { name: "work: 9987654321" }));
  expect(screen.getByLabelText("Phone number").props.value).toBe("9987654321");
  expect(screen.getByLabelText("Role or service").props.value).toBe("Driver");
});

it.each(["cancel", "missing", "error", "denied"])(
  "keeps manual fields intact on %s",
  async (outcome) => {
    if (outcome === "cancel") picker.mockResolvedValue(null);
    if (outcome === "missing")
      picker.mockResolvedValue({ id: "phone-contact", contactType: "person", name: "No number" });
    if (outcome === "error") picker.mockRejectedValue(new Error("Picker failed"));
    if (outcome === "denied")
      permission.mockResolvedValue({
        granted: false,
        canAskAgain: false,
        status: Contacts.PermissionStatus.DENIED,
        expires: "never",
      });
    const screen = await render(<ContactForm contact={original} />);
    await fireEvent.press(screen.getByRole("button", { name: "Choose from contacts" }));
    await waitFor(() => expect(permission).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Name").props.value).toBe(original.name);
    expect(screen.getByLabelText("Phone number").props.value).toBe(original.phone);
    if (outcome === "denied") expect(picker).not.toHaveBeenCalled();
  },
);

it("keeps the web form manual", async () => {
  Object.defineProperty(Platform, "OS", { value: "web" });
  const screen = await render(<ContactForm />);
  expect(screen.queryByRole("button", { name: "Choose from contacts" })).toBeNull();
  expect(screen.getByLabelText("Phone number")).toBeTruthy();
});
