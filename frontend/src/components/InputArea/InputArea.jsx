import './InputArea.css'

function InputArea({
  question,
  onQuestionChange,
  onMoreHint,
  isHintLoading,
  hasReachedMaxHint,
  error,
}) {
  return (
    <section className="input-area" aria-labelledby="input-area-title">
      <div className="input-area__heading">
        <p className="input-area__eyebrow">問題入力</p>
        <h2 id="input-area-title">解きたい問題を入力</h2>
      </div>

      <div className="input-area__fields">
        <div className="input-area__field">
          <label className="input-area__label" htmlFor="math-problem">
            問題
          </label>
          <textarea
            id="math-problem"
            className="input-area__textarea"
            placeholder="例：2x + 5 = 17 を解いてください"
            rows="5"
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
          />
        </div>

        <div className="input-area__field">
          <label className="input-area__label" htmlFor="detail-question">
            詳細質問
          </label>
          <textarea
            id="detail-question"
            className="input-area__textarea"
            placeholder="分からない部分や、詳しく知りたいことを入力してください"
            rows="3"
          />
        </div>
      </div>

      <div className="input-area__actions">
        <button className="input-area__button input-area__button--primary" type="button">
          送信
        </button>
        <button
          className="input-area__button"
          type="button"
          disabled={isHintLoading || hasReachedMaxHint}
          onClick={onMoreHint}
        >
          {isHintLoading ? '取得中…' : hasReachedMaxHint ? 'ヒント上限' : 'もっとヒント'}
        </button>
        <button className="input-area__button" type="button">
          分かった！
        </button>
      </div>

      {error && <p className="input-area__error" role="alert">{error}</p>}
    </section>
  )
}

export default InputArea
