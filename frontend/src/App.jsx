import { useState } from 'react'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import StatusBar from './components/StatusBar/StatusBar'
import Home from './pages/Home/Home'

const demoSteps = [
  '問題文から分かる条件を整理する',
  '未知数を使って式を立てる',
  '等式の性質を使って式を変形する',
  '未知数の値を求める',
  '求めた値を元の式に代入して確認する',
]

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen((isOpen) => !isOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <>
      <Header onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <StatusBar />
      <Home steps={demoSteps} currentStep={1} />
    </>
  )
}

export default App
