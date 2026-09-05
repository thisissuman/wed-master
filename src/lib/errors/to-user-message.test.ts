import { AppError, StorageWriteError } from "./app-error";
import { genericErrorMessage, toUserMessage } from "./to-user-message";

describe("toUserMessage", () => {
  it("returns only the allowlisted message from a typed application error", () => {
    expect(toUserMessage(new StorageWriteError(new Error("/private/path and 9876543210")))).toBe(
      "Mangalya could not save this change. Free some device storage and try again.",
    );
  });

  it.each([
    new Error("Network request failed for Asha at /private/backup.json"),
    "disk full",
    { message: "private parser details" },
    null,
  ])("keeps unknown failures generic", (error) => {
    expect(toUserMessage(error)).toBe(genericErrorMessage);
  });

  it("does not let callers supply arbitrary safe copy", () => {
    const error = new AppError("invalid_backup", new Error("Asha and Dev"));
    expect(toUserMessage(error)).toBe("This file is not a valid or supported Mangalya backup.");
  });
});
