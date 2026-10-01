export interface Sticker {
  id: string
  name: string
  /** data: URL or static URL */
  src: string
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
