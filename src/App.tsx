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

export default function App() {
  const screen = useGame((s) => s.screen)
  const coins = useGame((s) => s.coins)
  const go = useGame((s) => s.go)
  const backToTitle = useGame((s) => s.backToTitle)

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
