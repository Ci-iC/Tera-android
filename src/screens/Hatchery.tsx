import { useEffect, useState } from 'react'
import { useGame, PEN_COUNT, PEN_NAMES, SKIP_COST } from '../state/store'
import { SPECIES_BY_ID } from '../engine/species'
import MonsterSprite from '../components/MonsterSprite'
import { hashSeed, SexBadge } from '../components/CreatureDetail'
import { RarityBadge } from '../components/ui'
import { creatureRarity } from '../engine/genetics'
import type { Creature } from '../engine/types'

export default function Hatchery() {
  const roster = useGame((s) => s.roster)
  const eggs = useGame((s) => s.eggs)
  const coins = useGame((s) => s.coins)
  const startBreed = useGame((s) => s.startBreed)
  const hatch = useGame((s) => s.hatch)
  const skipEgg = useGame((s) => s.skipEgg)

  const [a, setA] = useState<string | null>(null)
  const [b, setB] = useState<string | null>(null)
  const [hatched, setHatched] = useState<Creature | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(t)
  }, [])

  const ca = roster.find((c) => c.uid === a)
  const cb = roster.find((c) => c.uid === b)
  const compatible = ca && cb && ca.genotype.species === cb.genotype.species && ca.sex !== cb.sex && ca.uid !== cb.uid
  // 第二个亲本候选：与已选 a 同物种且异性
  const canPick = (c: Creature) => !ca || (c.genotype.species === ca.genotype.species && c.sex !== ca.sex)

  const lay = () => {
    if (!a || !b) return
    const egg = startBreed(a, b)
    if (egg) { setA(null); setB(null) }
  }

  return (
    <div className="scene" style={{ backgroundImage: 'url(/assets/locations/hatchery.png)', backgroundColor: '#0d0f13' }}>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0, textAlign: 'center' }}>
        <div className="title" style={{ fontSize: 24 }}>孵化圣坛</div>
        <div style={{ color: '#dfe8ee', fontSize: 12, textShadow: '0 1px 3px #000' }}>同物种 · 雌雄一对方可配种</div>
      </div>

      {/* 孵化中的蛋 */}
      {eggs.length > 0 && (
        <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', padding: '0 16px' }}>
          {eggs.map((e) => {
            const ready = Date.now() >= e.readyAt
            const remain = e.readyAt - Date.now()
            const mins = Math.floor(remain / 60000)
            const secs = Math.max(0, Math.ceil((remain % 60000) / 1000))
            return (
              <div key={e.uid} className="panel panel--wood" style={{ padding: 6 }}>
                <div className="panel__inner center-col" style={{ padding: '10px 14px', gap: 6 }}>
                  <div style={{ fontSize: 32, filter: ready ? 'drop-shadow(0 0 8px var(--gold))' : 'none', animation: ready ? 'none' : 'wiggle 1.2s ease-in-out infinite' }}>🥚</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--parch-ink)' }}>
                    {ready ? '孵化就绪' : (mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`)}
                  </div>
                  {ready
                    ? <button className="btn btn--gold" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => { const c = hatch(e.uid); if (c) setHatched(c) }}>孵化 →</button>
                    : <button className="btn btn--ghost" style={{ padding: '5px 12px', fontSize: 12 }} disabled={coins < SKIP_COST} onClick={() => skipEgg(e.uid)}>⏩ 快进（{SKIP_COST}🪙）</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 底部亲本选择台 */}
      <div style={{ position: 'absolute', bottom: 84, left: 0, right: 0, padding: '0 14px' }}>
        <div className="panel panel--wood">
          <div className="panel__inner">
            <div className="row spread" style={{ marginBottom: 10 }}>
              <ParentSlot creature={ca} label="亲本 A" />
              <div className="center-col" style={{ gap: 6 }}>
                <div style={{ fontSize: 24 }}>💞</div>
                <button className="btn btn--gold" disabled={!compatible} onClick={lay} style={{ padding: '10px 18px' }}>
                  配种下蛋
                </button>
              </div>
              <ParentSlot creature={cb} label="亲本 B" />
            </div>
            <div className="rule" style={{ margin: '4px 0 10px' }} />
            {/* 候选按兽栏分组 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 168, overflowY: 'auto', paddingBottom: 2 }}>
              {Array.from({ length: PEN_COUNT }, (_, pen) => {
                const group = roster.filter((c) => c.pen === pen)
                if (group.length === 0) return null
                return (
                  <div key={pen}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--parch-ink-2)', margin: '2px 0 4px' }}>{PEN_NAMES[pen]}</div>
                    <div className="row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                      {group.map((c) => {
                        const chosen = c.uid === a || c.uid === b
                        const dim = !chosen && !canPick(c)
                        return (
                          <button key={c.uid} onClick={() => {
                            if (c.uid === a) { setA(null); return }
                            if (c.uid === b) { setB(null); return }
                            if (!a) setA(c.uid)
                            else if (canPick(c)) setB(c.uid)
                          }}
                            style={{
                              position: 'relative', flex: '0 0 auto', border: 'none', cursor: dim ? 'not-allowed' : 'pointer',
                              borderRadius: 12, padding: 4, background: chosen ? 'var(--gold)' : 'rgba(0,0,0,.15)',
                              opacity: dim ? 0.35 : 1, boxShadow: chosen ? '0 0 0 2px var(--gold-deep)' : 'none',
                            }}>
                            <MonsterSprite genotype={c.genotype} size={56} seed={hashSeed(c.uid)} />
                            <span style={{ position: 'absolute', right: 1, top: 1 }}><SexBadge sex={c.sex} size={10} /></span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {hatched && (
        <div className="overlay" onClick={() => setHatched(null)}>
          <div className="panel panel--wood" style={{ width: 'min(88%,420px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="panel__inner center-col" style={{ gap: 10 }}>
              <div className="title title--ink" style={{ fontSize: 20 }}>破壳而出！</div>
              <MonsterSprite genotype={hatched.genotype} size={170} seed={hashSeed(hatched.uid)} />
              <div className="row gap8" style={{ alignItems: 'center' }}>
                <span style={{ color: 'var(--parch-ink-2)', fontSize: 13 }}>{SPECIES_BY_ID[hatched.genotype.species]?.name}</span>
                <SexBadge sex={hatched.sex} size={11} />
              </div>
              <RarityBadge rarity={creatureRarity(hatched.genotype)} />
              <button className="btn btn--gem" onClick={() => setHatched(null)}>收入兽栏</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ParentSlot({ creature, label }: { creature?: Creature; label: string }) {
  return (
    <div className="center-col" style={{ gap: 4, width: 96 }}>
      <div style={{
        width: 84, height: 84, borderRadius: 14, display: 'grid', placeItems: 'center',
        background: 'rgba(0,0,0,.18)', boxShadow: 'inset 0 0 0 2px var(--wood)', position: 'relative',
      }}>
        {creature
          ? <>
              <MonsterSprite genotype={creature.genotype} size={76} seed={hashSeed(creature.uid)} />
              <span style={{ position: 'absolute', right: 4, top: 4 }}><SexBadge sex={creature.sex} size={11} /></span>
            </>
          : <span style={{ color: 'var(--parch-ink-2)', fontSize: 12 }}>空</span>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--parch-ink)' }}>{label}</div>
    </div>
  )
}
