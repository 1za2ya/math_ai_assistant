import './Diagram.css'

function Diagram({ calculationSteps, diagram }) {
  return (
    <section className="diagram" aria-labelledby="diagram-title">
      <div className="diagram__heading">
        <p className="diagram__eyebrow">図・途中式</p>
        <h2 id="diagram-title">考え方を可視化</h2>
      </div>

      <div className="diagram__calculation">
        <h3>途中式</h3>
        {calculationSteps.length > 0 ? (
          <ol className="diagram__steps">
            {calculationSteps.map((step, index) => (
              <li className="diagram__step" key={`${index}-${step}`}>
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="diagram__empty">問題を送信すると途中式が表示されます。</p>
        )}
      </div>

      {diagram.needed && (
        <div className="diagram__visual" role="status">
          <h3>図形表示</h3>
          <p>この問題では図を使用します。</p>
        </div>
      )}
    </section>
  )
}

export default Diagram
