const MIN_SOLUTION_STEPS = 4
const MAX_SOLUTION_STEPS = 6

export const EMPTY_DIAGRAM = Object.freeze({ needed: false, type: null, data: null })

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeTextList(value) {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
    return null
  }
  return value.map((item) => item.trim())
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value, keys) {
  const actualKeys = Object.keys(value).sort()
  const expectedKeys = [...keys].sort()
  return actualKeys.length === expectedKeys.length && expectedKeys.every(
    (key, index) => key === actualKeys[index],
  )
}

function normalizeDiagramData(value) {
  if (!isObject(value) || !hasExactKeys(value, ['expressions', 'points', 'segments'])) {
    return null
  }

  const { points, segments, expressions } = value
  if (![points, segments, expressions].every(Array.isArray)) return null
  if (points.length === 0 && segments.length === 0 && expressions.length === 0) return null

  const normalizedPoints = []
  const labels = new Set()
  for (const point of points) {
    if (!isObject(point) || !hasExactKeys(point, ['label', 'x', 'y'])) return null

    const label = isNonEmptyString(point.label) ? point.label.trim() : null
    const validX = point.x === null || (typeof point.x === 'number' && Number.isFinite(point.x))
    const validY = point.y === null || (typeof point.y === 'number' && Number.isFinite(point.y))
    if (label === null || !validX || !validY || labels.has(label)) return null

    labels.add(label)
    normalizedPoints.push({ label, x: point.x, y: point.y })
  }

  const normalizedSegments = []
  for (const segment of segments) {
    if (!isObject(segment) || !hasExactKeys(segment, ['from', 'label', 'to'])) return null

    const from = isNonEmptyString(segment.from) ? segment.from.trim() : null
    const to = isNonEmptyString(segment.to) ? segment.to.trim() : null
    const label = segment.label === null
      ? null
      : isNonEmptyString(segment.label)
        ? segment.label.trim()
        : null

    if (
      from === null ||
      to === null ||
      (segment.label !== null && label === null) ||
      !labels.has(from) ||
      !labels.has(to)
    ) {
      return null
    }

    normalizedSegments.push({ from, to, label })
  }

  const normalizedExpressions = normalizeTextList(expressions) ?? (expressions.length === 0 ? [] : null)
  if (normalizedExpressions === null) return null

  return {
    points: normalizedPoints,
    segments: normalizedSegments,
    expressions: normalizedExpressions,
  }
}

function normalizeDiagram(value) {
  if (
    !isObject(value) ||
    !hasExactKeys(value, ['data', 'needed', 'type']) ||
    typeof value.needed !== 'boolean' ||
    (value.type !== null && !isNonEmptyString(value.type)) ||
    (value.data !== null && !isObject(value.data))
  ) {
    return null
  }

  const type = value.type?.trim() ?? null
  if (value.needed) {
    if (type === null || value.data === null) return null
    const data = normalizeDiagramData(value.data)
    if (data === null) return null
    return { needed: true, type, data }
  } else if (type !== null || value.data !== null) {
    return null
  }

  return EMPTY_DIAGRAM
}

export function normalizeSolutionResponse(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null

  const steps = normalizeTextList(value.steps)
  const calculationSteps = normalizeTextList(value.calculation_steps)
  const diagram = normalizeDiagram(value.diagram)

  if (
    steps === null ||
    steps.length < MIN_SOLUTION_STEPS ||
    steps.length > MAX_SOLUTION_STEPS ||
    !isNonEmptyString(value.hint) ||
    calculationSteps === null ||
    diagram === null
  ) {
    return null
  }

  return {
    steps,
    hint: value.hint.trim(),
    calculationSteps,
    diagram,
  }
}
