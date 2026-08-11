import { workspaceSnapshotSchema } from "../workspace-schema";
import { createStressWorkspace, localBetaStressScale } from "./stress-fixture";

describe("local beta stress fixture", () => {
  it("creates deterministic schema-valid high-volume data", () => {
    const first = createStressWorkspace();
    const second = createStressWorkspace();
    const result = workspaceSnapshotSchema.safeParse(first);
    if (!result.success) throw new Error(JSON.stringify(result.error.issues, null, 2));
    const parsed = result.data;

    expect(parsed.households).toHaveLength(localBetaStressScale.guestCount);
    expect(parsed.households.flatMap((household) => household.guests)).toHaveLength(
      localBetaStressScale.guestCount,
    );
    expect(parsed.tasks).toHaveLength(localBetaStressScale.taskCount);
    expect(parsed.expenses).toHaveLength(localBetaStressScale.expenseCount);
    expect(second).toEqual(first);
  });
});
