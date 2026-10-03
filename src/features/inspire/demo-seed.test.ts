import { demoInspirationSeedManifest } from "./demo-seed";

describe("Inspire demo seed manifest", () => {
  it("contains a varied project-owned pack without creating production records implicitly", () => {
    expect(demoInspirationSeedManifest).toHaveLength(12);
    expect(
      new Set(demoInspirationSeedManifest.map(({ category }) => category)).size,
    ).toBeGreaterThan(7);
    expect(demoInspirationSeedManifest.some(({ width, height }) => width > height)).toBe(true);
    expect(demoInspirationSeedManifest.some(({ width, height }) => height > width)).toBe(true);
    expect(demoInspirationSeedManifest.filter(({ isFavourite }) => isFavourite)).toHaveLength(4);
  });
});
