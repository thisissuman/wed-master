import { render } from "@testing-library/react-native";

import { Button } from "./Button";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("keeps optional actions alongside the functional page title", async () => {
    const screen = await render(
      <PageHeader
        actions={<Button label="Add" onPress={jest.fn()} variant="ghost" />}
        description="Ideas for your celebration"
        title="Inspire"
      />,
    );

    expect(screen.getByRole("header", { name: "Inspire" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
    expect(screen.getByText("Ideas for your celebration")).toBeTruthy();
  });
});
