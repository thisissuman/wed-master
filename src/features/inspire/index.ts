export { inspirationCategories, inspirationCategoryLabels, inspirationSourceTypes } from "./types";
export type {
  CreateInspirationInput,
  Inspiration,
  InspirationCategory,
  InspirationCursor,
  InspirationListQuery,
  InspirationMedia,
  InspirationMediaDraft,
  InspirationMediaPickResult,
  InspirationPage,
  InspirationRepository,
  InspirationSnapshot,
  InspirationSourceType,
  UpdateInspirationInput,
} from "./types";

export {
  createInspirationInputSchema,
  inspirationMediaSchema,
  inspirationSchema,
  inspirationSnapshotSchema,
  inspirationTitleMaxLength,
  inspirationNoteMaxLength,
  maximumInspirationsPerWedding,
  parseInspirationSnapshot,
  updateInspirationInputSchema,
} from "./schemas";
export {
  createInspirationRecord,
  filterAndPageInspirations,
  inspirationMediaFromDraft,
  maximumInspirationPageSize,
  updateInspirationRecord,
} from "./domain";

export {
  createLocalInspirationRepository,
  InspirationCorruptionError,
  InspirationNotFoundError,
  inspirationStorageKey,
  LocalInspirationStore,
  maximumInspirationSnapshotBytes,
} from "./local-inspiration-store";
export type {
  InspirationKeyValueStorage,
  LocalInspirationStoreOptions,
} from "./local-inspiration-store";

export {
  cleanupOrphanedInspirationMedia,
  clearInspirationMedia,
  createInspirationMediaDraftFromSource,
  derivativeDimensions,
  inspirationDetailMaxLongEdge,
  inspirationThumbnailMaxLongEdge,
  isManagedInspirationMediaUri,
  maximumInspirationSourceBytes,
  pickInspirationFromCamera,
  pickInspirationFromGallery,
  removeInspirationMedia,
} from "./media";
export type { InspirationMediaPipelineOptions, InspirationMediaSource } from "./media";

export { installDemoInspirationPack } from "./demo-seed";

export {
  InspirationRepositoryProvider,
  inspirationQueryKeys,
  useClearInspirationsMutation,
  useCreateInspirationMutation,
  useDeleteInspirationMutation,
  useInspiration,
  useInspirationPages,
  useInspirationRepository,
  useRestoreInspirationMutation,
  useSetInspirationFavouriteMutation,
  useUnlinkInspirationEventMutation,
  useUpdateInspirationMutation,
} from "./provider";

export { InspireDashboard } from "./InspireDashboard";
export { InspirationDetail } from "./InspirationDetail";
export { InspirationForm } from "./InspirationForm";
export type {
  DeleteInspirationInput,
  SetInspirationFavouriteInput,
  UnlinkInspirationEventInput,
} from "./provider";
