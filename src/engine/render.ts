import type { Phenotype, SpeciesPixels } from './types'
import { patternField, lumField } from './paint'

const OUTLINE_RGB: [number, number, number] = [22, 16, 22]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// 把一只怪物按表现型画到 canvas。
// 主色/辅色 = 底色↔纹色 按花纹覆盖场逐像素混合（羽化边缘）+ 轻微明度抖动 → 皮肤质感。
// 装饰/眼纯色，轮廓固定黑。
export function renderCreature(
  canvas: HTMLCanvasElement,
  pixels: SpeciesPixels,
  pheno: Phenotype,
  opts: { seed?: number } = {},
) {
  const [W, H] = pixels.size
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const seed = opts.seed ?? 1
  const spec = pheno.weave.spec

  // 晕染等纵向纹样按"身体内容"的高度归一，而不是整张画布
  const b = contentBounds(pixels)
  const bh = Math.max(1, b.maxY - b.minY)

  const img = ctx.createImageData(W, H)
  const d = img.data

  const solidColor: Record<string, [number, number, number]> = {
    accent1: hexToRgb(pheno.accent1.hex),
    accent2: hexToRgb(pheno.accent2.hex),
    eye: hexToRgb(pheno.eye.hex),
  }
  const woven: Record<string, { base: [number, number, number]; pat: [number, number, number] }> = {
    primary: { base: hexToRgb(pheno.primary.base.hex), pat: hexToRgb(pheno.primary.pat.hex) },
    secondary: { base: hexToRgb(pheno.secondary.base.hex), pat: hexToRgb(pheno.secondary.pat.hex) },
  }

  for (const key of pixels.render_order) {
    const part = pixels.parts[key]
    if (!part) continue
    const role = part.role

    if (role === null || role === 'accent1' || role === 'accent2' || role === 'eye') {
      const [r, g, bl] = role === null ? OUTLINE_RGB : solidColor[role]
      for (const row of part.runs) {
        const off = row.y * W
        for (const [x0, x1] of row.runs) {
          for (let x = x0; x <= x1; x++) {
            const i = (off + x) * 4
            d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = 255
          }
        }
      }
      continue
    }

    // primary / secondary：连续覆盖场混色
    const w = woven[role]
    const same = w.base[0] === w.pat[0] && w.base[1] === w.pat[1] && w.base[2] === w.pat[2]
    for (const row of part.runs) {
      const y = row.y
      const off = y * W
      const ny = (y - b.minY) / bh
      for (const [x0, x1] of row.runs) {
        for (let x = x0; x <= x1; x++) {
          const t = same ? 0 : patternField(spec, x, y, seed, ny, pheno.weave.params)
          // 皮肤明度呼吸：±7%，让大色块不死板
          const m = 1 + lumField(x, y, seed) * 0.07
          const i = (off + x) * 4
          d[i]     = clamp((w.base[0] + (w.pat[0] - w.base[0]) * t) * m)
          d[i + 1] = clamp((w.base[1] + (w.pat[1] - w.base[1]) * t) * m)
          d[i + 2] = clamp((w.base[2] + (w.pat[2] - w.base[2]) * t) * m)
          d[i + 3] = 255
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0)
}

function clamp(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v | 0 }

// 内容边界（用于把精灵在画布里居中 / 纵向归一）
export function contentBounds(pixels: SpeciesPixels) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const key in pixels.parts) {
    for (const row of pixels.parts[key].runs) {
      for (const [x0, x1] of row.runs) {
        if (x0 < minX) minX = x0
        if (x1 > maxX) maxX = x1
        if (row.y < minY) minY = row.y
        if (row.y > maxY) maxY = row.y
      }
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 }
}
