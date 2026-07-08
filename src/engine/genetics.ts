import {
  COLOR_BY_ID, LOCUS_POOL, WEAVES, WEAVE_BY_ID, comboName,
} from './palette'
import type {
  ColorAllele, ColorLocus, Creature, DiploidLocus, Genotype, Phenotype, Rarity,
} from './types'
import { COLOR_LOCI, RARITY_RANK } from './types'

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60, uncommon: 26, rare: 9, epic: 4, legendary: 1,
}
const RARE_PLUS: Rarity[] = ['rare', 'epic', 'legendary']

function pickWeighted<T>(items: T[], weight: (t: T) => number, rnd: () => number): T {
  const total = items.reduce((s, it) => s + weight(it), 0)
  let r = rnd() * total
  for (const it of items) { r -= weight(it); if (r <= 0) return it }
  return items[items.length - 1]
}

let _uid = 0
export function uid(): string { return `c${Date.now().toString(36)}_${(_uid++).toString(36)}` }

function randColor(locus: ColorLocus, rnd: () => number): string {
  return pickWeighted(LOCUS_POOL[locus], (a) => RARITY_WEIGHT[a.rarity], rnd).id
}
function randWeave(rnd: () => number): string {
  return pickWeighted(WEAVES, (w) => RARITY_WEIGHT[w.rarity], rnd).id
}

export function randomGenotype(speciesId: string, rnd: () => number = Math.random): Genotype {
  const color = {} as Record<ColorLocus, DiploidLocus<string>>
  for (const l of COLOR_LOCI) color[l] = { a: randColor(l, rnd), b: randColor(l, rnd) }
  return { species: speciesId, color, weave: { a: randWeave(rnd), b: randWeave(rnd) } }
}

// —— 显性表达 ——
function expressColor(locus: DiploidLocus<string>): ColorAllele {
  const a = COLOR_BY_ID[locus.a], b = COLOR_BY_ID[locus.b]
  if (a.dominance !== b.dominance) return a.dominance > b.dominance ? a : b
  return a.id <= b.id ? a : b
}
function expressWeave(locus: DiploidLocus<string>) {
  const a = WEAVE_BY_ID[locus.a], b = WEAVE_BY_ID[locus.b]
  return a.dominance >= b.dominance ? a : b
}

export function phenotypeOf(g: Genotype): Phenotype {
  const c = (l: ColorLocus) => expressColor(g.color[l])
  const pB = c('primary_base'), pP = c('primary_pat')
  const sB = c('secondary_base'), sP = c('secondary_pat')
  return {
    primary: { base: pB, pat: pP, comboName: comboName(pB.id, pP.id) },
    secondary: { base: sB, pat: sP, comboName: comboName(sB.id, sP.id) },
    accent1: c('accent1'),
    accent2: c('accent2'),
    eye: c('eye'),
    weave: expressWeave(g.weave),
  }
}

// —— 配种：同物种，每位点各取父母一个等位基因 + 小概率突变 ——
const MUTATION = 0.04
export function breed(mom: Genotype, dad: Genotype, rnd: () => number = Math.random): Genotype | null {
  if (mom.species !== dad.species) return null
  const color = {} as Record<ColorLocus, DiploidLocus<string>>
  for (const l of COLOR_LOCI) {
    let a = rnd() < 0.5 ? mom.color[l].a : mom.color[l].b
    let b = rnd() < 0.5 ? dad.color[l].a : dad.color[l].b
    if (rnd() < MUTATION) a = randColor(l, rnd)
    if (rnd() < MUTATION) b = randColor(l, rnd)
    color[l] = { a, b }
  }
  let wa = rnd() < 0.5 ? mom.weave.a : mom.weave.b
  let wb = rnd() < 0.5 ? dad.weave.a : dad.weave.b
  if (rnd() < MUTATION) wa = randWeave(rnd)
  if (rnd() < MUTATION) wb = randWeave(rnd)
  return { species: mom.species, color, weave: { a: wa, b: wb } }
}

// —— 稀有度评级：取表现型里最高稀有度（含织纹）——
export function creatureRarity(g: Genotype): Rarity {
  const ph = phenotypeOf(g)
  const pool: Rarity[] = [
    ph.primary.base.rarity, ph.primary.pat.rarity,
    ph.secondary.base.rarity, ph.secondary.pat.rarity,
    ph.accent1.rarity, ph.accent2.rarity, ph.eye.rarity, ph.weave.rarity,
  ]
  return pool.reduce((best, r) => (RARITY_RANK[r] > RARITY_RANK[best] ? r : best), 'common' as Rarity)
}

export function randomSex(rnd: () => number = Math.random): Creature['sex'] {
  return rnd() < 0.5 ? 'm' : 'f'
}

export function makeCreature(speciesId: string, origin: Creature['origin'], rnd: () => number = Math.random): Creature {
  return { uid: uid(), genotype: randomGenotype(speciesId, rnd), sex: randomSex(rnd), pen: 0, born: Date.now(), origin }
}

// 强制携带并表达至少一个稀有+基因（探索稀有产出）
export function makeRareCreature(speciesId: string, origin: Creature['origin'], rnd: () => number = Math.random): Creature {
  const g = randomGenotype(speciesId, rnd)
  const l = COLOR_LOCI[Math.floor(rnd() * COLOR_LOCI.length)]
  const rares = LOCUS_POOL[l].filter((a) => RARE_PLUS.includes(a.rarity))
  if (rares.length) {
    const pick = rares[Math.floor(rnd() * rares.length)]
    g.color[l] = { a: pick.id, b: pick.id }   // 纯合，确保表达
  }
  return { uid: uid(), genotype: g, sex: randomSex(rnd), pen: 0, born: Date.now(), origin }
}
