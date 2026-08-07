import Header from './components/Header/Header'
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
  return (
    <>
      <Header />
      <StatusBar />
      <Home steps={demoSteps} currentStep={1} />
    </>
  )
}

export default App
