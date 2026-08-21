import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeSolutionResponse } from './solutionResponse.js'

const baseResponse = {
  steps: ['条件を整理する', '式を立てる', '式を変形する', '確認する'],
  hint: 'まず条件を整理してみましょう。',
  calculation_steps: [' 2x + 5 = 17 ', ' 2x = 12 '],
}

test('図が不要なレスポンスを正規化する', () => {
  const result = normalizeSolutionResponse({
    ...baseResponse,
    diagram: { needed: false, type: null, data: null },
  })

  assert.deepEqual(result, {
    steps: baseResponse.steps,
    hint: baseResponse.hint,
    calculationSteps: ['2x + 5 = 17', '2x = 12'],
    diagram: { needed: false, type: null, data: null },
  })
})

test('図が必要なレスポンスの構造化データを保持する', () => {
  const result = normalizeSolutionResponse({
    ...baseResponse,
    diagram: {
      needed: true,
      type: ' coordinate-plane ',
      data: { points: [{ label: 'A', x: 0, y: 0 }] },
    },
  })

  assert.deepEqual(result.diagram, {
    needed: true,
    type: 'coordinate-plane',
    data: { points: [{ label: 'A', x: 0, y: 0 }] },
  })
})

test('空の途中式を拒否する', () => {
  const result = normalizeSolutionResponse({
    ...baseResponse,
    calculation_steps: [],
    diagram: { needed: false, type: null, data: null },
  })

  assert.equal(result, null)
})

test('図が不要な場合の余分な図形データを拒否する', () => {
  const result = normalizeSolutionResponse({
    ...baseResponse,
    diagram: { needed: false, type: 'coordinate-plane', data: {} },
  })

  assert.equal(result, null)
})

test('図が必要な場合にtypeまたはdataが欠けたレスポンスを拒否する', () => {
  const incompleteDiagrams = [
    { needed: true, type: null, data: {} },
    { needed: true, type: 'coordinate-plane', data: null },
  ]

  for (const diagram of incompleteDiagrams) {
    const result = normalizeSolutionResponse({ ...baseResponse, diagram })
    assert.equal(result, null)
  }
})
