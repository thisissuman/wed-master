import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AppText } from "./AppText";
import { Disclosure } from "./Disclosure";

describe("Disclosure", () => {
  it("keeps optional fields hidden until requested and collapses them again", async () => {
    const screen = await render(
      <Disclosure description="Optional context" title="Add details">
        <AppText>Optional field</AppText>
      </Disclosure>,
    );

    expect(screen.queryByText("Optional field")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Add details" }));
    expect(await screen.findByText("Optional field")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Add details" }));
    await waitFor(() => expect(screen.queryByText("Optional field")).toBeNull());
  });
});
