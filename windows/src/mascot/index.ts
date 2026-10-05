// Single injection point for the on-island character.
//
// Island, pills and app state import the mascot from here — not from
// `src/mochi/` directly. To ship MaoMao drawings instead of Mochi:
//   1. Keep BotEngine's public surface (setState, update, draw, greet, look
//      targets, emotes, morph, bodyColor, isMini, particleOverhang, …).
//   2. Replace the Canvas 2D math in `src/mochi/engine.ts` (body, eyes, mouth,
//      particles) and, if needed, `src/mochi/greeting.ts`.
//   3. The drop sequence still draws its own silhouette in
//      `src/upload/canvas.ts` (`drawMochi`) — update that if the body shape
//      changes.
// There are no sprite sheets at runtime: everything is Path2D / superellipse
// math on Canvas 2D. PNG/ICO under `src-tauri/icons/` and `scripts/gen-icons.mjs`
// are the tray/installer assets only.

export { BotEngine, hexToRGB } from "../mochi/engine";
export type { EyeShape, Badge, BadgeKind, RGB } from "../mochi/engine";
export { Greeting } from "../mochi/greeting";
export {
  createMiniBot,
  pruneMiniBots,
  releaseMiniBot,
  syncMiniBotStates,
  tickMiniBots,
} from "../mochi/minibots";
