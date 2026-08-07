import { useEffect } from 'react'
import './Sidebar.css'

const menuItems = ['ホーム', '苦手分析', '設定', 'ヘルプ']

function Sidebar({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <div
      className={`sidebar-layer${isOpen ? ' sidebar-layer--open' : ''}`}
      aria-hidden={!isOpen}
      inert={!isOpen ? '' : undefined}
    >
      <button
        type="button"
        className="sidebar__overlay"
        aria-label="サイドバーを閉じる"
        tabIndex={-1}
        onClick={onClose}
      />

      <aside id="app-sidebar" className="sidebar" aria-label="メインメニュー">
        <div className="sidebar__header">
          <h2 className="sidebar__title">メニュー</h2>
          <button
            type="button"
            className="sidebar__close-button"
            aria-label="サイドバーを閉じる"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <nav aria-label="サイドバーナビゲーション">
          <ul className="sidebar__menu">
            {menuItems.map((item) => (
              <li key={item}>
                <button type="button" className="sidebar__menu-button">
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default Sidebar
