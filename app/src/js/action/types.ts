/**
 * Define string identifiers and interfaces of actions
 */
import {
  LabelType,
  Select,
  ShapeType, Vector3Type, ViewerConfigType
} from '../functional/types'

export const INIT_SESSION = 'INIT_SESSION'
export const CHANGE_SELECT = 'CHANGE_SELECT'
export const LOAD_ITEM = 'LOAD_ITEM'
export const UPDATE_ALL = 'UPDATE_ALL'

export const IMAGE_ZOOM = 'IMAGE_ZOOM'

// Item Level
export const ADD_LABELS = 'ADD_LABELS'
export const CHANGE_SHAPES = 'CHANGE_SHAPES'
export const CHANGE_LABEL_PROPS = 'CHANGE_LABEL_PROPS'
export const LINK_LABELS = 'LINK_LABELS'
export const DELETE_LABELS = 'DELETE_LABELS'

// Image specific actions
export const TAG_IMAGE = 'TAG_IMAGE'

// View Level
export const TOGGLE_ASSISTANT_VIEW = 'TOGGLE_ASSISTANT_VIEW'

// Point Cloud Specific
export const MOVE_CAMERA_AND_TARGET = 'MOVE_CAMERA_AND_TARGET'

interface BaseAction {
  /** type of the action */
  type: string
  /** id of the session that initiates the action */
  sessionId: string
}

export type InitSessionAction = BaseAction

export interface ChangeSelectAction extends BaseAction {
  /** partial selection */
  select: Partial<Select>
}

export interface LoadItemAction extends BaseAction {
  /** Index of the item to load */
  itemIndex: number
  /** Configurations */
  config: ViewerConfigType
}

export type UpdateAllAction = BaseAction

export interface ImageZoomAction extends BaseAction {
  /** Zoom ratio */
  ratio: number
  /** View Offset X */
  viewOffsetX: number
  /** View Offset Y */
  viewOffsetY: number
}

export interface AddLabelsAction extends BaseAction {
  /** item of the added label */
  itemIndices: number[]
  /** labels to add to each item */
  labels: LabelType[][]
  /** shape types for each label */
  shapeTypes: string[][][]
  /** shapes for each label */
  shapes: ShapeType[][][]
}

export interface ChangeShapesAction extends BaseAction {
  /** item of the shape */
  itemIndices: number[]
  /** Shape ids in each item */
  shapeIds: number[][]
  /** properties to update for the shape */
  shapes: Array<Array<Partial<ShapeType>>>
}

export interface ChangeLabelAction extends BaseAction {
  /** item of the label */
  itemIndex: number
  /** Label ID */
  labelId: number
  /** properties to update for the shape */
  props: object
}

export interface LinkLabelsAction extends BaseAction {
  /** item of the labels */
  itemIndex: number,
  /** ids of the labels to link */
  labelIds: number[]
}

export interface DeleteLabelsAction extends BaseAction {
  /** item of the label */
  itemIndices: number[]
  /** ID of label to be deleted */
  labelIds: number[][]
}

export interface TagImageAction extends BaseAction {
  /** ID of the corresponding item */
  itemIndex: number
  /** Index of the attribute */
  attributeIndex: number
  /** Index of the selected attribute */
  selectedIndex: number[]
}

export type ToggleAssistantViewAction = BaseAction

export interface MoveCameraAndTargetAction extends BaseAction {
  /** New position */
  newPosition: Vector3Type
  /** New target */
  newTarget?: Vector3Type
}

export type ActionType =
    InitSessionAction
    | ChangeSelectAction
    | LoadItemAction
    | UpdateAllAction
    | ImageZoomAction
    | AddLabelsAction
    | ChangeShapesAction
    | ChangeLabelAction
    | LinkLabelsAction
    | DeleteLabelsAction
    | TagImageAction
    | ToggleAssistantViewAction
    | MoveCameraAndTargetAction
