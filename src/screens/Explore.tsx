import { useEffect, useState } from 'react'
import { useGame, TOTAL_CAP, EXPLORE_COST, SKIP_COST, type ExploreResult } from '../state/store'
import { BIOME_INFO, SPECIES_BY_BIOME } from '../engine/species'
import type { Biome } from '../engine/types'
import MonsterSprite from '../components/MonsterSprite'
import { RarityBadge } from '../components/ui'
import { creatureRarity } from '../engine/genetics'
import { hashSeed } from '../components/CreatureDetail'

const BIOMES: Biome[] = ['forest', 'volcano', 'beach']

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}分${(s % 60).toString().padStart(2, '0')}秒` : `${s}秒`
}

export default function Explore() {
  const expedition = useGame((s) => s.expedition)
  const roster = useGame((s) => s.roster)
  const coins = useGame((s) => s.coins)
  const startExpedition = useGame((s) => s.startExpedition)
  const skipExpedition = useGame((s) => s.skipExpedition)
  const claimExpedition = useGame((s) => s.claimExpedition)
  const [result, setResult] = useState<ExploreResult | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(t)
  }, [])

  const full = roster.length >= TOTAL_CAP
  const poor = coins < EXPLORE_COST
  const noSkip = coins < SKIP_COST

  let content
  if (expedition) {
    // —— 探索进行中 / 完成 ——
    const info = BIOME_INFO[expedition.biome]
    const ready = Date.now() >= expedition.readyAt
    const remain = expedition.readyAt - Date.now()
    const total = expedition.readyAt - expedition.startAt
    const pct = Math.min(100, Math.max(0, (1 - remain / total) * 100))
    content = (
      <div className="scene" style={{ backgroundImage: `url(${info.art})` }}>
        <div style={{ position: 'absolute', top: 58, left: 0, right: 0, textAlign: 'center' }}>
          <div className="title" style={{ fontSize: 26 }}>{info.name}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 96, left: 16, right: 16 }}>
          <div className="panel panel--wood">
            <div className="panel__inner center-col" style={{ gap: 12 }}>
              <div className="title title--ink" style={{ fontSize: 18 }}>{ready ? '探索归来' : '探索中…'}</div>
              {!ready && (
                <>
                  <div style={{ width: '100%', height: 14, borderRadius: 8, background: 'rgba(0,0,0,.25)', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,.5)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--gold-light))', transition: 'width .5s linear' }} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--parch-ink-2)' }}>剩余 {fmt(remain)}</div>
                </>
              )}
              <div className="row gap12">
                {!ready && <button className="btn btn--ghost" disabled={noSkip} onClick={() => skipExpedition()}>⏩ 快进（{SKIP_COST}🪙）</button>}
                {ready && <button className="btn btn--gold" onClick={() => setResult(claimExpedition())}>查看收获 →</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    // —— 选择探索地 ——
    content = (
      <div className="scene" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #3a5a2a, #14210e)' }}>
        <div style={{ position: 'absolute', top: 58, left: 0, right: 0, textAlign: 'center' }}>
          <div className="title" style={{ fontSize: 24 }}>探索秘境</div>
          <div style={{ color: '#d8e8c8', fontSize: 12, textShadow: '0 1px 3px #000' }}>
            {full ? '兽栏已满，无法探索' : poor ? `金币不足，探索需 ${EXPLORE_COST}🪙` : `每次探索 ${EXPLORE_COST}🪙 · 约 20 分钟`}
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center', padding: '90px 20px 100px' }}>
          {BIOMES.map((b) => {
            const info = BIOME_INFO[b]
            const pool = SPECIES_BY_BIOME[b]
            return (
              <div key={b} className="gilt"
                style={{
                  position: 'relative', flex: 1, borderRadius: 'var(--r-lg)',
                  opacity: full ? 0.6 : 1,
                  backgroundImage: `url(${info.art})`, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden', minHeight: 0,
                }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,8,4,.7), transparent 65%)' }} />
                <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', textAlign: 'left' }}>
                  <div className="title" style={{ fontSize: 22 }}>{info.name}</div>
                  <div style={{ color: '#f0e6d0', fontSize: 12, textShadow: '0 1px 3px #000' }}>栖息：{pool.map((s) => s.name).join(' · ')}</div>
                </div>
                <button onClick={() => startExpedition(b)} disabled={full || poor} className="btn btn--gold"
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '10px 18px', lineHeight: 1.15,
                  }}>
                  <span style={{ fontSize: 15 }}>🧭 探索</span>
                  <span style={{ fontSize: 12, opacity: .9 }}>{EXPLORE_COST}🪙</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {content}
      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
    </>
  )
}

function ResultModal({ result, onClose }: { result: ExploreResult; onClose: () => void }) {
  const c = result.creature
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel panel--wood" style={{ width: 'min(88%,420px)' }} onClick={(e) => e.stopPropagation()}>
        <div className="panel__inner center-col" style={{ gap: 10 }}>
          {c ? (
            <>
              <div className="title title--ink" style={{ fontSize: 20 }}>{result.rare ? '✨ 稀有发现！' : '发现新伙伴！'}</div>
              <MonsterSprite genotype={c.genotype} size={170} seed={hashSeed(c.uid)} />
              <RarityBadge rarity={creatureRarity(c.genotype)} />
              <div style={{ color: 'var(--parch-ink-2)', fontSize: 13 }}>已收入兽栏</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 42 }}>🍃</div>
              <div className="title title--ink" style={{ fontSize: 18 }}>空手而归</div>
              <div style={{ color: 'var(--parch-ink-2)', fontSize: 13 }}>这次什么都没遇到，再探一次吧。</div>
            </>
          )}
          <button className="btn btn--gem" onClick={onClose}>好的</button>
        </div>
      </div>
    </div>
  )
}
