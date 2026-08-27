import assert from 'node:assert/strict'
import test from 'node:test'

import { DIAGRAM_VIEWBOX, createCoordinateDiagramModel } from './diagramGeometry.js'

function createData(overrides = {}) {
  return {
    points: [
      { label: 'A', x: -2, y: -2 },
      { label: 'B', x: 2, y: 2 },
    ],
    segments: [{ from: 'A', to: 'B', label: 'AB' }],
    expressions: [],
    ...overrides,
  }
}

test('座標をSVG内へ収めて線分の描画位置を作る', () => {
  const model = createCoordinateDiagramModel(createData())

  assert.ok(model)
  for (const point of model.points) {
    assert.ok(point.x > 0 && point.x < DIAGRAM_VIEWBOX.width)
    assert.ok(point.y > 0 && point.y < DIAGRAM_VIEWBOX.height)
  }
  assert.deepEqual(model.segments[0], {
    from: 'A',
    to: 'B',
    label: 'AB',
    x1: model.points[0].x,
    y1: model.points[0].y,
    x2: model.points[1].x,
    y2: model.points[1].y,
    labelX: (model.points[0].x + model.points[1].x) / 2,
    labelY: (model.points[0].y + model.points[1].y) / 2,
  })
})

test('数学上の正のy方向をSVG上では上方向へ変換する', () => {
  const model = createCoordinateDiagramModel(createData())
  const lowerPoint = model.points.find((point) => point.label === 'A')
  const upperPoint = model.points.find((point) => point.label === 'B')

  assert.ok(upperPoint.y < lowerPoint.y)
  assert.ok(model.xAxisY > 0 && model.xAxisY < DIAGRAM_VIEWBOX.height)
  assert.ok(model.yAxisX > 0 && model.yAxisX < DIAGRAM_VIEWBOX.width)
})

test('座標不明の点とそれを参照する線分だけを描画対象から除外する', () => {
  const model = createCoordinateDiagramModel(
    createData({
      points: [
        { label: 'A', x: 0, y: 0 },
        { label: 'B', x: 4, y: 3 },
        { label: 'C', x: null, y: null },
      ],
      segments: [
        { from: 'A', to: 'B', label: 'AB' },
        { from: 'B', to: 'C', label: 'BC' },
      ],
    }),
  )

  assert.ok(model)
  assert.deepEqual(model.points.map((point) => point.label), ['A', 'B'])
  assert.equal(model.segments.length, 1)
  assert.equal(model.segments[0].label, 'AB')
})

test('点がなくても式があれば座標平面へ表示する', () => {
  const model = createCoordinateDiagramModel(
    createData({ points: [], segments: [], expressions: ['y = x^2'] }),
  )

  assert.ok(model)
  assert.deepEqual(model.points, [])
  assert.deepEqual(model.segments, [])
  assert.deepEqual(model.expressions, ['y = x^2'])
})

test('描画可能な点も式もない場合は座標平面を描画しない', () => {
  const model = createCoordinateDiagramModel(
    createData({
      points: [{ label: 'A', x: null, y: null }],
      segments: [],
      expressions: [],
    }),
  )

  assert.equal(model, null)
})

test('描画範囲を計算できない極端な座標では描画しない', () => {
  const model = createCoordinateDiagramModel(
    createData({
      points: [
        { label: 'A', x: -Number.MAX_VALUE, y: 0 },
        { label: 'B', x: Number.MAX_VALUE, y: 0 },
      ],
      segments: [],
    }),
  )

  assert.equal(model, null)
})

test('正規化を経由せず不完全なデータが渡されても例外にしない', () => {
  assert.equal(createCoordinateDiagramModel(null), null)
  assert.equal(createCoordinateDiagramModel({ points: [] }), null)
})
