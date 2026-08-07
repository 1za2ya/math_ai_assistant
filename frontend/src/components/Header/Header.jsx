import './Header.css'

function Header({ onMenuClick, isMenuOpen }) {
  return (
    <header className="header">
      <button
        type="button"
        className="header__menu-button"
        aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-controls="app-sidebar"
        aria-expanded={isMenuOpen}
        onClick={onMenuClick}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <h1 className="header__title">数学AIアシスタント</h1>
    </header>
  )
}

export default Header
