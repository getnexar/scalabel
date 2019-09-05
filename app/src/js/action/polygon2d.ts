import * as labels from '../common/label_types'
import { makeLabel, makePolygon } from '../functional/states'
import { Vector2D } from '../math/vector2d'
import * as actions from './common'
import { AddLabelAction } from './types'

/**
 * Create AddLabelAction to create a polygon2d label
 * @param itemIndex
 * @param category
 * @param points list of the control points
 * @param types list of the type of the control points
 * @return {AddLabelAction}
 */
export function addPolygon2dLabel (
  itemIndex: number, category: number[], points: Vector2D[],
  types: number[]): AddLabelAction {
  // create the rect object
  const polygon = makePolygon({ points, types })
  const label = makeLabel({ type: labels.POLYGON_2D, category })
  return actions.addLabel(itemIndex, label, [polygon])
}
