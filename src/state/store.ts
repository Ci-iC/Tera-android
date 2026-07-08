import { create } from 'zustand'
import type { Biome, Creature, Genotype } from '../engine/types'
import { breed, makeCreature, makeRareCreature, randomSex, uid } from '../engine/genetics'
import { SPECIES, SPECIES_BY_BIOME } from '../engine/species'
import { purgeLegacySaves, readSlot, writeSlot, type SaveData } from './saves'

export type Screen = 'title' | 'world' | 'explore' | 'pen' | 'hatchery' | 'codex'

export interface Egg {
  uid: string
  genotype: Genotype
  readyAt: number
}
export interface Expedition {
  biome: Biome
  startAt: number
  readyAt: number
}
export interface ExploreResult {
  creature: Creature | null   // null = 空手而归
  rare: boolean
}

interface GameState {
  screen: Screen
  slot: number | null          // 当前存档槽(1~3);null = 还在封面
  coins: number
  coinsAt: number              // 上次金币结算时间戳(运行时,不入存档)
  roster: Creature[]
  eggs: Egg[]
  expedition: Expedition | null
  collection: Creature[]
  selected: string | null

  go: (s: Screen) => void
  select: (u: string | null) => void

  newGame: (slot: number) => void
  loadGame: (slot: number) => boolean
  backToTitle: () => void
  tickCoins: () => void

  startExpedition: (biome: Biome) => boolean
  skipExpedition: () => boolean
  claimExpedition: () => ExploreResult | null

  startBreed: (aUid: string, bUid: string) => Egg | null
  skipEgg: (eggUid: string) => boolean
  hatch: (eggUid: string) => Creature | null

  movePen: (uid: string, pen: number) => boolean
  release: (uid: string) => void
  enshrine: (uid: string) => void
}

export const PEN_COUNT = 4
export const PEN_CAP = 8
export const TOTAL_CAP = PEN_COUNT * PEN_CAP
export const PEN_NAMES = ['兽栏一', '兽栏二', '兽栏三', '兽栏四']
export const EXPEDITION_MS = 20 * 60 * 1000   // 20 分钟
export const HATCH_MS = 20 * 60 * 1000        // 配种孵化同样 20 分钟(可调)
export const EXPLORE_COST = 20                // 一次探索花费
export const SKIP_COST = 100                  // 一次快进(探索/孵化)花费
export const COIN_PER_MIN = 1                 // 每只怪物每分钟产出金币
const P_FIND = 0.75      // 探索成功获得怪物的概率
const P_RARE = 0.18      // 成功中,产出稀有基因怪物的概率

export function penCounts(roster: Creature[]): number[] {
  const n = new Array(PEN_COUNT).fill(0)
  for (const c of roster) n[c.pen] = (n[c.pen] ?? 0) + 1
  return n
}
// 优先当前栏,否则找第一个有空位的栏;-1 = 全满
function firstFreePen(roster: Creature[], prefer = 0): number {
  const n = penCounts(roster)
  if (n[prefer] < PEN_CAP) return prefer
  for (let i = 0; i < PEN_COUNT; i++) if (n[i] < PEN_CAP) return i
  return -1
}

function starterRoster(): Creature[] {
  // 保证开局就有一对可配种的异性同物种
  const a = makeCreature(SPECIES[0].id, 'starter'); a.sex = 'm'
  const b = makeCreature(SPECIES[0].id, 'starter'); b.sex = 'f'
  return [a, b, makeCreature(SPECIES[2].id, 'starter'), makeCreature(SPECIES[4].id, 'starter')]
}

function freshSave(): SaveData {
  return { coins: 120, roster: starterRoster(), eggs: [], expedition: null, collection: [] }
}

