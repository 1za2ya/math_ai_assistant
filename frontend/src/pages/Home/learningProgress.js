export const initialLearningProgress = {
  currentStep: 0,
  hasStarted: false,
  userMarkedUnderstood: false,
}

export function learningProgressReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return { ...initialLearningProgress }
    case 'start':
      return { ...initialLearningProgress, hasStarted: true }
    case 'advance': {
      const lastStep = Math.max(0, action.stepCount - 1)
      if (!state.hasStarted || state.userMarkedUnderstood || state.currentStep >= lastStep) {
        return state
      }
      return { ...state, currentStep: state.currentStep + 1 }
    }
    case 'details_received':
      return state
    case 'mark_understood':
      if (!state.hasStarted || state.userMarkedUnderstood) return state
      return { ...state, userMarkedUnderstood: true }
    default:
      return state
  }
}
