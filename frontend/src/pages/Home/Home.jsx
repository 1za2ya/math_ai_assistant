import './Home.css'
import Chat from '../../components/Chat/Chat'
import InputArea from '../../components/InputArea/InputArea'

function Home() {
  return (
    <main className="home">
      <InputArea />

      <div className="home__workspace">
        <section className="home__panel home__steps" aria-labelledby="solution-steps-title">
          <div className="home__section-heading">
            <p className="home__eyebrow">解法ステップ</p>
            <h2 id="solution-steps-title">解き方</h2>
          </div>
          <p className="home__placeholder">ここに解法のステップが表示されます。</p>
        </section>

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
