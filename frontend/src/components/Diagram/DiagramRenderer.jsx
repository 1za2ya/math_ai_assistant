import CoordinateDiagram from './CoordinateDiagram'

function DiagramRenderer({ diagram }) {
  if (diagram.type === 'coordinate-plane') {
    return <CoordinateDiagram data={diagram.data} />
  }

  return (
    <p className="diagram__notice" role="status">
      この種類の図形表示は現在準備中です。
    </p>
  )
}

export default DiagramRenderer
