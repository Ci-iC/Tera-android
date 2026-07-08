import type { ReactNode, CSSProperties } from 'react'
import type { Rarity } from '../engine/types'

export function WoodPanel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="panel panel--wood" style={style}>
      <div className="panel__inner">{children}</div>
    </div>
  )
}

const RARITY_CN: Record<Rarity, string> = {
  common: '普通', uncommon: '优良', rare: '稀有', epic: '史诗', legendary: '传说',
}
const RARITY_CLS: Record<Rarity, string> = {
  common: 'r-common', uncommon: 'r-uncommon', rare: 'r-rare', epic: 'r-epic', legendary: 'r-legendary',
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className="row gap8" style={{ fontSize: 12, fontWeight: 700 }}>
      <span className={`rarity-dot ${RARITY_CLS[rarity]}`} />
      <span className={RARITY_CLS[rarity]}>{RARITY_CN[rarity]}</span>
    </span>
  )
}

export { RARITY_CN }
