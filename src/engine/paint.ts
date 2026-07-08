// 程序化花纹引擎 v4：连续覆盖场（0~1）+ 宽渐变羽化边缘（晕染式）+ 参数化变体。
// 每种 spec 是一个算法家族，WEAVES 表里用 params 派生尺度/密度/方向不同的变体。
// 渲染层按 t 在底色与纹色之间逐像素混合，另叠加轻微明度抖动。

import type { PatternSpec } from './types'
export type { PatternSpec }

function hash2(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 2246822519
  h = (h ^ (h >>> 13)) >>> 0
  h = Math.imul(h, 1274126177) >>> 0
  return (h & 0xffffff) / 0xffffff
}
function smooth(t: number) { return t * t * (3 - 2 * t) }
function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const tl = hash2(xi, yi, seed), tr = hash2(xi + 1, yi, seed)
  const bl = hash2(xi, yi + 1, seed), br = hash2(xi + 1, yi + 1, seed)
  const u = smooth(xf), v = smooth(yf)
  return (tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v
}
function fbm(x: number, y: number, seed: number): number {
  let f = 0, amp = 0.5, freq = 1
  for (let i = 0; i < 4; i++) { f += amp * valueNoise(x * freq, y * freq, seed + i * 17); amp *= 0.5; freq *= 2 }
  return f
}
// smoothstep：在 [a,b] 之间平滑过渡（宽渐变边缘的关键）
function ss(a: number, b: number, t: number): number {
  const u = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return u * u * (3 - 2 * u)
}

// 明度抖动场：给皮肤加一层缓慢的深浅呼吸（±1 范围，渲染层缩放使用）
export function lumField(x: number, y: number, seed: number): number {
  return (fbm(x * 0.016, y * 0.018, seed + 991) - 0.5) * 2
}

export type PatternParams = Record<string, number>

/**
 * 纹色覆盖度 0~1。
 * @param ny 该像素在精灵内容里的归一化高度 0(顶)~1(底)
 * @param p  织纹变体参数（见各 case 默认值）
 */
export function patternField(
  spec: PatternSpec, x: number, y: number, seed: number, ny: number, p: PatternParams = {},
): number {
  switch (spec) {
    case 'plain': {
      // 素肌：近乎纯底色，只带极淡的天然斑驳。k=底纹强度
      const k = p.k ?? 0.24
      const n = fbm(x * 0.03, y * 0.033, seed)
      return n * k
    }
    case 'grad': {
      // 晕染：纵向渐变（反荫蔽）。dir=1 下深 / -1 上深；lo/hi=过渡带
      const dir = p.dir ?? 1
      const lo = p.lo ?? 0.32, hi = p.hi ?? 0.78
      const v = dir >= 0 ? ny : 1 - ny
      const w = (fbm(x * 0.024, y * 0.024, seed) - 0.5) * 0.38
      return ss(lo, hi, v + w)
    }
    case 'patch': {
      // 斑块：大片撞色补丁，宽渐变晕入。f=尺度
      const f = p.f ?? 0.028
      const n = fbm(x * f, y * f, seed + 5)
      return ss(p.lo ?? 0.38, p.hi ?? 0.70, n)
    }
    case 'fleck': {
      // 星斑：疏朗圆斑，斑心浓、向外渐融。f=尺度（越大斑越小）
      const f = p.f ?? 0.045
      const n = fbm(x * f, y * f, seed)
      return ss(p.lo ?? 0.49, p.hi ?? 0.73, n)
    }
    case 'cloud': {
      // 云纹：雾状晕开。f=尺度
      const f = p.f ?? 0.022
      const n = fbm(x * f, y * f * 1.09, seed + 11)
      return ss(p.lo ?? 0.34, p.hi ?? 0.74, n)
    }
    case 'band': {
      // 缟纹：弯曲条带。fy=条带密度 fx=倾斜 ax=1 时竖向
      const fy = p.fy ?? 0.052, fx = p.fx ?? 0.010
      const u = p.ax ? x : y, v = p.ax ? y : x
      const warp = fbm(x * 0.028, y * 0.028, seed)
      const wave = Math.sin((u * fy + v * fx + warp * 3.0) * Math.PI)
      return ss(p.lo ?? -0.35, p.hi ?? 0.60, wave)
    }
    case 'scale': {
      // 鳞纹：交错鳞片，鳞心向鳞缘径向渐变。sx/sy=鳞片尺寸
      const sx = p.sx ?? 30, sy = p.sy ?? 22
      const warp = (fbm(x * 0.05, y * 0.05, seed) - 0.5) * sx * 0.2
      const ox = (Math.floor(y / sy) % 2) * (sx / 2)
      const cx = (((x + ox) % sx) + sx) % sx - sx / 2
      const cy = ((y % sy) + sy) % sy - sy / 2
      const d = Math.hypot(cx, cy * 1.25) + warp
      return 1 - ss(sx * 0.16, sx * 0.55, d)
    }
    case 'crackle': {
      // 龟裂：等值线裂纹网，缝深处浓、两侧散开。f=网密度 w=裂缝晕宽
      const f = p.f ?? 0.030, w = p.w ?? 0.085
      const n = fbm(x * f, y * f, seed + 3)
      const d = Math.min(Math.abs(n - 0.38), Math.abs(n - 0.52), Math.abs(n - 0.66))
      return 1 - ss(0.006, w, d)
    }
    case 'marble': {
      // 泼墨：流动脉络，墨心浓、边缘洇开。f=尺度 vert=1 竖向流
      const f = p.f ?? 0.030
      const n = fbm(x * f, y * f, seed + 2)
      const ph = p.vert ? (y * 0.030 + x * 0.014) : (x * 0.030 + y * 0.014)
      const veins = Math.abs(Math.sin((ph + n * 3.4) * Math.PI))
      return 1 - ss(0.12, 0.62, veins)
    }
    case 'rosette': {
      // 豹斑：环状玫瑰斑，双向渐融。f=密度 w=环带加宽
      const f = p.f ?? 0.040, w = p.w ?? 0
      const n = fbm(x * f, y * f, seed + 8)
      return ss(0.495 - w, 0.60 - w, n) * (1 - ss(0.615 + w, 0.725 + w, n))
    }
    case 'swirl': {
      // 涡纹：大尺度旋涡，涡臂渐晕。f=尺度
      const f = p.f ?? 0.022
      const n = fbm(x * f, y * f, seed + 7)
      const ang = Math.sin((x * 0.018 - y * 0.020 + n * 4.2) * Math.PI)
      return ss(-0.35, 0.60, ang)
    }
    case 'galaxy': {
      // 星河：雾状云底 + 柔光星点。ck=云强度 cf=云尺度 sf=星尺度 st=星密度(阈值低=多)
      const cf = p.cf ?? 0.020, ck = p.ck ?? 0.45
      const sf = p.sf ?? 0.065, st = p.st ?? 0.62
      const cloud = ss(0.40, 0.76, fbm(x * cf, y * cf * 1.1, seed + 13)) * ck
      const star = ss(st, st + 0.18, fbm(x * sf, y * sf, seed + 29))
      return Math.max(cloud, star)
    }
    default: return 0
  }
}
