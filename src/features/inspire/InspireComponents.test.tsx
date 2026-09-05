import { render, userEvent } from "@testing-library/react-native";

import { InspirationActionSheet } from "./InspirationActionSheet";
import { InspireEmptyState, InspirationTile, boardAspectRatio } from "./InspireComponents";
import type { Inspiration } from "./types";

const inspiration: Inspiration = {
  id: "inspiration-1",
  weddingId: "wedding-1",
  category: "stage",
  sourceType: "gallery",
  media: {
    detailUri: "file:///detail.webp",
    detailWidth: 1_200,
    detailHeight: 1_800,
    detailSizeBytes: 100_000,
    thumbnailUri: "file:///thumbnail.webp",
    thumbnailWidth: 480,
    thumbnailHeight: 720,
    thumbnailSizeBytes: 20_000,
    mimeType: "image/webp",
  },
  title: "Lavender mandap",
  eventId: "event-wedding",
  isFavourite: true,
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T10:00:00.000Z",
};

describe("Inspire components", () => {
  it("keeps exact natural image ratios, including extreme compositions", () => {
    expect(boardAspectRatio(480, 720)).toBeCloseTo(2 / 3);
    expect(boardAspectRatio(12_000, 1_000)).toBe(12);
    expect(boardAspectRatio(0, 720)).toBe(1);
  });

  it("exposes each tile as one contextual image button with long-press actions", async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    const screen = await render(
      <InspirationTile
        eventName="Wedding"
        inspiration={inspiration}
        onLongPress={onLongPress}
        onPress={onPress}
      />,
    );
    const tile = screen.getByRole("imagebutton", {
      name: "Lavender mandap, Stage, shortlisted, linked to Wedding",
    });

    await userEvent.press(tile);
    await userEvent.longPress(tile);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("offers five read-only examples and one clear empty-board action", async () => {
    const onAdd = jest.fn();
    const screen = await render(<InspireEmptyState columnCount={2} onAdd={onAdd} />);

    await userEvent.press(screen.getByText("Add your first inspiration"));

    expect(screen.getByRole("header", { name: "A little inspiration to begin" })).toBeTruthy();
    expect(screen.getAllByRole("image")).toHaveLength(5);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("keeps category and event changes reachable from detail overflow", async () => {
    const onClose = jest.fn();
    const onEditCategory = jest.fn();
    const onEditEvent = jest.fn();
    const screen = await render(
      <InspirationActionSheet
        inspiration={inspiration}
        onClose={onClose}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onEditCategory={onEditCategory}
        onEditEvent={onEditEvent}
        onFavourite={jest.fn()}
        onShare={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Edit details" })).toBeNull();
    await userEvent.press(screen.getByRole("button", { name: "Change category" }));
    await userEvent.press(screen.getByRole("button", { name: "Change linked event" }));

    expect(onEditCategory).toHaveBeenCalledWith(inspiration);
    expect(onEditEvent).toHaveBeenCalledWith(inspiration);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
