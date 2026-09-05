/**
 * Narrow cross-feature surface for workspace lifecycle operations.
 *
 * Keeping these exports separate from the Inspire screen barrel prevents the
 * workspace feature from loading Inspire routes while it is still initialising.
 */
export { installDemoInspirationPack } from "./demo-seed";
export {
  inspirationQueryKeys,
  useClearInspirationsMutation,
  useInspirationRepository,
  useUnlinkInspirationEventMutation,
} from "./provider";
