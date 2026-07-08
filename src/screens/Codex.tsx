import { useState } from 'react'
import { useGame } from '../state/store'
import { SPECIES, SPECIES_BY_ID } from '../engine/species'
import MonsterSprite from '../components/MonsterSprite'
import CreatureDetail, { hashSeed } from '../components/CreatureDetail'
import { creatureRarity } from '../engine/genetics'
import type { Creature } from '../engine/types'

export default function Codex() {
  const collection = useGame((s) => s.collection)
  const roster = useGame((s) => s.roster)
  const [open, setOpen] = useState<Creature | null>(null)

  const discovered = new Set([...collection, ...roster].map((c) => c.genotype.species))

  return (
    <div className="scene" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #2a2438, #12101c)' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '70px 18px 100px' }}>
        <div className="title" style={{ fontSize: 24, textAlign: 'center', marginBottom: 4 }}>收藏室</div>
        <div style={{ textAlign: 'center', color: '#d8cff0', fontSize: 12, marginBottom: 16 }}>
          图鉴 {discovered.size}/{SPECIES.length} · 标本 {collection.length}
        </div>

        {/* 物种图鉴 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {SPECIES.map((s) => {
            const known = discovered.has(s.id)
            return (
              <div key={s.id} className="panel" style={{ padding: 8, display: 'grid', placeItems: 'center', aspectRatio: '1', opacity: known ? 1 : 0.5 }}>
                {known
                  ? <MonsterSprite genotype={{ species: s.id, ...fakeColors() }} size={72} seed={7} />
                  : <span style={{ fontSize: 30 }}>❓</span>}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--parch-ink)', marginTop: 4 }}>{known ? s.name : '???'}</div>
              </div>
            )
          })}
        </div>

        {/* 标本 */}
        <div className="title title--ink" style={{ fontSize: 16, marginBottom: 8, color: '#e8dcff' }}>已制成标本</div>
        {collection.length === 0
          ? <div style={{ color: '#b7aede', fontSize: 13 }}>还没有标本。在兽栏里把心爱的怪物「制成标本」吧。</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {collection.map((c) => (
                <button key={c.uid} className="panel gilt" style={{ padding: 8, display: 'grid', placeItems: 'center', border: 'none', cursor: 'pointer' }}
                  onClick={() => setOpen(c)}>
                  <MonsterSprite genotype={c.genotype} size={80} seed={hashSeed(c.uid)} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--parch-ink)', marginTop: 4 }}>
                    {SPECIES_BY_ID[c.genotype.species]?.name}
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>

      {open && <CreatureDetail creature={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

// 图鉴里的物种缩略用一套固定普通配色
function fakeColors() {
  const d = (id: string) => ({ a: id, b: id })
  return {
    color: {
      primary_base: d('moss'), primary_pat: d('clay'),
      secondary_base: d('sand'), secondary_pat: d('leaf'),
      accent1: d('bone'), accent2: d('char'), eye: d('e_amber'),
    },
    weave: d('w_fleck'),
  } as any
}
