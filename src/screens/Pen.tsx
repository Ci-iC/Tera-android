import { useEffect, useRef, useState } from 'react'
import { useGame, PEN_COUNT, PEN_CAP, PEN_NAMES, penCounts } from '../state/store'
import MonsterSprite from '../components/MonsterSprite'
import CreatureDetail, { hashSeed } from '../components/CreatureDetail'
import { creatureRarity } from '../engine/genetics'

const RARITY_GLOW: Record<string, string> = {
  common: 'transparent', uncommon: 'rgba(95,191,109,.5)', rare: 'rgba(74,159,224,.6)',
  epic: 'rgba(176,111,224,.7)', legendary: 'rgba(240,169,58,.8)',
}

// 可行走区域（视口百分比）——收在栏杆以内的泥地带
const AREA = { x0: 28, x1: 72, y0: 36, y1: 62 }
const SPEED = 6 // 漫步速度：约 6% 视口宽/秒

interface Walk { x: number; y: number; facing: boolean; dur: number }
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export default function Pen() {
  const roster = useGame((s) => s.roster)
  const release = useGame((s) => s.release)
  const enshrine = useGame((s) => s.enshrine)
  const [penIdx, setPenIdx] = useState(0)
  const [openUid, setOpenUid] = useState<string | null>(null)
  const open = roster.find((c) => c.uid === openUid) ?? null

  const pets = roster.filter((c) => c.pen === penIdx)
  const counts = penCounts(roster)

  const [walk, setWalk] = useState<Record<string, Walk>>({})
  const walkRef = useRef(walk)
  walkRef.current = walk

  const petsKey = pets.map((c) => c.uid).join(',')
  useEffect(() => {
    let alive = true
    const timers: Record<string, ReturnType<typeof setTimeout>> = {}

    // 初始随机站位（换栏时重置）
    setWalk(() => {
      const next: Record<string, Walk> = {}
      pets.forEach((c) => {
        next[c.uid] = { x: rand(AREA.x0, AREA.x1), y: rand(AREA.y0, AREA.y1), facing: Math.random() < 0.5, dur: 0 }
      })
      return next
    })

    const step = (uid: string) => {
      if (!alive) return
      const cur = walkRef.current[uid]
      if (!cur) return
      const tx = rand(AREA.x0, AREA.x1)
      const ty = rand(AREA.y0, AREA.y1)
      const dist = Math.hypot(tx - cur.x, ty - cur.y)
      const dur = Math.max(1.2, dist / SPEED)          // 秒，距离越远走越久（匀速）
      const facing = tx >= cur.x                        // 朝向移动方向
      setWalk((prev) => ({ ...prev, [uid]: { x: tx, y: ty, facing, dur } }))
      const pause = rand(0.6, 3.0)                      // 到达后停顿一会儿
      timers[uid] = setTimeout(() => step(uid), (dur + pause) * 1000)
    }

    // 错开启动，避免整齐划一
    pets.forEach((c, i) => { timers[c.uid] = setTimeout(() => step(c.uid), 400 + i * 350) })

    return () => { alive = false; Object.values(timers).forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petsKey, penIdx])

  return (
    <div className="scene" style={{ backgroundImage: `url(/assets/locations/pen${penIdx + 1}.png)` }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
        <span className="title" style={{ fontSize: 22 }}>{PEN_NAMES[penIdx]} · {pets.length}/{PEN_CAP}</span>
      </div>

      {/* 兽栏切换页签 */}
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 5 }}>
        {Array.from({ length: PEN_COUNT }, (_, i) => (
          <button key={i} className={`pentab ${i === penIdx ? 'on' : ''}`} onClick={() => setPenIdx(i)}>
            {['一', '二', '三', '四'][i]}
            <span className="pentab__n">{counts[i]}/{PEN_CAP}</span>
          </button>
        ))}
      </div>

      {pets.map((c, i) => {
        const w = walk[c.uid]
        if (!w) return null
        const glow = RARITY_GLOW[creatureRarity(c.genotype)]
        return (
          <button
            key={c.uid}
            onClick={() => setOpenUid(c.uid)}
            className="pet"
            style={{
              position: 'absolute', left: `${w.x}%`, top: `${w.y}%`,
              transform: 'translate(-50%,-50%)',
              transition: w.dur ? `left ${w.dur}s ease-in-out, top ${w.dur}s ease-in-out` : undefined,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              zIndex: Math.round(w.y),
            }}
          >
            <span
              className="pet__bob"
              style={{
                display: 'block',
                filter: glow !== 'transparent' ? `drop-shadow(0 0 10px ${glow})` : undefined,
                animationDelay: `${(i % 5) * 0.4}s`,
              }}
            >
              <MonsterSprite genotype={c.genotype} size={96} facingRight={w.facing} seed={hashSeed(c.uid)} />
            </span>
          </button>
        )
      })}

      {open && (
        <CreatureDetail
          creature={open}
          showMove
          onClose={() => setOpenUid(null)}
          onEnshrine={() => { enshrine(open.uid); setOpenUid(null) }}
          onRelease={() => { release(open.uid); setOpenUid(null) }}
        />
      )}
    </div>
  )
}