export const useGame = create<GameState>()((set, get) => ({
  screen: 'title',
  slot: null,
  coins: 0,
  coinsAt: 0,
  roster: [],
  eggs: [],
  expedition: null,
  collection: [],
  selected: null,

  go: (s) => set({ screen: s }),
  select: (u) => set({ selected: u }),

  newGame: (slot) => {
    const d = freshSave()
    writeSlot(slot, d)
    set({ slot, ...d, selected: null, screen: 'pen', coinsAt: Date.now() })
  },
  loadGame: (slot) => {
    const f = readSlot(slot)
    if (!f) return false
    set({ slot, ...f.data, selected: null, screen: 'pen', coinsAt: Date.now() })
    return true
  },
  backToTitle: () => {
    flushSave()
    set({ screen: 'title', slot: null, selected: null })
  },
  // 牧场产金:每只怪物每分钟 1 金币,按整分钟结算(仅在游戏内)
  tickCoins: () => {
    const { slot, coinsAt, roster, coins } = get()
    if (slot == null) return
    const mins = Math.floor((Date.now() - coinsAt) / 60000)
    if (mins <= 0) return
    set({ coins: coins + mins * roster.length * COIN_PER_MIN, coinsAt: coinsAt + mins * 60000 })
  },

  startExpedition: (biome) => {
    const { expedition, roster, coins } = get()
    if (expedition) return false          // 同一时间只能探索一处
    if (roster.length >= TOTAL_CAP) return false
    if (coins < EXPLORE_COST) return false
    const now = Date.now()
    set({ coins: coins - EXPLORE_COST, expedition: { biome, startAt: now, readyAt: now + EXPEDITION_MS } })
    return true
  },
  skipExpedition: () => {
    const { expedition, coins } = get()
    if (!expedition || Date.now() >= expedition.readyAt) return false
    if (coins < SKIP_COST) return false
    set({ coins: coins - SKIP_COST, expedition: { ...expedition, readyAt: Date.now() } })
    return true
  },
  claimExpedition: () => {
    const { expedition, roster } = get()
    if (!expedition || Date.now() < expedition.readyAt) return null
    const found = Math.random() < P_FIND
    let creature: Creature | null = null
    let rare = false
    const pen = firstFreePen(roster)
    if (found && pen >= 0) {
      const pool = SPECIES_BY_BIOME[expedition.biome]
      const sp = pool[Math.floor(Math.random() * pool.length)]
      rare = Math.random() < P_RARE
      creature = rare ? makeRareCreature(sp.id, 'explore') : makeCreature(sp.id, 'explore')
      creature.pen = pen
    }
    set({
      expedition: null,
      roster: creature ? [...roster, creature] : roster,
    })
    return { creature, rare }
  },

  startBreed: (aUid, bUid) => {
    const { roster, eggs } = get()
    if (roster.length + eggs.length >= TOTAL_CAP) return null
    const a = roster.find((c) => c.uid === aUid)
    const b = roster.find((c) => c.uid === bUid)
    if (!a || !b || a.uid === b.uid) return null
    if (a.sex === b.sex) return null       // 仅异性可配种
    const g = breed(a.genotype, b.genotype)
    if (!g) return null
    const egg: Egg = { uid: uid(), genotype: g, readyAt: Date.now() + HATCH_MS }
    set({ eggs: [...eggs, egg] })
    return egg
  },
  skipEgg: (eggUid) => {
    const { eggs, coins } = get()
    const egg = eggs.find((e) => e.uid === eggUid)
    if (!egg || Date.now() >= egg.readyAt) return false
    if (coins < SKIP_COST) return false
    set({ coins: coins - SKIP_COST, eggs: eggs.map((e) => (e.uid === eggUid ? { ...e, readyAt: Date.now() } : e)) })
    return true
  },
  hatch: (eggUid) => {
    const { eggs, roster } = get()
    const egg = eggs.find((e) => e.uid === eggUid)
    if (!egg || Date.now() < egg.readyAt) return null
    const pen = firstFreePen(roster)
    if (pen < 0) return null
    const c: Creature = { uid: uid(), genotype: egg.genotype, sex: randomSex(), pen, born: Date.now(), origin: 'breed' }
    set({ eggs: eggs.filter((e) => e.uid !== eggUid), roster: [...roster, c] })
    return c
  },

  movePen: (u, pen) => {
    const { roster } = get()
    if (pen < 0 || pen >= PEN_COUNT) return false
    const c = roster.find((x) => x.uid === u)
    if (!c || c.pen === pen) return false
    if (penCounts(roster)[pen] >= PEN_CAP) return false
    set({ roster: roster.map((x) => (x.uid === u ? { ...x, pen } : x)) })
    return true
  },

  release: (u) => set({ roster: get().roster.filter((c) => c.uid !== u), selected: null }),
  enshrine: (u) => {
    const { roster, collection } = get()
    const c = roster.find((x) => x.uid === u)
    if (!c) return
    set({ collection: [...collection, c], roster: roster.filter((x) => x.uid !== u), selected: null })
  },
}))

// ---- 自动存档:游戏数据一变,防抖 800ms 写入当前槽 ----
purgeLegacySaves()

let saveTimer: ReturnType<typeof setTimeout> | null = null

function snapshot(): { slot: number; data: SaveData } | null {
  const s = useGame.getState()
  if (s.slot == null) return null
  return {
    slot: s.slot,
    data: { coins: s.coins, roster: s.roster, eggs: s.eggs, expedition: s.expedition, collection: s.collection },
  }
}

function flushSave() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  const snap = snapshot()
  if (snap) writeSlot(snap.slot, snap.data)
}

useGame.subscribe((s, prev) => {
  if (s.slot == null) return
  // 只有游戏数据变化才触发写盘(切界面/选中不算)
  if (s.coins === prev.coins && s.roster === prev.roster && s.eggs === prev.eggs
    && s.expedition === prev.expedition && s.collection === prev.collection && s.slot === prev.slot) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, 800)
})

// 金币累积:每 5 秒结算一次(按整分钟发放),tickCoins 内部只在有存档槽时生效
setInterval(() => useGame.getState().tickCoins(), 5000)

// 关窗口 / 切后台前立即落盘,防止最后一次操作丢失
window.addEventListener('beforeunload', flushSave)
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave() })
