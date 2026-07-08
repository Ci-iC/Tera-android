// —— 像素数据（来自 data/*_pixels.json）——
export type Role = 'primary' | 'secondary' | 'accent1' | 'accent2' | 'eye'
export const ROLES: Role[] = ['primary', 'secondary', 'accent1', 'accent2', 'eye']
export const ROLE_CN: Record<Role, string> = {
  primary: '主色', secondary: '辅色', accent1: '装饰色1', accent2: '装饰色2', eye: '眼睛',
}

export interface RunRow { y: number; runs: [number, number][] }
export interface PixelPart { role: Role | null; runs: RunRow[] }
export interface SpeciesPixels {
  species: string
  display_name?: string
  size: [number, number]
  render_order: string[]
  parts: Record<string, PixelPart>
}

// —— 生态 / 探索地 ——
export type Biome = 'forest' | 'volcano' | 'beach'

export interface Species {
  id: string
  name: string
  biome: Biome
  pixels: SpeciesPixels
}

// —— 稀有度 ——
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
export const RARITY_RANK: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }

// —— 具名颜色（单色）——
export type ColorFamily =
  | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'red'
  | 'orange' | 'yellow' | 'brown' | 'neutral'
export const FAMILY_CN: Record<ColorFamily, string> = {
  green: '绿系', teal: '青系', blue: '蓝系', purple: '紫系', pink: '粉系',
  red: '红系', orange: '橙系', yellow: '黄系', brown: '褐系', neutral: '中性',
}
export interface ColorAllele {
  id: string
  name: string
  hex: string
  rarity: Rarity
  dominance: number
  family?: ColorFamily
  root?: string   // 双色组合命名用的 2 字词根（如 苔痕、流金）
}

// —— 织纹（纹样类型）——
export type PatternSpec =
  | 'plain' | 'grad' | 'patch' | 'fleck' | 'cloud' | 'band'
  | 'scale' | 'crackle' | 'marble' | 'rosette' | 'swirl' | 'galaxy'
export interface Weave {
  id: string
  name: string
  spec: PatternSpec
  rarity: Rarity
  dominance: number
  params?: Record<string, number>   // 同一算法的变体参数（尺度/密度/方向…）
}

// —— 基因位点 ——
// 主色/辅色各拆成 底色 + 纹色 两个位点，实现双色撞色；其余单色。
export type ColorLocus =
  | 'primary_base' | 'primary_pat'
  | 'secondary_base' | 'secondary_pat'
  | 'accent1' | 'accent2' | 'eye'
export const COLOR_LOCI: ColorLocus[] = [
  'primary_base', 'primary_pat', 'secondary_base', 'secondary_pat', 'accent1', 'accent2', 'eye',
]

export interface DiploidLocus<T> { a: T; b: T }
export interface Genotype {
  species: string
  color: Record<ColorLocus, DiploidLocus<string>>  // 存 allele id
  weave: DiploidLocus<string>                       // 存 weave id
}

// —— 表现型（渲染 + 展示用）——
export interface PatternedRole {
  base: ColorAllele
  pat: ColorAllele
  comboName: string   // 双色组合的名字（手工优先，自动兜底）
}
export interface Phenotype {
  primary: PatternedRole
  secondary: PatternedRole
  accent1: ColorAllele
  accent2: ColorAllele
  eye: ColorAllele
  weave: Weave
}

// —— 性别 ——
export type Sex = 'm' | 'f'
export const SEX_CN: Record<Sex, string> = { m: '雄', f: '雌' }

// —— 一只怪物实例 ——
export interface Creature {
  uid: string
  genotype: Genotype
  sex: Sex
  pen: number          // 所在兽栏编号 0-3
  born: number
  nickname?: string
  origin: 'starter' | 'explore' | 'breed'
}
