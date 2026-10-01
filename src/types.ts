export interface Sticker {
  id: string
  name: string
  /** Artwork with a transparent background (data: URL or static URL). */
  src: string
  /** Die-cut silhouette (white, alpha = sticker outline), same size/padding as `src`. */
  shape?: string
  /** Strength of the dome's light reflection (1 = default). */
  gloss?: number
  /** Clip that plays gently right after this sticker is stuck on. */
  sound?: string
  /** Fade the clip in gently (default true). */
  soundFadeIn?: boolean
  /** Clip shown mid-screen (edges faded) right after sticking. */
  video?: { mp4: string; webm: string }
  custom?: boolean
}

export interface ChecklistItem {
  id: string
  /** May be empty: rows are created first and filled in later. */
  text: string
  done: boolean
  /** The sticker that was stuck on when the item was completed. */
  stickerId?: string
  createdAt: number
}

export interface ChecklistState {
  items: ChecklistItem[]
  customStickers: Sticker[]
  /** Stickers left on the sheet per kind; a missing entry means a full sheet. */
  stock: Record<string, number>
}
