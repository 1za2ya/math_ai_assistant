import './Header.css'

function Header({ onMenuClick }) {
  return (
    <header className="header">
      <button
        type="button"
        className="header__menu-button"
        aria-label="メニューを開く"
        onClick={onMenuClick}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <h1 className="header__title">数学AIアシスタント</h1>
    </header>
  )
}

export default Header
