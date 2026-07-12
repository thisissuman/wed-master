import { toUserMessage } from "./to-user-message";

describe("toUserMessage", () => {
  it("returns a safe, actionable network error", () => {
    expect(toUserMessage(new Error("Network request failed"))).toBe(
      "We could not reach the service. Check your connection and try again.",
    );
  });
});
