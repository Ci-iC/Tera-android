import type { Creature, ColorLocus } from '../engine/types'
import { creatureRarity, phenotypeOf } from '../engine/genetics'
import { COLOR_BY_ID, WEAVE_BY_ID } from '../engine/palette'
import { SPECIES_BY_ID } from '../engine/species'
import { useGame, PEN_COUNT, PEN_CAP, PEN_NAMES, penCounts } from '../state/store'
import MonsterSprite from './MonsterSprite'
import { RarityBadge, RARITY_CN } from './ui'

export function SexBadge({ sex, size = 13 }: { sex: Creature['sex']; size?: number }) {
  const m = sex === 'm'
  return (
    <span style={{
      display: 'inline-grid', placeItems: 'center',
      minWidth: size + 7, height: size + 7, padding: '0 4px', borderRadius: 999,
      fontSize: size, fontWeight: 900, lineHeight: 1,
      color: '#fff', background: m ? '#4a8fd0' : '#d8608a',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25), 0 1px 2px rgba(0,0,0,.3)',
    }}>{m ? '♂' : '♀'}</span>
  )
}

function Swatch({ hex }: { hex: string }) {
  return <span style={{ width: 16, height: 16, borderRadius: 4, background: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.3)', display: 'inline-block' }} />
}

// 一个单色位点行：表达色名 + 隐性携带
function ColorRow({ label, g, locus }: { label: string; g: Creature['genotype']; locus: ColorLocus }) {
  const a = COLOR_BY_ID[g.color[locus].a]
  const b = COLOR_BY_ID[g.color[locus].b]
  const expressed = a.dominance !== b.dominance ? (a.dominance > b.dominance ? a : b) : (a.id <= b.id ? a : b)
  const hidden = a.id !== b.id
  const carried = a.id === expressed.id ? b : a
  return (
    <div className="row spread" style={{ fontSize: 13 }}>
      <span className="row gap8"><Swatch hex={expressed.hex} /><b style={{ color: 'var(--parch-ink)' }}>{label}</b></span>
      <span style={{ color: 'var(--parch-ink-2)' }}>
        {expressed.name}{hidden && <span style={{ opacity: .55 }}> · 携带「{carried.name}」</span>}
      </span>
    </div>
  )
}

// 双色位点组（底色 + 纹色）：组合名 + 两个底/纹的携带
function PatternedRows({ label, g, baseLoc, patLoc, comboName }: {
  label: string; g: Creature['genotype']; baseLoc: ColorLocus; patLoc: ColorLocus; comboName: string
}) {
  const be = expr(g, baseLoc), pe = expr(g, patLoc)
  return (
    <div style={{ background: 'rgba(120,80,30,.10)', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="row spread" style={{ fontSize: 13 }}>
        <span className="row gap8"><Swatch hex={be.hex} /><Swatch hex={pe.hex} /><b style={{ color: 'var(--parch-ink)' }}>{label}</b></span>
        <b style={{ color: 'var(--parch-ink)' }}>{comboName}</b>
      </div>
      <CarrierLine g={g} locus={baseLoc} tag="底" />
      <CarrierLine g={g} locus={patLoc} tag="纹" />
    </div>
  )
}
function CarrierLine({ g, locus, tag }: { g: Creature['genotype']; locus: ColorLocus; tag: string }) {
  const a = COLOR_BY_ID[g.color[locus].a], b = COLOR_BY_ID[g.color[locus].b]
  const e = expr(g, locus), hidden = a.id !== b.id, carried = a.id === e.id ? b : a
  return (
    <div className="row spread" style={{ fontSize: 12, color: 'var(--parch-ink-2)', paddingLeft: 6 }}>
      <span>{tag}色 · {e.name}</span>
      {hidden && <span style={{ opacity: .6 }}>携带「{carried.name}」</span>}
    </div>
  )
}
function expr(g: Creature['genotype'], locus: ColorLocus) {
  const a = COLOR_BY_ID[g.color[locus].a], b = COLOR_BY_ID[g.color[locus].b]
  return a.dominance !== b.dominance ? (a.dominance > b.dominance ? a : b) : (a.id <= b.id ? a : b)
}

export default function CreatureDetail({
  creature, onClose, onEnshrine, onRelease, showMove,
}: {
  creature: Creature
  onClose: () => void
  onEnshrine?: () => void
  onRelease?: () => void
  showMove?: boolean
}) {
  const g = creature.genotype
  const ph = phenotypeOf(g)
  const species = SPECIES_BY_ID[g.species]
  const rarity = creatureRarity(g)
  const wa = WEAVE_BY_ID[g.weave.a], wb = WEAVE_BY_ID[g.weave.b]
  const weaveHidden = wa.id !== wb.id
  const roster = useGame((s) => s.roster)
  const movePen = useGame((s) => s.movePen)
  const counts = penCounts(roster)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel panel--wood" style={{ width: 'min(92%, 560px)', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div className="panel__inner" style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div className="row spread">
            <div>
              <div className="row gap8" style={{ alignItems: 'center' }}>
                <span className="title title--ink" style={{ fontSize: 24 }}>{species?.name}</span>
                <SexBadge sex={creature.sex} />
              </div>
              <div style={{ color: 'var(--parch-ink-2)', fontSize: 13, marginTop: 2 }}>织纹 · <b>{ph.weave.name}</b></div>
            </div>
            <RarityBadge rarity={rarity} />
          </div>

          <div className="center-col">
            <div style={{ background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,.5), transparent 65%)', borderRadius: 18 }}>
              <MonsterSprite genotype={g} size={190} seed={hashSeed(creature.uid)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PatternedRows label="主色" g={g} baseLoc="primary_base" patLoc="primary_pat" comboName={ph.primary.comboName} />
            <PatternedRows label="辅色" g={g} baseLoc="secondary_base" patLoc="secondary_pat" comboName={ph.secondary.comboName} />
            <ColorRow label="装饰色1" g={g} locus="accent1" />
            <ColorRow label="装饰色2" g={g} locus="accent2" />
            <ColorRow label="眼睛" g={g} locus="eye" />
            <div className="rule" />
            <div className="row spread" style={{ fontSize: 13 }}>
              <b style={{ color: 'var(--parch-ink)' }}>织纹基因</b>
              <span style={{ color: 'var(--parch-ink-2)' }}>
                {ph.weave.name}（{RARITY_CN[ph.weave.rarity]}）
                {weaveHidden && <span style={{ opacity: .6 }}> · 携带「{(wa.id === ph.weave.id ? wb : wa).name}」</span>}
              </span>
            </div>
          </div>

          {showMove && (
            <div className="row spread" style={{ background: 'rgba(120,80,30,.10)', borderRadius: 10, padding: '8px 10px' }}>
              <b style={{ color: 'var(--parch-ink)', fontSize: 13 }}>移至</b>
              <div className="row" style={{ gap: 6 }}>
                {Array.from({ length: PEN_COUNT }, (_, i) => {
                  const here = creature.pen === i
                  const full = counts[i] >= PEN_CAP
                  return (
                    <button key={i} className="btn btn--ghost"
                      disabled={here || full}
                      onClick={() => movePen(creature.uid, i)}
                      style={{ padding: '5px 10px', fontSize: 12, opacity: here || full ? 0.45 : 1 }}>
                      {PEN_NAMES[i]} {here ? '（在此）' : `${counts[i]}/${PEN_CAP}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="row gap12" style={{ justifyContent: 'flex-end' }}>
            {onRelease && <button className="btn btn--ghost" onClick={onRelease}>放生</button>}
            {onEnshrine && <button className="btn btn--gold" onClick={onEnshrine}>制成标本 →</button>}
            <button className="btn btn--gem" onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) % 100000
}
