import { LocalWorkspaceStore, createLocalRepositories } from "./local-repositories";

describe("local repositories", () => {
  it("persists changes through the storage adapter", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));
    await repositories.tasks.createTask({
      title: "Persist me",
      priority: "Low",
      status: "Not Started",
    });
    const reloaded = createLocalRepositories(new LocalWorkspaceStore(storage));
    expect((await reloaded.tasks.listTasks()).some((task) => task.title === "Persist me")).toBe(
      true,
    );
  });
});
