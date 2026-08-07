import './SolutionSteps.css'

function SolutionSteps({ steps, currentStep }) {
  return (
    <section className="solution-steps" aria-labelledby="solution-steps-title">
      <div className="solution-steps__heading">
        <p className="solution-steps__eyebrow">解法ステップ</p>
        <h2 id="solution-steps-title">解き方</h2>
      </div>

      <ol className="solution-steps__list">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep

          return (
            <li
              className={`solution-steps__item${isCurrent ? ' solution-steps__item--current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              key={`${index}-${step}`}
            >
              {step}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default SolutionSteps
