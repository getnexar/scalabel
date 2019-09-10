import _ from 'lodash'
import * as action from '../../js/action/common'
import * as polygon2d from '../../js/action/polygon2d'
import Session from '../../js/common/session'
import { initStore } from '../../js/common/session_init'
import { LabelTypes } from '../../js/common/types'
import { PolygonType } from '../../js/functional/types'
import { Vector2D } from '../../js/math/vector2d'
import { testJson } from '../test_image_objects'

test('Add, change and delete polygon labels', () => {
  Session.devMode = false
  initStore(testJson)
  const itemIndex = 0
  Session.dispatch(action.goToItem(itemIndex))
  Session.dispatch(polygon2d.addPolygon2dLabel(itemIndex, [0],
    [new Vector2D(0, 0), new Vector2D(1, 0),
      new Vector2D(1, 1), new Vector2D(0, 1)],
      ['', '', '', '']))
  Session.dispatch(polygon2d.addPolygon2dLabel(itemIndex, [0],
    [new Vector2D(0, 0), new Vector2D(1, 0),
      new Vector2D(1, 1), new Vector2D(0, 1)],
      ['', '', '', '']))
  Session.dispatch(polygon2d.addPolygon2dLabel(itemIndex, [0],
    [new Vector2D(0, 0), new Vector2D(1, 0),
      new Vector2D(1, 1), new Vector2D(0, 1)],
      ['', '', '', '']))
  let state = Session.getState()
  expect(_.size(state.task.items[0].labels)).toBe(3)
  expect(_.size(state.task.items[0].shapes)).toBe(3)
  const labelIds: number[] = _.map(state.task.items[0].labels, (l) => l.id)
  let label = state.task.items[0].labels[labelIds[0]]
  expect(label.item).toBe(0)
  expect(label.type).toBe(LabelTypes.POLYGON_2D)
  const indexedShape = state.task.items[0].shapes[label.shapes[0]]
  let shape = indexedShape.shape as PolygonType
  // Check label ids
  let index = 0
  _.forEach(state.task.items[0].labels, (v, i) => {
    expect(v.id).toBe(Number(i))
    expect(v.id).toBe(index)
    index += 1
  })
  // Check shape ids
  index = 0
  _.forEach(state.task.items[0].shapes, (v, i) => {
    expect(v.id).toBe(Number(i))
    expect(v.id).toBe(index)
    index += 1
  })

  expect(shape.points[0].x).toBe(0)
  expect(shape.points[1].x).toBe(1)
  expect(shape.points[2].x).toBe(1)
  expect(shape.points[3].x).toBe(0)

  expect(shape.points[0].y).toBe(0)
  expect(shape.points[1].y).toBe(0)
  expect(shape.points[2].y).toBe(1)
  expect(shape.points[3].y).toBe(1)

  expect(shape.types[0]).toBe('')
  expect(shape.types[1]).toBe('')
  expect(shape.types[2]).toBe('')
  expect(shape.types[3]).toBe('')

  Session.dispatch(
    action.changeLabelShape(
      itemIndex, indexedShape.id, { points:
      [new Vector2D(2, 0), new Vector2D(2, 2),
        new Vector2D(0, 2), new Vector2D(0, 0)] }))

  state = Session.getState()
  label = state.task.items[0].labels[label.id]
  shape = state.task.items[0].shapes[label.shapes[0]].shape as PolygonType

  expect(shape.points[0].x).toBe(2)
  expect(shape.points[1].x).toBe(2)
  expect(shape.points[2].x).toBe(0)
  expect(shape.points[3].x).toBe(0)

  expect(shape.points[0].y).toBe(0)
  expect(shape.points[1].y).toBe(2)
  expect(shape.points[2].y).toBe(2)
  expect(shape.points[3].y).toBe(0)

  expect(shape.types[0]).toBe('')
  expect(shape.types[1]).toBe('')
  expect(shape.types[2]).toBe('')
  expect(shape.types[3]).toBe('')

  Session.dispatch(action.deleteLabel(itemIndex, label.id))
  state = Session.getState()
  expect(_.size(state.task.items[itemIndex].labels)).toBe(2)
  expect(_.size(state.task.items[itemIndex].shapes)).toBe(2)
})
