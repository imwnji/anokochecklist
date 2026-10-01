export interface Sticker {
  id: string
  name: string
  /** Artwork with a transparent background (data: URL or static URL). */
  src: string
  /** Die-cut silhouette (white, alpha = sticker outline), same size/padding as `src`. */
  shape?: string
  /** Strength of the dome's light reflection (1 = default). */
  gloss?: number
  custom?: boolean
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  stickerId: string
  createdAt: number
}

export interface ChecklistState {
  items: ChecklistItem[]
  customStickers: Sticker[]
}
