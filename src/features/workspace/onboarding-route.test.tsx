import { fireEvent, render } from "@testing-library/react-native";
import { Text, View } from "react-native";

import OnboardingLayout from "@/app/(onboarding)/_layout";
import { WorkspaceCapacityError } from "@/lib/errors";

import { WorkspaceCorruptionError, WorkspaceEmptyError } from "./local-repositories";
import { useWorkspace } from "./provider";
import { demoWorkspace } from "./seed";

function MockRedirect({ href }: { href: string }) {
  return <Text>{`redirect:${href}`}</Text>;
}

function MockStack() {
  return <View testID="onboarding-stack" />;
}

function MockRecoveryScreen({ error }: { error: Error }) {
  return <Text>{`recovery:${error.name}`}</Text>;
}

jest.mock("expo-router", () => ({ Redirect: MockRedirect, Stack: MockStack }));

jest.mock("./provider", () => ({ useWorkspace: jest.fn() }));

jest.mock("./recovery/WorkspaceRecoveryScreen", () => ({
  WorkspaceRecoveryScreen: MockRecoveryScreen,
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const refetch = jest.fn();

function workspaceResult(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    error: undefined,
    isError: false,
    isLoading: false,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useWorkspace>;
}

describe("onboarding route guard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects a direct onboarding deep link when a valid workspace exists", async () => {
    mockUseWorkspace.mockReturnValue(workspaceResult({ data: demoWorkspace }));

    const screen = await render(<OnboardingLayout />);

    expect(screen.getByText("redirect:/(app)/(tabs)")).toBeTruthy();
    expect(screen.queryByTestId("onboarding-stack")).toBeNull();
  });

  it("allows guided setup only for an empty or tombstoned workspace", async () => {
    mockUseWorkspace.mockReturnValue(
      workspaceResult({ error: new WorkspaceEmptyError(), isError: true }),
    );

    const screen = await render(<OnboardingLayout />);

    expect(screen.getByTestId("onboarding-stack")).toBeTruthy();
  });

  it.each([new WorkspaceCorruptionError("unsafe", "raw-local-copy"), new WorkspaceCapacityError()])(
    "opens recovery for %s",
    async (error) => {
      mockUseWorkspace.mockReturnValue(workspaceResult({ error, isError: true }));

      const screen = await render(<OnboardingLayout />);

      expect(screen.getByText(`recovery:${error.name}`)).toBeTruthy();
      expect(screen.queryByTestId("onboarding-stack")).toBeNull();
    },
  );

  it("shows a safe retry state for an unknown storage failure", async () => {
    mockUseWorkspace.mockReturnValue(
      workspaceResult({ error: new Error("private adapter detail"), isError: true }),
    );

    const screen = await render(<OnboardingLayout />);
    expect(screen.queryByText(/private adapter detail/)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
