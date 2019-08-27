import * as labels from '../common/label_types'
import { makeLabel, makePolygon } from '../functional/states'
import * as actions from './common'
import { AddLabelAction } from './types'

/**
 * Create AddLabelAction to create a box2d label
 * @param {number} itemIndex
 * @param {number[]} category: list of category ids
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @return {AddLabelAction}
 */
export function addPolygon2dLabel (
  itemIndex: number, category: number[], controlPointX: number[],
  controlPointY: number[], controlPointType: number[]): AddLabelAction {
  // create the rect object
  const polygon = makePolygon({controlPointX, controlPointY, controlPointType})
  const label = makeLabel({ type: labels.POLYGON_2D, category })
  expect(polygon.controlPointX[0]).toBe(0)
  return actions.addLabel(itemIndex, label, [polygon])
}
