import type { Event } from "@sentry/react-native";

import { sanitizeSentryEvent } from "./sentry-scrubbing";

describe("Sentry privacy scrubbing", () => {
  it("removes arbitrary text, private context, local paths, spans, and unsafe tags", () => {
    const event: Event = {
      breadcrumbs: [{ message: "Opened Asha's wedding" }],
      contexts: { wedding: { name: "Asha and Dev", nested: { phone: "+91 98765 43210" } } },
      exception: {
        values: [
          {
            type: "AshaPrivateError",
            value: "Call +91 98765 43210 about INR 125,000 at /Users/kira/private.json",
            module: "AshaWedding",
            stacktrace: {
              frames: [
                {
                  abs_path: "/Users/kira/private/workspace.ts",
                  context_line: "saveWedding('Asha')",
                  filename: "/Users/kira/private/workspace.ts",
                  function: "saveAshaWedding",
                  lineno: 42,
                  vars: { budgetPaise: 125000 },
                },
              ],
            },
          },
        ],
      },
      extra: { budgetPaise: 125000 },
      fingerprint: ["Asha", "9876543210"],
      message: "Could not read file:///Users/kira/private/backup.json",
      request: { url: "mangalya://private-workspace" },
      spans: [
        {
          data: { name: "Asha" },
          description: "Private operation",
          span_id: "span",
          start_timestamp: 1,
          trace_id: "trace",
        },
      ],
      tags: {
        error_code: "storage_write",
        family_name: "Asha",
        operation: "workspace_write",
        phone: "9876543210",
      },
      threads: { values: [{ id: 1, name: "Asha", main: true }] },
      transaction: "Asha wedding",
      user: { id: "family-planner" },
    };

    const scrubbed = sanitizeSentryEvent(event);

    expect(scrubbed.breadcrumbs).toBeUndefined();
    expect(scrubbed.contexts).toBeUndefined();
    expect(scrubbed.extra).toBeUndefined();
    expect(scrubbed.fingerprint).toBeUndefined();
    expect(scrubbed.request).toBeUndefined();
    expect(scrubbed.spans).toBeUndefined();
    expect(scrubbed.threads).toBeUndefined();
    expect(scrubbed.transaction).toBeUndefined();
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.message).toBe("An application error occurred.");
    expect(scrubbed.tags).toEqual({
      error_code: "storage_write",
      operation: "workspace_write",
    });
    expect(scrubbed.exception?.values?.[0]).toEqual({
      type: "Error",
      value: "An application error occurred.",
      stacktrace: {
        frames: [
          {
            addr_mode: undefined,
            colno: undefined,
            debug_id: undefined,
            filename: "[source file]",
            in_app: undefined,
            instruction_addr: undefined,
            lineno: 42,
            platform: undefined,
          },
        ],
        frames_omitted: undefined,
      },
    });
  });

  it("drops unknown tag values and preserves allowlisted error types", () => {
    const scrubbed = sanitizeSentryEvent({
      exception: { values: [{ type: "StorageWriteError", value: "Disk full for Asha" }] },
      tags: { error_code: "private-error-code", operation: "Asha wedding" },
    });

    expect(scrubbed.tags).toBeUndefined();
    expect(scrubbed.exception?.values?.[0]).toMatchObject({
      type: "StorageWriteError",
      value: "An application error occurred.",
    });
  });
});
