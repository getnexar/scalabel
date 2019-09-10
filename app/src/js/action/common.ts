import Session from '../common/session'
import { LabelType, ShapeType, ViewerConfigType } from '../functional/types'
import * as types from './types'

/** init session */
export function initSessionAction (): types.InitSessionAction {
  return {
    type: types.INIT_SESSION,
    sessionId: Session.id
  }
}

/**
 * Go to item at index
 * @param {number} index
 * @return {types.GoToItemAction}
 */
export function goToItem (index: number): types.ChangeSelectAction {
  return {
    type: types.CHANGE_SELECT,
    sessionId: Session.id,
    select: { item: index }
  }
}

/**
 * Create load item action
 */
export function loadItem (
    itemIndex: number, config: ViewerConfigType): types.LoadItemAction {
  return {
    type: types.LOAD_ITEM,
    sessionId: Session.id,
    itemIndex,
    config
  }
}

/**
 * Add label to the item
 * @param {number} itemIndex
 * @param {LabelType} label
 * @param {ShapeType[]} shapes
 * @return {AddLabelAction}
 */
export function addLabel (
  itemIndex: number, label: LabelType, shapeTypes: string[] = [],
  shapes: ShapeType[] = []): types.AddLabelAction {
  return {
    type: types.ADD_LABEL,
    sessionId: Session.id,
    itemIndex,
    label, shapeTypes, shapes
  }
}

/**
 * Change the shape of the label
 * @param {number} itemIndex
 * @param {number} shapeId
 * @param {Partial<ShapeType>} props
 * @return {ChangeLabelShapeAction}
 */
export function changeLabelShape (
    itemIndex: number, shapeId: number, props: Partial<ShapeType>
  ): types.ChangeShapeAction {
  return {
    type: types.CHANGE_LABEL_SHAPE,
    sessionId: Session.id,
    itemIndex,
    shapeId,
    props
  }
}

/**
 * Change the properties of the label
 * @param {number} itemIndex
 * @param {number} labelId
 * @param {Partial<LabelType>}props
 * @return {ChangeLabelPropsAction}
 */
export function changeLabelProps (
    itemIndex: number, labelId: number, props: Partial<LabelType>
  ): types.ChangeLabelAction {
  return {
    type: types.CHANGE_LABEL_PROPS,
    sessionId: Session.id,
    itemIndex,
    labelId,
    props }
}

/**
 * Link two labels
 * @param {number} itemIndex
 * @param {[]number} labelIds labels to link
 */
export function linkLabels (
    itemIndex: number, labelIds: number[]): types.LinkLabelsAction {
  return {
    type: types.LINK_LABELS,
    sessionId: Session.id,
    itemIndex,
    labelIds
  }
}

/**
 * Delete given label
 * @param {number} itemIndex
 * @param {number} labelId
 * @return {DeleteLabelAction}
 */
export function deleteLabel (
    itemIndex: number, labelId: number): types.DeleteLabelAction {
  return {
    type: types.DELETE_LABEL,
    sessionId: Session.id,
    itemIndex,
    labelId
  }
}

/**
 * Image tagging
 * @param {number} itemIndex
 * @param {number} attributeIndex
 * @param {Array<number>} selectedIndex
 * @return {Object}
 */
export function tagImage (
  itemIndex: number,
  attributeIndex: number,
  selectedIndex: number[]): types.TagImageAction {
  return {
    type: types.TAG_IMAGE,
    sessionId: Session.id,
    itemIndex,
    attributeIndex,
    selectedIndex
  }
}

/**
 * wrapper for update all action
 */
export function updateAll (): types.UpdateAllAction {
  return {
    type: types.UPDATE_ALL,
    sessionId: Session.id
  }
}
