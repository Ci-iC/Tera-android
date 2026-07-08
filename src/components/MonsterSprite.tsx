import { useEffect, useRef } from 'react'
import type { Genotype } from '../engine/types'
import { phenotypeOf } from '../engine/genetics'
import { renderCreature, contentBounds } from '../engine/render'
import { SPECIES_BY_ID } from '../engine/species'

interface Props {
  genotype: Genotype
  size?: number        // 显示的最大边（px）
  facingRight?: boolean
  seed?: number
}

export default function MonsterSprite({ genotype, size = 160, facingRight = false, seed = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const species = SPECIES_BY_ID[genotype.species]

  useEffect(() => {
    if (!ref.current || !species) return
    const pheno = phenotypeOf(genotype)
    renderCreature(ref.current, species.pixels, pheno, { seed })
  }, [genotype, species, seed])

  if (!species) return null
  const [W, H] = species.pixels.size
  const b = contentBounds(species.pixels)
  // 按内容边界缩放，让精灵尽量填满 size
  const scale = size / Math.max(b.w, b.h)
  const dispW = W * scale
  const dispH = H * scale
  // 平移使内容居中
  const cx = (b.minX + b.maxX + 1) / 2
  const cy = (b.minY + b.maxY + 1) / 2
  const tx = (size / 2 - cx * scale)
  const ty = (size / 2 - cy * scale)

  return (
    <div style={{ width: size, height: size, position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={ref}
        style={{
          position: 'absolute',
          width: dispW, height: dispH,
          left: tx, top: ty,
          imageRendering: 'pixelated',
          transform: facingRight ? 'scaleX(-1)' : undefined,
          transformOrigin: 'center',
          filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.35))',
        }}
      />
    </div>
  )
}
