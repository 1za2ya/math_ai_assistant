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

function normalizeDiagram(value) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.needed !== 'boolean' ||
    (value.type !== null && !isNonEmptyString(value.type)) ||
    (value.data !== null &&
      (typeof value.data !== 'object' || Array.isArray(value.data)))
  ) {
    return null
  }

  const type = value.type?.trim() ?? null
  if (!value.needed && (type !== null || value.data !== null)) return null

  return { needed: value.needed, type, data: value.data }
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
