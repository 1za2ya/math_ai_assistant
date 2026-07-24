import Header from './components/Header/Header'

function App() {
  const handleMenuClick = () => {
    console.log('Menu clicked')
  }

  return (
    <>
      <Header onMenuClick={handleMenuClick} />
    </>
  )
}

export default App