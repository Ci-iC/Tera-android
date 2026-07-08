import type { Creature } from '../engine/types'
import type { Egg, Expedition } from './store'

// ---- 存档槽:localStorage 里 3 个独立槽位 ----
export const SLOT_COUNT = 3
const KEY = (slot: number) => `tera-slot-${slot}`

// 会被写进存档的游戏数据(界面状态不存)
export interface SaveData {
  coins: number
  roster: Creature[]
  eggs: Egg[]
  expedition: Expedition | null
  collection: Creature[]
}

export interface SaveFile {
  version: 1
  savedAt: number
  data: SaveData
}

export interface SlotMeta {
  slot: number
  savedAt: number
  coins: number
  rosterCount: number
  collectionCount: number
}

export function readSlot(slot: number): SaveFile | null {
  try {
    const raw = localStorage.getItem(KEY(slot))
    if (!raw) return null
    const f = JSON.parse(raw) as SaveFile
    if (!f || !f.data || !Array.isArray(f.data.roster)) return null
    return f
  } catch {
    return null
  }
}

export function writeSlot(slot: number, data: SaveData) {
  const f: SaveFile = { version: 1, savedAt: Date.now(), data }
  try {
    localStorage.setItem(KEY(slot), JSON.stringify(f))
  } catch {
    // 存储满/不可用:静默失败,游戏继续
  }
}

export function deleteSlot(slot: number) {
  localStorage.removeItem(KEY(slot))
}

export function slotMeta(slot: number): SlotMeta | null {
  const f = readSlot(slot)
  if (!f) return null
  return {
    slot,
    savedAt: f.savedAt,
    coins: f.data.coins,
    rosterCount: f.data.roster.length,
    collectionCount: f.data.collection.length,
  }
}

export function listSlots(): (SlotMeta | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => slotMeta(i + 1))
}

// 清理旧版单存档(v1~v4 时代的键),按用户要求旧档直接废弃
export function purgeLegacySaves() {
  for (const k of ['tera-save-v1', 'tera-save-v2', 'tera-save-v3', 'tera-save-v4']) {
    localStorage.removeItem(k)
  }
}

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
