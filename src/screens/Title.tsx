import { useState } from 'react'
import { useGame } from '../state/store'
import { deleteSlot, fmtTime, listSlots, SLOT_COUNT, type SlotMeta } from '../state/saves'

type Modal = null | 'new' | 'load'

// 退出:安卓 App 走 Capacitor,桌面版走 pywebview,浏览器里退回 window.close()
function quitGame() {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  if (cap?.isNativePlatform?.()) {
    import('@capacitor/app').then(({ App }) => App.exitApp()).catch(() => {})
    return
  }
  const api = (window as unknown as { pywebview?: { api?: { quit?: () => void } } }).pywebview?.api
  if (api?.quit) api.quit()
  else window.close()
}

export default function Title() {
  const newGame = useGame((s) => s.newGame)
  const loadGame = useGame((s) => s.loadGame)
  const [modal, setModal] = useState<Modal>(null)
  const [slots, setSlots] = useState<(SlotMeta | null)[]>(() => listSlots())
  const [confirm, setConfirm] = useState<{ kind: 'overwrite' | 'delete'; slot: number } | null>(null)

  const refresh = () => setSlots(listSlots())
  const open = (m: Modal) => { refresh(); setConfirm(null); setModal(m) }

  const onPick = (i: number, meta: SlotMeta | null) => {
    if (modal === 'new') {
      if (meta) setConfirm({ kind: 'overwrite', slot: i })   // 有档:先确认覆盖
      else newGame(i)
    } else if (modal === 'load' && meta) {
      loadGame(i)
    }
  }

  const onConfirm = () => {
    if (!confirm) return
    if (confirm.kind === 'overwrite') newGame(confirm.slot)
    else { deleteSlot(confirm.slot); setConfirm(null); refresh() }
  }

  return (
    <div className="title-screen">
      <div className="title-menu">
        <button className="title-btn" onClick={() => open('new')}>新的开始</button>
        <button className="title-btn" onClick={() => open('load')}>载入存档</button>
        <button className="title-btn title-btn--quit" onClick={quitGame}>退出游戏</button>
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="panel slot-panel" onClick={(e) => e.stopPropagation()}>
            <div className="slot-panel__head">
              <b>{modal === 'new' ? '选择存档位开始新游戏' : '载入存档'}</b>
              <button className="xbtn" onClick={() => setModal(null)}>✕</button>
            </div>

            {Array.from({ length: SLOT_COUNT }, (_, k) => {
              const i = k + 1
              const meta = slots[k]
              const disabled = modal === 'load' && !meta
              return (
                <div key={i} className={`slot-row ${disabled ? 'slot-row--empty' : ''}`}>
                  <button className="slot-row__main" disabled={disabled} onClick={() => onPick(i, meta)}>
                    <span className="slot-row__no">存档 {i}</span>
                    {meta ? (
                      <span className="slot-row__info">
                        🐾{meta.rosterCount} · 📖{meta.collectionCount} · 🪙{meta.coins}
                        <em>{fmtTime(meta.savedAt)}</em>
                      </span>
                    ) : (
                      <span className="slot-row__info slot-row__info--empty">— 空 —</span>
                    )}
                  </button>
                  {meta && modal === 'load' && (
                    <button className="slot-row__del" title="删除此存档"
                      onClick={() => setConfirm({ kind: 'delete', slot: i })}>🗑</button>
                  )}
                </div>
              )
            })}

            {confirm && (
              <div className="slot-confirm">
                <span>
                  {confirm.kind === 'overwrite'
                    ? `存档 ${confirm.slot} 已有进度,覆盖后无法找回,确定?`
                    : `确定删除存档 ${confirm.slot}?无法找回。`}
                </span>
                <button className="btn btn--danger" onClick={onConfirm}>确定</button>
                <button className="btn" onClick={() => setConfirm(null)}>取消</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
