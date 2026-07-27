import './StatusBar.css'

const steps = ['問題入力', '解法整理', 'ヒント', '理解確認']

function StatusBar() {
  return (
    <nav className="status-bar" aria-label="学習の進捗">
      <ol className="status-bar__steps">
        {steps.map((step, index) => (
          <li className="status-bar__item" key={step}>
            <span
              className={`status-bar__step${index === 0 ? ' status-bar__step--current' : ''}`}
              aria-current={index === 0 ? 'step' : undefined}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span className="status-bar__arrow" aria-hidden="true">→</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default StatusBar
