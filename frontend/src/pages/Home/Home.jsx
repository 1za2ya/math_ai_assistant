import './Home.css'
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

      <section className="home__chat" aria-labelledby="chat-title">
        <div className="home__section-heading">
          <p className="home__eyebrow">AIチャット</p>
          <h2 id="chat-title">質問する</h2>
        </div>
        <p className="home__placeholder">AIとの会話がここに表示されます。</p>
      </section>
    </main>
  )
}

export default Home
