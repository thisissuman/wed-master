import { fireEvent, render } from "@testing-library/react-native";

import { demoWorkspace } from "../seed";
import { homeBudgetSummary } from "../selectors";
import { HomeBudgetOverview } from "./HomeBudgetOverview";
import { WeddingHero } from "./WeddingHero";

describe("Home components", () => {
  it("shows real hero data, an accessible countdown, and zero-state planning progress", async () => {
    const screen = await render(
      <WeddingHero
        completedTasks={0}
        daysUntilWedding={150}
        isPhotoPending={false}
        name="Asha & Ravi"
        onPhotoPress={jest.fn()}
        totalTasks={0}
        weddingDate="2026-12-14"
      />,
    );

    expect(screen.getByText("Asha & Ravi")).toBeTruthy();
    expect(screen.getByText("150", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("days", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("Berhampur, Odisha")).toBeNull();
    expect(screen.queryByText("NEXT EVENT")).toBeNull();
    expect(screen.getByTestId("countdown-halo", { includeHiddenElements: true })).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Planning progress" }).props.accessibilityValue,
    ).toEqual({ max: 100, min: 0, now: 0, text: "No planning tasks yet, 0% planned" });
    expect(screen.getByLabelText("150 days until the wedding")).toBeTruthy();
  });

  it("uses explicit wedding-day and past-date states", async () => {
    const props = {
      completedTasks: 1,
      isPhotoPending: false,
      name: "Asha & Ravi",
      onPhotoPress: jest.fn(),
      totalTasks: 2,
      weddingDate: "2026-12-14",
    };
    const screen = await render(<WeddingHero {...props} daysUntilWedding={0} />);

    expect(screen.getByLabelText("Wedding day")).toBeTruthy();
    await screen.rerender(<WeddingHero {...props} daysUntilWedding={-1} />);
    expect(screen.getByLabelText("Wedding date has passed")).toBeTruthy();
  });

  it("falls back safely when a persisted cover file is missing", async () => {
    const screen = await render(
      <WeddingHero
        completedTasks={1}
        coverPhotoUri="file:///missing-cover.jpg"
        daysUntilWedding={2}
        isPhotoPending={false}
        name="Asha & Ravi"
        onPhotoPress={jest.fn()}
        totalTasks={2}
        weddingDate="2026-12-14"
      />,
    );

    expect(screen.getByRole("button", { name: "Change wedding cover photo" })).toBeTruthy();
    await fireEvent(
      screen.getByTestId("wedding-cover-image", { includeHiddenElements: true }),
      "error",
      { nativeEvent: { error: "File not found" } },
    );
    expect(screen.getByRole("button", { name: "Add wedding cover photo" })).toBeTruthy();
  });

  it("shows the actual over-budget percentage and warning", async () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.budgetTargetPaise = 100_000;
    snapshot.expenses = [
      {
        id: "expense",
        title: "Venue",
        categoryId: "venue",
        actualPaise: 125_000,
        paidPaise: 50_000,
        paymentStatus: "Partially Paid",
      },
    ];
    const screen = await render(<HomeBudgetOverview summary={homeBudgetSummary(snapshot)} />);

    expect(screen.getByText("125%", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("Wedding budget")).toBeTruthy();
    expect(screen.getByText("125% used")).toBeTruthy();
    expect(screen.getByText(/Over by/)).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Budget progress" }).props.accessibilityValue.text,
    ).toContain("125%");
    expect(screen.getByLabelText(/Planned, .*wedding target/)).toBeTruthy();
    expect(screen.getByText("₹1,000.00")).toBeTruthy();
  });

  it("uses an em dash and guidance when there is no planned amount", async () => {
    const snapshot = structuredClone(demoWorkspace);
    delete snapshot.wedding.budgetTargetPaise;
    snapshot.expenses = [];
    const screen = await render(<HomeBudgetOverview summary={homeBudgetSummary(snapshot)} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Add a wedding target or expense estimates to calculate budget progress."),
    ).toBeTruthy();
  });
});
