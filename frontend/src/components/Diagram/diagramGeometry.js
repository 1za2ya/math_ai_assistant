export const DIAGRAM_VIEWBOX = Object.freeze({ width: 640, height: 360 })

const VIEWBOX_PADDING = 48
const DATA_MARGIN_RATIO = 0.12
const TARGET_TICK_COUNT = 8

function expandRange(min, max) {
  if (min === max) return [min - 1, max + 1]

  const margin = (max - min) * DATA_MARGIN_RATIO
  return [min - margin, max + margin]
}

function createBounds(points) {
  let rawMinX = 0
  let rawMaxX = 0
  let rawMinY = 0
  let rawMaxY = 0

  for (const point of points) {
    rawMinX = Math.min(rawMinX, point.x)
    rawMaxX = Math.max(rawMaxX, point.x)
    rawMinY = Math.min(rawMinY, point.y)
    rawMaxY = Math.max(rawMaxY, point.y)
  }

  const [minX, maxX] = expandRange(rawMinX, rawMaxX)
  const [minY, maxY] = expandRange(rawMinY, rawMaxY)

  return { minX, maxX, minY, maxY }
}

function createScale(bounds) {
  const drawableWidth = DIAGRAM_VIEWBOX.width - VIEWBOX_PADDING * 2
  const drawableHeight = DIAGRAM_VIEWBOX.height - VIEWBOX_PADDING * 2
  return Math.min(
    drawableWidth / (bounds.maxX - bounds.minX),
    drawableHeight / (bounds.maxY - bounds.minY),
  )
}

function createCoordinateMapper(bounds, scale) {
  const contentWidth = (bounds.maxX - bounds.minX) * scale
  const contentHeight = (bounds.maxY - bounds.minY) * scale
  const offsetX = (DIAGRAM_VIEWBOX.width - contentWidth) / 2
  const offsetY = (DIAGRAM_VIEWBOX.height - contentHeight) / 2

  return (x, y) => ({
    x: offsetX + (x - bounds.minX) * scale,
    y: DIAGRAM_VIEWBOX.height - (offsetY + (y - bounds.minY) * scale),
  })
}

function chooseTickStep(range) {
  const roughStep = range / TARGET_TICK_COUNT
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalizedStep = roughStep / magnitude

  if (normalizedStep <= 1) return magnitude
  if (normalizedStep <= 2) return 2 * magnitude
  if (normalizedStep <= 5) return 5 * magnitude
  return 10 * magnitude
}

function formatTick(value, step) {
  const decimalPlaces = Math.min(12, Math.max(0, -Math.floor(Math.log10(step))))
  const normalizedValue = Math.abs(value) < step / 1000 ? 0 : value
  return Number(normalizedValue.toFixed(decimalPlaces)).toString()
}

function createTicks(min, max, axis, map) {
  const step = chooseTickStep(max - min)
  const firstTick = Math.ceil(min / step) * step
  const ticks = []

  for (let value = firstTick; value <= max + step / 1000; value += step) {
    const position = axis === 'x' ? map(value, 0).x : map(0, value).y
    ticks.push({ value, position, label: formatTick(value, step) })
  }

  return ticks
}

export function createCoordinateDiagramModel(data) {
  if (
    data === null ||
    typeof data !== 'object' ||
    !Array.isArray(data.points) ||
    !Array.isArray(data.segments) ||
    !Array.isArray(data.expressions)
  ) {
    return null
  }

  const plottablePoints = data.points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  )
  if (plottablePoints.length === 0 && data.expressions.length === 0) return null

  const bounds = createBounds(plottablePoints)
  const scale = createScale(bounds)
  if (!Object.values(bounds).every(Number.isFinite) || !Number.isFinite(scale) || scale <= 0) {
    return null
  }
  const map = createCoordinateMapper(bounds, scale)
  const mappedPoints = plottablePoints.map((point) => ({ ...point, ...map(point.x, point.y) }))
  const pointsByLabel = new Map(mappedPoints.map((point) => [point.label, point]))

  const segments = []
  for (const segment of data.segments) {
    const from = pointsByLabel.get(segment.from)
    const to = pointsByLabel.get(segment.to)
    if (!from || !to) continue

    segments.push({
      ...segment,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      labelX: (from.x + to.x) / 2,
      labelY: (from.y + to.y) / 2,
    })
  }

  const origin = map(0, 0)
  return {
    width: DIAGRAM_VIEWBOX.width,
    height: DIAGRAM_VIEWBOX.height,
    points: mappedPoints,
    segments,
    expressions: data.expressions,
    xAxisY: origin.y,
    yAxisX: origin.x,
    xTicks: createTicks(bounds.minX, bounds.maxX, 'x', map),
    yTicks: createTicks(bounds.minY, bounds.maxY, 'y', map),
  }
}
