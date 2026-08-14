import assert from 'node:assert/strict'
import test from 'node:test'

import { initialLearningProgress, learningProgressReducer } from './learningProgress.js'

test('次のヒントでは現在ステップが1つ進む', () => {
  const started = learningProgressReducer(initialLearningProgress, { type: 'start' })
  const progress = learningProgressReducer(started, {
    type: 'advance',
    stepCount: 4,
  })

  assert.equal(progress.currentStep, 1)
})

test('最終ステップではそれ以上進まない', () => {
  const progress = learningProgressReducer(
    { currentStep: 3, hasStarted: true, userMarkedUnderstood: false },
    { type: 'advance', stepCount: 4 },
  )

  assert.equal(progress.currentStep, 3)
})

test('詳しい説明を受け取っても現在ステップは変わらない', () => {
  const current = { currentStep: 1, hasStarted: true, userMarkedUnderstood: false }
  const progress = learningProgressReducer(current, { type: 'details_received' })

  assert.equal(progress.currentStep, 1)
})

test('分かった操作で問題全体が完了状態になる', () => {
  const started = learningProgressReducer(initialLearningProgress, { type: 'start' })
  const progress = learningProgressReducer(started, {
    type: 'mark_understood',
  })

  assert.equal(progress.userMarkedUnderstood, true)
})
