const fileSystem = jest.requireActual("fs") as {
  readdirSync: (
    path: string,
    options: { withFileTypes: true },
  ) => { isDirectory: () => boolean; name: string }[];
  readFileSync: (path: string, encoding: "utf8") => string;
};
const paths = jest.requireActual("path") as {
  join: (...paths: string[]) => string;
  relative: (from: string, to: string) => string;
};

const sourceRoot = paths.join(process.cwd(), "src");

const collectProductionSources = (directory: string): string[] =>
  fileSystem.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = paths.join(directory, entry.name);
    if (entry.isDirectory()) return collectProductionSources(path);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });

const intentionalArtworkSources = new Set([
  "components/brand/MangalyaHeartAccent.tsx",
  "features/workspace/home/wedding-card-themes.ts",
  "features/workspace/setup/onboarding-theme.ts",
  "features/workspace/setup/OnboardingVisuals.tsx",
]);

describe("semantic colour boundary", () => {
  it("prevents production code from restoring the removed fixed semantic token API", () => {
    const offenders = collectProductionSources(sourceRoot).filter((path) =>
      /tokens\.(?:colors|gradients|elevation)\b/.test(fileSystem.readFileSync(path, "utf8")),
    );

    expect(offenders.map((path) => paths.relative(sourceRoot, path))).toEqual([]);
  });

  it("keeps fixed colours inside intentional artwork or palette definitions", () => {
    const offenders = collectProductionSources(sourceRoot)
      .map((path) => ({ path, source: fileSystem.readFileSync(path, "utf8") }))
      .filter(({ path, source }) => {
        const sourcePath = paths.relative(sourceRoot, path);
        return (
          /(?:#[\da-f]{6}|rgba?\()/i.test(source) && !intentionalArtworkSources.has(sourcePath)
        );
      })
      .map(({ path }) => paths.relative(sourceRoot, path));

    expect(offenders).toEqual([]);
  });
});
