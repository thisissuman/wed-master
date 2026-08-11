import type { Event } from "@sentry/react-native";

import { sanitizeSentryEvent } from "./sentry-scrubbing";

describe("Sentry privacy scrubbing", () => {
  it("removes private context and redacts paths, phone numbers, and financial values", () => {
    const event: Event = {
      breadcrumbs: [{ message: "Opened Asha's wedding" }],
      contexts: { wedding: { name: "Asha and Dev" } },
      exception: {
        values: [
          {
            type: "Error",
            value: "Call +91 98765 43210 about amount=125000",
            stacktrace: {
              frames: [
                {
                  abs_path: "/Users/kira/private/workspace.ts",
                  filename: "/Users/kira/private/workspace.ts",
                  function: "saveWorkspace",
                },
              ],
            },
          },
        ],
      },
      extra: { budgetPaise: 125000 },
      message: "Could not read file:///Users/kira/private/backup.json",
      request: { url: "mangalya://private-workspace" },
      user: { id: "family-planner" },
    };

    const scrubbed = sanitizeSentryEvent(event);

    expect(scrubbed.breadcrumbs).toBeUndefined();
    expect(scrubbed.contexts).toBeUndefined();
    expect(scrubbed.extra).toBeUndefined();
    expect(scrubbed.request).toBeUndefined();
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.message).toBe("Could not read [local path]");
    expect(scrubbed.exception?.values?.[0]?.value).toBe("Call [phone] about [financial value]");
    expect(scrubbed.exception?.values?.[0]?.stacktrace?.frames?.[0]).toMatchObject({
      abs_path: undefined,
      filename: "[local path]",
      function: "saveWorkspace",
    });
  });
});
