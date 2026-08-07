import './Home.css'
import Chat from '../../components/Chat/Chat'
import InputArea from '../../components/InputArea/InputArea'
import SolutionSteps from '../../components/SolutionSteps/SolutionSteps'

function Home({ steps, currentStep }) {
  return (
    <main className="home">
      <InputArea />

      <div className="home__workspace">
        <SolutionSteps steps={steps} currentStep={currentStep} />

        <section className="home__panel home__diagram" aria-labelledby="diagram-title">
          <div className="home__section-heading">
            <p className="home__eyebrow">図・途中式</p>
            <h2 id="diagram-title">考え方を可視化</h2>
          </div>
          <p className="home__placeholder">図や途中式が表示されます。</p>
        </section>
      </div>

      <Chat />
    </main>
  )
}

export default Home
