import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { demoWorkspace } from "../seed";
import { homeBudgetSummary } from "../selectors";
import { HomeBudgetOverview } from "./HomeBudgetOverview";
import { WeddingHero } from "./WeddingHero";
import { weddingCardThemes } from "./wedding-card-themes";

describe("Home components", () => {
  it("shows real hero data, an accessible countdown, and zero-state planning progress", async () => {
    const screen = await render(
      <WeddingHero
        completedTasks={0}
        daysUntilWedding={150}
        isPhotoPending={false}
        keepsakeMessage="Forever starts in all these little moments."
        name="Asha & Ravi"
        onPhotoPress={jest.fn()}
        totalTasks={0}
        weddingDate="2026-12-14"
      />,
    );

    expect(screen.getByRole("header", { name: "Asha & Ravi" })).toBeTruthy();
    expect(screen.getByText("150", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("days remaining", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("Berhampur, Odisha")).toBeNull();
    expect(screen.queryByText("NEXT EVENT")).toBeNull();
    expect(screen.getByTestId("wedding-hero").props.colors).toHaveLength(3);
    expect(
      screen.getByTestId("wedding-hero-artwork", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(
      screen.getByTestId("wedding-default-cover-monogram", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Planning progress").props.accessibilityValue).toEqual({
      max: 100,
      min: 0,
      now: 0,
      text: "No planning tasks yet, 0% planned",
    });
    expect(screen.getByLabelText("Planning progress").props.accessibilityRole).toBe("progressbar");
    expect(screen.getByLabelText("150 days remaining")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wedding card for Asha & Ravi" })).toBeTruthy();
    expect(screen.queryByText("A little something for the two of you")).toBeNull();
    expect(screen.queryByText("Open")).toBeNull();
  });

  it("centres the keepsake card, then flips to the editable message", async () => {
    const message = "Forever starts in all these little moments.";
    const screen = await render(
      <WeddingHero
        completedTasks={1}
        daysUntilWedding={14}
        isPhotoPending={false}
        keepsakeMessage={message}
        name="Asha & Ravi"
        onPhotoPress={jest.fn()}
        totalTasks={4}
        weddingDate="2026-12-14"
      />,
    );

    await fireEvent(screen.getByTestId("wedding-hero-source"), "layout", {
      nativeEvent: { layout: { height: 286, width: 379, x: 0, y: 0 } },
    });
    await fireEvent.press(screen.getByRole("button", { name: "Wedding card for Asha & Ravi" }));

    expect(screen.getByTestId("wedding-keepsake-dialog").props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByTestId("wedding-keepsake-card").props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 286 })]),
    );
    expect(screen.getByText("Tap the card")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Flip to our message" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Tap the card" }));

    expect(screen.getByText(`“${message}”`)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wedding message. Tap the card" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Close keepsake" }));
    expect(screen.queryByTestId("wedding-keepsake-dialog")).toBeNull();
  });

  it("uses the selected Lavender Pearl artwork and palette", async () => {
    const screen = await render(
      <WeddingHero
        completedTasks={1}
        daysUntilWedding={14}
        isPhotoPending={false}
        name="Asha & Ravi"
        onPhotoPress={jest.fn()}
        totalTasks={4}
        weddingCardThemeId="lavenderPearl"
        weddingDate="2026-12-14"
      />,
    );

    expect(
      screen.getByTestId("wedding-hero-artwork", { includeHiddenElements: true }).props.source,
    ).toEqual([weddingCardThemes.lavenderPearl.artwork]);
    expect(
      screen.getByTestId("wedding-default-cover-monogram", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("describes wedding day and past dates accurately", async () => {
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
    expect(screen.getByText("Congratulations!")).toBeTruthy();
    expect(screen.queryByLabelText("Planning progress")).toBeNull();
    expect(screen.getByRole("header", { name: "Asha & Ravi" })).toBeTruthy();
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

  it("uses a flexible semantic hero at large system text sizes", async () => {
    const dimensions = jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({
      fontScale: 2,
      height: 800,
      scale: 2,
      width: 360,
    });
    try {
      const screen = await render(
        <WeddingHero
          completedTasks={1}
          daysUntilWedding={14}
          isPhotoPending={false}
          name="Asha & Ravi"
          onPhotoPress={jest.fn()}
          totalTasks={4}
          weddingDate="2026-12-14"
        />,
      );

      expect(
        screen.getByRole("header", { name: "Asha & Ravi" }).props.numberOfLines,
      ).toBeUndefined();
      expect(screen.getByLabelText("14 days remaining")).toBeTruthy();
      expect(screen.getByLabelText("Planning progress")).toBeTruthy();
    } finally {
      dimensions.mockRestore();
    }
  });

  it("shows the actual over-budget percentage and warning", async () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.budgetTargetPaise = 100_000;
    snapshot.expenses = [
      {
        id: "expense",
        title: "Venue",
        categoryId: "venue",
        createdAt: "2026-07-23T10:00:00.000Z",
        actualPaise: 125_000,
        paidPaise: 50_000,
        paymentStatus: "Partially Paid",
      },
    ];
    const onPress = jest.fn();
    const screen = await render(
      <HomeBudgetOverview onPress={onPress} summary={homeBudgetSummary(snapshot)} />,
    );

    expect(screen.getByText("Wedding budget")).toBeTruthy();
    expect(screen.getAllByText(/Over by/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Open Budget & expenses/ }).props.accessibilityLabel,
    ).toContain("125% of target spent");
    expect(screen.getByText("Target")).toBeTruthy();
    expect(screen.getByText("Net spent")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Open Budget & expenses/ }).props.className,
    ).toContain("shadow-raised");
    expect(screen.queryByText("Review the largest spending categories")).toBeNull();
    expect(
      screen.getByRole("button", { name: /Open Budget & expenses/ }).props.accessibilityLiveRegion,
    ).toBe("polite");
    await fireEvent.press(screen.getByRole("button", { name: /Open Budget & expenses/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses an em dash and target guidance when there is no budget target", async () => {
    const snapshot = structuredClone(demoWorkspace);
    delete snapshot.wedding.budgetTargetPaise;
    snapshot.expenses = [];
    const screen = await render(
      <HomeBudgetOverview onPress={jest.fn()} summary={homeBudgetSummary(snapshot)} />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("Set your budget target")).toBeTruthy();
    expect(screen.getByText("Not set")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Open Budget & expenses/ }).props.accessibilityLabel,
    ).toContain("No target set");
  });
});
