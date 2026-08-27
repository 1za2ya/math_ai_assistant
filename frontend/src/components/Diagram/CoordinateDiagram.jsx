import { useId } from 'react'
import { createCoordinateDiagramModel } from './diagramGeometry'

function CoordinateDiagram({ data }) {
  const titleId = useId()
  const model = createCoordinateDiagramModel(data)

  if (model === null) {
    return (
      <p className="diagram__notice" role="status">
        座標を特定できないため、図を表示できませんでした。
      </p>
    )
  }

  return (
    <>
      <svg
        className="diagram__canvas"
        viewBox={`0 0 ${model.width} ${model.height}`}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>問題に対応した座標平面</title>

        <g className="diagram__grid" aria-hidden="true">
          {model.xTicks.map((tick) => (
            <line key={`grid-x-${tick.value}`} x1={tick.position} y1="0" x2={tick.position} y2={model.height} />
          ))}
          {model.yTicks.map((tick) => (
            <line key={`grid-y-${tick.value}`} x1="0" y1={tick.position} x2={model.width} y2={tick.position} />
          ))}
        </g>

        <g className="diagram__axes" aria-hidden="true">
          <line x1="0" y1={model.xAxisY} x2={model.width} y2={model.xAxisY} />
          <line x1={model.yAxisX} y1="0" x2={model.yAxisX} y2={model.height} />
        </g>

        <g className="diagram__tick-labels" aria-hidden="true">
          {model.xTicks.map((tick) => (
            <text key={`label-x-${tick.value}`} x={tick.position} y={model.xAxisY + 22}>
              {tick.label}
            </text>
          ))}
          {model.yTicks
            .filter((tick) => tick.value !== 0)
            .map((tick) => (
              <text key={`label-y-${tick.value}`} x={model.yAxisX - 10} y={tick.position + 4} textAnchor="end">
                {tick.label}
              </text>
            ))}
        </g>

        <g className="diagram__segments">
          {model.segments.map((segment, index) => (
            <g key={`${segment.from}-${segment.to}-${index}`}>
              <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} />
              {segment.label && (
                <text x={segment.labelX} y={segment.labelY - 10} textAnchor="middle">
                  {segment.label}
                </text>
              )}
            </g>
          ))}
        </g>

        <g className="diagram__points">
          {model.points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="5" />
              <text x={point.x + 10} y={point.y - 10}>
                {point.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {model.expressions.length > 0 && (
        <div className="diagram__expressions">
          <h4>図に関係する式</h4>
          <ul>
            {model.expressions.map((expression, index) => (
              <li key={`${index}-${expression}`}>{expression}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default CoordinateDiagram
