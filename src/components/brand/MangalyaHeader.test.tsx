import { fireEvent, render } from "@testing-library/react-native";

import { MangalyaHeader } from "./MangalyaHeader";

describe("MangalyaHeader", () => {
  it("renders the wordmark without inventing an action", async () => {
    const screen = await render(<MangalyaHeader />);

    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByLabelText("Mangalya")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Your wedding, beautifully organized")).toBeNull();
  });

  it("renders an accessible search action only when supplied", async () => {
    const onSearch = jest.fn();
    const screen = await render(<MangalyaHeader onSearch={onSearch} />);

    await fireEvent.press(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
