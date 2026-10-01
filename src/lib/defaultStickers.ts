import type { Sticker } from '../types'

const svg = (body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${body}</svg>`,
  )}`

export const DEFAULT_STICKERS: Sticker[] = [
  {
    id: 'default-star',
    name: '별',
    src: svg(`
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff27a"/><stop offset="1" stop-color="#ffb000"/>
      </linearGradient></defs>
      <path d="M60 10l14.7 31.6 34.6 4.2-25.5 23.8 6.7 34.2L60 86.9 29.5 103.8l6.7-34.2L10.7 45.8l34.6-4.2z"
        fill="url(#g)" stroke="#e08a00" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="49" cy="58" r="4.5" fill="#5a3300"/><circle cx="71" cy="58" r="4.5" fill="#5a3300"/>
      <path d="M50 69q10 9 20 0" fill="none" stroke="#5a3300" stroke-width="4" stroke-linecap="round"/>`),
  },
  {
    id: 'default-heart',
    name: '하트',
    src: svg(`
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff9ccf"/><stop offset="1" stop-color="#ff2f7d"/>
      </linearGradient></defs>
      <path d="M60 104C24 79 10 60 10 40c0-15 12-27 27-27 10 0 18 5 23 13 5-8 13-13 23-13 15 0 27 12 27 27 0 20-14 39-50 64z"
        fill="url(#g)" stroke="#d1105f" stroke-width="4" stroke-linejoin="round"/>`),
  },
  {
    id: 'default-flower',
    name: '꽃',
    src: svg(`
      <g fill="#8fd3ff" stroke="#3a8ee6" stroke-width="3">
        ${[0, 60, 120, 180, 240, 300]
          .map((r) => `<ellipse cx="60" cy="30" rx="17" ry="24" transform="rotate(${r} 60 60)"/>`)
          .join('')}
      </g>
      <circle cx="60" cy="60" r="20" fill="#ffe14d" stroke="#f0a500" stroke-width="3"/>`),
  },
  {
    id: 'default-smile',
    name: '스마일',
    src: svg(`
      <defs><radialGradient id="g" cx=".4" cy=".35" r=".7">
        <stop offset="0" stop-color="#b9ffb0"/><stop offset="1" stop-color="#2ccf6a"/>
      </radialGradient></defs>
      <circle cx="60" cy="60" r="48" fill="url(#g)" stroke="#139a49" stroke-width="4"/>
      <ellipse cx="44" cy="50" rx="6" ry="9" fill="#0d4a25"/><ellipse cx="76" cy="50" rx="6" ry="9" fill="#0d4a25"/>
      <path d="M36 70q24 26 48 0" fill="none" stroke="#0d4a25" stroke-width="6" stroke-linecap="round"/>`),
  },
  {
    id: 'default-bolt',
    name: '번개',
    src: svg(`
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d7a6ff"/><stop offset="1" stop-color="#7b2cff"/>
      </linearGradient></defs>
      <path d="M68 8L22 68h32l-8 44 52-64H64z" fill="url(#g)" stroke="#4d10b8" stroke-width="4" stroke-linejoin="round"/>`),
  },
  {
    id: 'default-rainbow',
    name: '무지개',
    src: svg(`
      <g fill="none" stroke-width="10" stroke-linecap="round">
        <path d="M14 88a46 46 0 0 1 92 0" stroke="#ff4d6d"/>
        <path d="M25 88a35 35 0 0 1 70 0" stroke="#ffb703"/>
        <path d="M36 88a24 24 0 0 1 48 0" stroke="#3ddc84"/>
        <path d="M47 88a13 13 0 0 1 26 0" stroke="#4dabff"/>
      </g>
      <g fill="#fff" stroke="#c9d6e8" stroke-width="3">
        <circle cx="18" cy="92" r="11"/><circle cx="32" cy="94" r="9"/>
        <circle cx="102" cy="92" r="11"/><circle cx="88" cy="94" r="9"/>
      </g>`),
  },
]

export const DEFAULT_STICKER_ID = DEFAULT_STICKERS[0].id
