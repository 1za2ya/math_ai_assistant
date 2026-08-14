import './InputArea.css'

function InputArea({
  question,
  detailQuestion,
  onQuestionChange,
  onDetailQuestionChange,
  onProblemSubmit,
  onDetailSubmit,
  onNextHint,
  onUnderstood,
  loadingAction,
  isLoading,
  hasStarted,
  isLastStep,
  isUnderstood,
  error,
}) {
  const nextHintLabel = isUnderstood
    ? '問題を完了しました'
    : isLastStep
      ? '最後のステップです'
      : loadingAction === 'next'
        ? '取得中…'
        : '次のヒント'

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
            placeholder="現在のステップで分からない部分を入力してください"
            rows="3"
            value={detailQuestion}
            onChange={(event) => onDetailQuestionChange(event.target.value)}
          />
        </div>
      </div>

      <div className="input-area__actions">
        <button
          className="input-area__button input-area__button--primary"
          type="button"
          disabled={isLoading || !question.trim()}
          onClick={onProblemSubmit}
        >
          {loadingAction === 'problem' ? '送信中…' : '問題を送信'}
        </button>
        <button
          className="input-area__button"
          type="button"
          disabled={isLoading || !hasStarted || !detailQuestion.trim() || isUnderstood}
          onClick={onDetailSubmit}
        >
          {loadingAction === 'detail' ? '送信中…' : '詳しく送信'}
        </button>
        <button
          className="input-area__button"
          type="button"
          disabled={isLoading || !hasStarted || isLastStep || isUnderstood}
          onClick={onNextHint}
        >
          {nextHintLabel}
        </button>
        <button
          className="input-area__button"
          type="button"
          disabled={isLoading || !hasStarted || isUnderstood}
          onClick={onUnderstood}
        >
          {isUnderstood ? '理解済み' : '分かった！'}
        </button>
      </div>

      {isUnderstood && (
        <p className="input-area__completion" role="status">
          この問題を理解済みにしました。
        </p>
      )}
      {error && (
        <p className="input-area__error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default InputArea
