import _ from 'lodash'
import * as action from '../../js/action/common'
import * as polygon2d from '../../js/action/polygon2d'
import * as labels from '../../js/common/label_types'
import Session from '../../js/common/session'
import { initStore } from '../../js/common/session_init'
import { PolygonType } from '../../js/functional/types'
import { testJson } from '../test_objects'

test('Add, change and delete polygon labels', () => {
  Session.devMode = false
  initStore(testJson)
  const itemIndex = 0
  Session.dispatch(action.goToItem(itemIndex))
  Session.dispatch(polygon2d.addPolygon2dLabel(
    itemIndex, [0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]))
  Session.dispatch(polygon2d.addPolygon2dLabel(
    itemIndex, [0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]))
  Session.dispatch(polygon2d.addPolygon2dLabel(
    itemIndex, [0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]))
  let state = Session.getState()
  expect(_.size(state.task.items[0].labels)).toBe(3)
  expect(_.size(state.task.items[0].shapes)).toBe(3)
  const labelIds: number[] = _.map(state.task.items[0].labels, (l) => l.id)
  let label = state.task.items[0].labels[labelIds[0]]
  expect(label.item).toBe(0)
  expect(label.type).toBe(labels.POLYGON_2D)
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

  expect(shape.controlPointX[0]).toBe(0)
  expect(shape.controlPointX[1]).toBe(1)
  expect(shape.controlPointX[2]).toBe(1)
  expect(shape.controlPointX[3]).toBe(0)

  expect(shape.controlPointY[0]).toBe(0)
  expect(shape.controlPointY[1]).toBe(0)
  expect(shape.controlPointY[2]).toBe(1)
  expect(shape.controlPointY[3]).toBe(1)

  expect(shape.controlPointType[0]).toBe(0)
  expect(shape.controlPointType[1]).toBe(0)
  expect(shape.controlPointType[2]).toBe(0)
  expect(shape.controlPointType[3]).toBe(0)

  Session.dispatch(
    action.changeLabelShape(
      itemIndex, indexedShape.id, { controlPointY: [2, 1, 1, 2] }))
  state = Session.getState()
  label = state.task.items[0].labels[label.id]
  shape = state.task.items[0].shapes[label.shapes[0]].shape as PolygonType

  expect(shape.controlPointX[0]).toBe(0)
  expect(shape.controlPointX[1]).toBe(1)
  expect(shape.controlPointX[2]).toBe(1)
  expect(shape.controlPointX[3]).toBe(0)

  expect(shape.controlPointY[0]).toBe(2)
  expect(shape.controlPointY[1]).toBe(1)
  expect(shape.controlPointY[2]).toBe(1)
  expect(shape.controlPointY[3]).toBe(2)

  expect(shape.controlPointType[0]).toBe(0)
  expect(shape.controlPointType[1]).toBe(0)
  expect(shape.controlPointType[2]).toBe(0)
  expect(shape.controlPointType[3]).toBe(0)

  Session.dispatch(action.deleteLabel(itemIndex, label.id))
  state = Session.getState()
  expect(_.size(state.task.items[itemIndex].labels)).toBe(2)
  expect(_.size(state.task.items[itemIndex].shapes)).toBe(2)
})
