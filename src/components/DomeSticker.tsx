import { useId } from 'react'
import type { Sticker } from '../types'

interface Props {
  sticker: Sticker
  /** Rendered size in px (the square box the die-cut shape sits in). */
  size?: number
  className?: string
  /** Plays a one-shot light sweep across the dome. */
  sheen?: boolean
}

/**
 * Renders artwork as a die-cut, convex epoxy ("puffy") sticker.
 *
 * Layers, all sharing the same square box so they line up:
 * 1. resin  – the silhouette in milky white: clear resin visible around the artwork
 * 2. art    – the artwork itself, slightly translucent
 * 3. dome   – the silhouette run through an SVG lighting filter: the blurred alpha is used
 *             as a height map, so the specular highlight and edge shading follow each
 *             sticker's own outline
 * The wrapper's drop-shadow also follows the silhouette, lifting it off the paper.
 */
export function DomeSticker({ sticker, size = 64, className = '', sheen = false }: Props) {
  const filterId = `dome${useId().replace(/:/g, '')}`
  const shape = sticker.shape ?? sticker.src
  // Filter parameters are in px, so scale them with the rendered size.
  const blur = size * 0.05
  const rim = size * 0.025
  const height = size * 0.12

  return (
    <div
      className={`dome-sticker ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${sticker.name} 스티커`}
    >
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          {/* blurred silhouette = height map of the resin dome */}
          <feGaussianBlur in="SourceAlpha" stdDeviation={blur} result="height" />
          {/* broad sheen along the slopes facing the light */}
          <feSpecularLighting
            in="height"
            surfaceScale={height}
            specularConstant={1.2}
            specularExponent={18}
            lightingColor="#ffffff"
            result="sheen"
          >
            <feDistantLight azimuth={225} elevation={40} />
          </feSpecularLighting>
          {/* sharp glare spot, top-left */}
          <feSpecularLighting
            in="height"
            surfaceScale={height}
            specularConstant={1.6}
            specularExponent={70}
            lightingColor="#ffffff"
            result="glare"
          >
            <fePointLight x={size * 0.22} y={size * 0.18} z={size * 0.9} />
          </feSpecularLighting>
          <feMerge result="lit">
            <feMergeNode in="sheen" />
            <feMergeNode in="glare" />
          </feMerge>
          <feComposite in="lit" in2="SourceAlpha" operator="in" result="gloss" />
          {/* thickness: shade the bottom-right inner edge */}
          <feOffset in="height" dx={-rim} dy={-rim} result="shifted" />
          <feComposite in="SourceAlpha" in2="shifted" operator="arithmetic" k2={1} k3={-1} result="rimMask" />
          <feFlood floodColor="#7a6440" floodOpacity={0.28} />
          <feComposite in2="rimMask" operator="in" result="rimShade" />
          <feMerge>
            <feMergeNode in="rimShade" />
            <feMergeNode in="gloss" />
          </feMerge>
        </filter>
      </svg>
      <img className="dome-sticker__resin" src={shape} alt="" draggable={false} />
      <img className="dome-sticker__art" src={sticker.src} alt="" draggable={false} />
      <img
        className="dome-sticker__dome"
        src={shape}
        alt=""
        draggable={false}
        style={{ filter: `url(#${filterId})` }}
      />
      {sheen && (
        <span
          className="dome-sticker__sheen"
          style={{ maskImage: `url("${shape}")`, WebkitMaskImage: `url("${shape}")` }}
          aria-hidden
        />
      )}
    </div>
  )
}
