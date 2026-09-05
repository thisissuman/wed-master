import { Asset } from "expo-asset";

import { clearInspirationMedia, createInspirationMediaDraftFromSource } from "./media";
import type {
  Inspiration,
  InspirationCategory,
  InspirationMediaDraft,
  InspirationRepository,
} from "./types";

type DemoInspirationSeed = {
  asset: number;
  category: InspirationCategory;
  eventName?: string;
  height: number;
  isFavourite?: boolean;
  note?: string;
  title: string;
  width: number;
};

export const demoInspirationSeedManifest: readonly DemoInspirationSeed[] = [
  {
    asset: require("../../../assets/images/mangalya/inspire/mandap-evening-lavender-florals.webp"),
    category: "stage",
    eventName: "Wedding",
    height: 1_024,
    isFavourite: true,
    note: "Lavender florals with a warm evening glow.",
    title: "Evening floral mandap",
    width: 1_536,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/bridal-plum-lehenga-textile.webp"),
    category: "outfits",
    eventName: "Wedding",
    height: 1_536,
    isFavourite: true,
    note: "Rich plum textile with restrained antique-gold detail.",
    title: "Plum bridal textile",
    width: 1_024,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/kundan-jewellery-plum-silk.webp"),
    category: "jewellery",
    eventName: "Wedding",
    height: 1_402,
    note: "Layered kundan styling against deep plum silk.",
    title: "Kundan jewellery layers",
    width: 1_122,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/mehendi-lavender-jasmine.webp"),
    category: "mehendi",
    eventName: "Mehendi",
    height: 1_536,
    isFavourite: true,
    note: "Jasmine and lavender accents for a quiet mehendi palette.",
    title: "Mehendi floral detail",
    width: 1_024,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/invitation-ivory-lavender-stationery.webp"),
    category: "invitations",
    height: 1_086,
    note: "Ivory papers, soft lavender and restrained brass accents.",
    title: "Lavender stationery palette",
    width: 1_448,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/reception-table-ivory-florals-evening.webp"),
    category: "decor",
    eventName: "Reception",
    height: 992,
    note: "Ivory flowers and candlelight for the reception tables.",
    title: "Evening reception table",
    width: 1_586,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/mandap-garden-daylight-ivory-florals.webp"),
    category: "stage",
    eventName: "Wedding",
    height: 1_024,
    note: "An airy garden mandap with natural foliage and pale timber.",
    title: "Daylight garden mandap",
    width: 1_536,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/saree-emerald-handloom-drape.webp"),
    category: "outfits",
    eventName: "Reception",
    height: 1_402,
    note: "Emerald handloom silk with a subtle zari border.",
    title: "Emerald handloom saree",
    width: 1_122,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/haldi-courtyard-marigold-daylight.webp"),
    category: "decor",
    eventName: "Haldi",
    height: 1_086,
    note: "Marigold, jasmine, cane and terracotta in daylight.",
    title: "Haldi courtyard palette",
    width: 1_448,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/wedding-candid-joined-hands-dusk.webp"),
    category: "photography",
    eventName: "Wedding",
    height: 1_536,
    isFavourite: true,
    note: "A face-free, documentary moment at dusk.",
    title: "Quiet candid moment",
    width: 1_024,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/wedding-menu-vegetarian-tasting-detail.webp"),
    category: "food",
    eventName: "Wedding",
    height: 1_402,
    note: "Contemporary vegetarian tasting plates with deep-plum linen.",
    title: "Vegetarian tasting table",
    width: 1_122,
  },
  {
    asset: require("../../../assets/images/mangalya/inspire/heritage-haveli-courtyard-blue-hour.webp"),
    category: "venue",
    eventName: "Wedding",
    height: 992,
    note: "A restored sandstone courtyard with restrained lantern light.",
    title: "Heritage courtyard at blue hour",
    width: 1_586,
  },
];

export const demoInspirationPreviewManifest = demoInspirationSeedManifest.slice(0, 5);

export async function installDemoInspirationPack(
  repository: InspirationRepository,
  weddingId: string,
  events: readonly { id: string; name: string }[],
): Promise<Inspiration[]> {
  await repository.clear();
  if (!clearInspirationMedia()) {
    throw new Error("Mangalya could not clear the previous inspiration photos.");
  }

  try {
    const drafts: { draft: InspirationMediaDraft; seed: DemoInspirationSeed }[] = [];
    for (const [index, seed] of demoInspirationSeedManifest.entries()) {
      const asset = Asset.fromModule(seed.asset);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri) throw new Error("A demo inspiration image is unavailable.");
      const draft = await createInspirationMediaDraftFromSource(
        { uri, width: seed.width, height: seed.height, type: "image" },
        "gallery",
        { createId: () => `demo-inspiration-media-${index + 1}` },
      );
      drafts.push({ draft, seed });
    }

    const eventByName = new Map(
      events.map((event) => [event.name.toLocaleLowerCase("en-IN"), event.id]),
    );
    const created: Inspiration[] = [];
    for (const { draft, seed } of drafts) {
      created.push(
        await repository.create({
          weddingId,
          category: seed.category,
          eventId: seed.eventName
            ? eventByName.get(seed.eventName.toLocaleLowerCase("en-IN"))
            : undefined,
          isFavourite: seed.isFavourite,
          media: draft.media,
          note: seed.note,
          sourceType: draft.sourceType,
          title: seed.title,
        }),
      );
    }
    return created;
  } catch (error) {
    await repository.clear();
    clearInspirationMedia();
    throw error;
  }
}
