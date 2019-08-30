import { makeItem } from './states'
import {
  ImageViewerConfigType,
  ItemType,
  PointCloudViewerConfigType,
  ShapeType,
  State,
  UserType,
  ViewerConfigType
} from './types'
import { updateObject } from './util'

/**
 * Get the current item from state
 * @param {State} state
 * @return {ItemType}: If no item is selected, return a new item with id -1
 */
export function getCurrentItem (state: State): ItemType {
  if (state.user.select.item < 0) {
    return makeItem()
  } else {
    return state.task.items[state.user.select.item]
  }
}

/**
 * Get the current item viewer config
 * @param {State} state
 * @return {ViewerConfigType}
 */
export function getCurrentItemViewerConfig (state: State):
  ViewerConfigType | null {
  switch (state.task.config.itemType) {
    case 'image':
      return state.user.imageViewerConfig
    case 'pointcloud':
      return state.user.pointCloudViewerConfig
    default:
      return state.user.imageViewerConfig
  }
}

/**
 * Set current item viewer config
 * @param {State} state
 * @param {ViewerConfigType} config
 * @return {State}
 */
export function setCurrentItemViewerConfig (
    state: State, config: ViewerConfigType): State {
  let newUser: UserType = state.user
  switch (state.task.config.itemType) {
    case 'image':
      newUser = updateObject(state.user, {
        imageViewerConfig: config as ImageViewerConfigType
      })
      break
    case 'pointcloud':
      newUser = updateObject(state.user, {
        pointCloudViewerConfig: config as PointCloudViewerConfigType
      })
      break
  }
  return updateObject(state, { user: newUser })
}

/**
 * Get shape from the state
 * @param state
 * @param itemIndex
 * @param labelId
 * @param shapeIndex
 */
export function getShape (state: State, itemIndex: number,
                          labelId: number, shapeIndex: number): ShapeType {
  return state.task.items[itemIndex].shapes[
    state.task.items[itemIndex].labels[labelId].shapes[shapeIndex]].shape
}

/**
 * Check whether the current item is loaded
 * @param {State} state
 * @return boolean
 */
export function isItemLoaded (state: State): boolean {
  return state.session.items[state.user.select.item].loaded
}
