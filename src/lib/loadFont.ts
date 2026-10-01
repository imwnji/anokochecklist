/**
 * Loads 그리운 하제체 (© TypeE. Corp. & Nam Yeon-U — https://www.griun.co.kr/license).
 *
 * The font file is licensed and is not committed. It is read from
 * - `VITE_FONT_URL` when set (e.g. a self-hosted / licensed web font URL), or
 * - `public/fonts/Griun_HajeFont-Rg.ttf`, a local, git-ignored copy that the build ships as-is.
 * If neither is available the CSS fallback (Helvetica, Arial) is used.
 */
export function loadFont() {
  if (typeof FontFace === 'undefined') return
  const url = import.meta.env.VITE_FONT_URL || `${import.meta.env.BASE_URL}fonts/Griun_HajeFont-Rg.ttf`
  const face = new FontFace('Griun Haje', `url("${url}")`, {
    weight: '400',
    style: 'normal',
    display: 'swap',
  })
  face
    .load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => {
      /* font not available: keep the fallback fonts */
    })
}
