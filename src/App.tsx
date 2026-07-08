import { useEffect } from 'react'
import { useGame, type Screen } from './state/store'
import Title from './screens/Title'
import Pen from './screens/Pen'
import Explore from './screens/Explore'
import Hatchery from './screens/Hatchery'
import Codex from './screens/Codex'

const NAV: { id: Screen; label: string; emoji: string }[] = [
  { id: 'pen', label: '兽栏', emoji: '🐾' },
  { id: 'explore', label: '探索', emoji: '🧭' },
  { id: 'hatchery', label: '孵化', emoji: '🥚' },
  { id: 'codex', label: '收藏', emoji: '📖' },
]

const SCREENS: Record<Screen, () => JSX.Element> = {
  title: Title, world: Pen, pen: Pen, explore: Explore, hatchery: Hatchery, codex: Codex,
}

// 设计尺寸（4:3）——所有界面按此固定尺寸布局，再整体缩放
const DESIGN_W = 900
const DESIGN_H = 675

export default function App() {
  const screen = useGame((s) => s.screen)
  const coins = useGame((s) => s.coins)
  const go = useGame((s) => s.go)
  const backToTitle = useGame((s) => s.backToTitle)

  // 按窗口大小整体等比缩放视口，保证任意尺寸下比例一致、不变形
  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
      document.documentElement.style.setProperty('--vp-scale', String(s))
    }
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
  }, [])

  // 封面独占整个视口,没有资源条和导航
  if (screen === 'title') {
    return (
      <div className="stage">
        <div className="viewport"><Title /></div>
      </div>
    )
  }

  const Current = SCREENS[screen] ?? Pen
  const active = screen === 'world' ? 'pen' : screen

  return (
    <div className="stage">
      <div className="viewport">
        <div key={screen} className="screen-fade" style={{ position: 'absolute', inset: 0 }}>
          <Current />
        </div>

        {/* 顶部资源条 */}
        <div className="topbar">
          <div className="coin"><span className="ico">🪙</span>{coins}</div>
          <button className="homebtn" title="保存并返回封面" onClick={backToTitle}>🏠</button>
        </div>

        {/* 底部导航 */}
        <div className="navbar">
          {NAV.map((n) => (
            <button key={n.id} className={`navbtn ${active === n.id ? 'on' : ''}`} onClick={() => go(n.id)}>
              <span className="emoji">{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
