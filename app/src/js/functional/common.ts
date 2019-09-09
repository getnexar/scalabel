/**
 * Main functions for transforming state
 * NOTE: All the functions should be pure
 * Pure Function: https://en.wikipedia.org/wiki/Pure_function
 */
import _ from 'lodash'
import * as types from '../action/types'
import { makeIndexedShape } from './states'
import {
  IndexedShapeType, ItemType, LabelType, Select, ShapeType, State,
  TaskStatus, UserType
} from './types'
import {
  assignToArray, getObjectKeys,
  pickArray,
  pickObject,
  removeListItems,
  removeObjectFields,
  updateListItem,
  updateObject
} from './util'

/**
 * Initialize state
 * @param {State} state
 * @return {State}
 */
export function initSession (state: State): State {
  // initialize state
  let session = state.session
  const items = session.items.slice()
  for (let i = 0; i < items.length; i++) {
    items[i] = updateObject(items[i], { loaded: false })
  }
  session = updateObject(session, { items })
  return updateObject(state, { session })
}

/**
 * Update the selected label in user
 * @param {UserType} user
 * @param {Partial<Select>} pselect partial selection
 */
function updateUserSelect (user: UserType, pselect: Partial<Select>): UserType {
  const select = updateObject(user.select, pselect)
  return updateObject(user, { select })
}

/**
 * Add new label. The ids of label and shapes will be updated according to
 * the current state.
 * @param {State} state: current state
 * @param {types.AddLabelAction} action
 * @return {State}
 */
export function addLabel (
  state: State, sessionId: string, itemIndex: number, label: LabelType,
  shapeTypes: string[] = [], shapes: ShapeType[] = []): State {
  const addLabelsAction: types.AddLabelsAction = {
    type: types.ADD_LABELS,
    sessionId,
    itemIndices: [itemIndex],
    labels: [[label]],
    shapeTypes: [[shapeTypes]],
    shapes: [[shapes]]
  }
  return addLabels(state, addLabelsAction)
}

/**
 * Add news labels to one item
 * @param item
 * @param taskStatus
 * @param label
 * @param shapeTypes
 * @param shapes
 */
function addLabelsToItem (
    item: ItemType, taskStatus: TaskStatus, newLabels: LabelType[],
    shapeTypes: string[][], shapes: ShapeType[][]
  ): [ItemType, LabelType[], TaskStatus] {
  newLabels = [...newLabels]
  const newLabelIds: number[] = []
  const newShapeIds: number[] = []
  const newShapes: IndexedShapeType[] = []
  newLabels.forEach((label, index) => {
    const newShapeId = taskStatus.maxShapeId + 1 + newShapes.length
    const labelId = taskStatus.maxLabelId + 1 + index
    const shapeIds = _.range(shapes[index].length).map((i) => i + newShapeId)
    const newLabelShapes = shapes[index].map((s, i) =>
        makeIndexedShape(shapeIds[i], [labelId], shapeTypes[index][i], s)
      )
    const order = taskStatus.maxOrder + 1 + index
    label = updateObject(label, {
      id: labelId,
      item: item.index,
      order,
      shapes: label.shapes.concat(shapeIds)
    })
    newLabels[index] = label
    newLabelIds.push(labelId)
    newShapes.push(...newLabelShapes)
    newShapeIds.push(...shapeIds)
  })
  const labels = updateObject(
    item.labels, _.zipObject(newLabelIds, newLabels))
  const allShapes = updateObject(
    item.shapes,
    _.zipObject(newShapeIds, newShapes)
  )
  item = updateObject(item, { labels, shapes: allShapes })
  taskStatus = updateObject(
    taskStatus,
    {
      maxLabelId: newLabelIds[newLabelIds.length - 1],
      maxShapeId: newShapeIds[newShapeIds.length - 1],
      maxOrder: taskStatus.maxOrder + newLabels.length
    })
  return [item, newLabels, taskStatus]
}

/**
 * Add labels to multiple items
 * @param item
 * @param taskStatus
 * @param newLabels
 * @param shapeTypes
 * @param shapes
 */
function addLabelstoItems (
  items: ItemType[], taskStatus: TaskStatus, labelsToAdd: LabelType[][],
  shapeTypes: string[][][], shapes: ShapeType[][][]
  ): [ItemType[], LabelType[], TaskStatus] {
  const allNewLabels: LabelType[] = []
  items = [...items]
  items.forEach((item, index) => {
    const [newItem, newLabels, newStatus] = addLabelsToItem(
      item, taskStatus, labelsToAdd[index], shapeTypes[index], shapes[index])
    items[index] = newItem
    taskStatus = newStatus
    allNewLabels.push(...newLabels)
  })
  return [items, allNewLabels, taskStatus]
}

/**
 * Add new label. The ids of label and shapes will be updated according to
 * the current state.
 * @param {State} state: current state
 * @param {types.AddLabelsAction} action
 * @return {State}
 */
export function addLabels (state: State, action: types.AddLabelsAction): State {
  let { task, user } = state
  const session = state.session
  let items = [...task.items]
  const selectedItems = pickArray(items, action.itemIndices)
  const [newItems, newLabels, status] = addLabelstoItems(
    selectedItems, task.status, action.labels, action.shapeTypes, action.shapes)
  items = assignToArray(items, newItems, action.itemIndices)
  // Find the first new label in the selected item if the labels are created
  // by this session.
  if (action.sessionId === session.id) {
    for (const label of newLabels) {
      if (label.item === user.select.item) {
        user = updateUserSelect(user, { label: label.id })
        break
      }
    }
  }
  task = updateObject(task, { status, items })
  return { task, user, session }
}

/**
 * update shapes in an item
 * @param item
 * @param shapeIds
 * @param shapes
 */
function changeShapesInItem (
  item: ItemType, shapeIds: number[],
  shapes: Array<Partial<ShapeType>>): ItemType {
  const newShapes = { ...item.shapes }
  shapeIds.forEach((shapeId, index) => {
    newShapes[shapeId] = updateObject(newShapes[shapeId],
      { shape: updateObject(newShapes[shapeId].shape, shapes[index]) })
  })
  return { ...item, shapes: newShapes }
}

/**
 * changes shapes in items
 * @param items
 * @param shapeIds
 * @param shapes
 */
function changeShapesInItems (
  items: ItemType[], shapeIds: number[][],
  shapes: Array<Array<Partial<ShapeType>>>): ItemType[] {
  items = [...items]
  items.forEach((item, index) => {
    items[index] = changeShapesInItem(item, shapeIds[index], shapes[index])
  })
  return items
}

/**
 * Change shapes action
 * @param state
 * @param action
 */
export function changeShapes (
    state: State, action: types.ChangeShapesAction): State {
  let { task, user } = state
  const shapeIds = action.shapeIds
  const newItems = changeShapesInItems(
    pickArray(task.items, action.itemIndices), shapeIds, action.shapes)
  const items = assignToArray(task.items, newItems, action.itemIndices)
  // select the label of the first shape on the current item
  if (action.sessionId === state.session.id) {
    const index = _.find(action.itemIndices, user.select.item)
    if (index) {
      const labelId = items[index].shapes[shapeIds[index][0]].label[0]
      user = updateUserSelect(user, { label: labelId })
    }
  }
  task = updateObject(task, { items })
  return { ...state, task, user }
}

/**
 * Update label properties except shapes
 * @param {State} state
 * @param {types.ChangeLabelAction} action
 * @return {State}
 */
export function changeLabel (
  state: State, action: types.ChangeLabelAction): State {
  let { task, user } = state
  const itemIndex = action.itemIndex
  const labelId = action.labelId
  const props = action.props
  let item = task.items[itemIndex]
  if (labelId in item.labels) {
    const label = updateObject(item.labels[labelId], props)
    item = updateObject(
        item, { labels: updateObject(item.labels, { [labelId]: label }) })
  }
  const items = updateListItem(task.items, itemIndex, item)
  task = updateObject(task, { items })
  if (action.sessionId === state.session.id) {
    user = updateUserSelect(user, { label: labelId })
  }
  return { ...state, user, task }
}

/**
 * Get the root of a label by tracing its ancestors
 * @param item
 * @param labelId
 */
function getRoot (item: ItemType, labelId: number): number {
  let parent = item.labels[labelId].parent
  while (parent >= 0) {
    labelId = parent
    parent = item.labels[labelId].parent
  }
  return labelId
}

/**
 * Link two labels on the same item
 * The new label properties are the same as label1 in action
 * @param {State} state
 * @param {types.LinkLabelsAction} action
 */
export function linkLabels (
    state: State, action: types.LinkLabelsAction): State {
  // Add a new label to the state
  let item = state.task.items[action.itemIndex]
  if (action.labelIds.length === 0) {
    return state
  }
  const children = _.map(action.labelIds, (labelId) => getRoot(item, labelId))
  let newLabel: LabelType = _.cloneDeep(item.labels[children[0]])
  newLabel.parent = -1
  newLabel.shapes = []
  newLabel.children = children
  state = addLabel(state, action.sessionId, action.itemIndex, newLabel)

  // assign the label properties
  item = state.task.items[action.itemIndex]
  const newLabelId = state.task.status.maxLabelId
  newLabel = item.labels[newLabelId]
  const labels: LabelType[] = _.map(children,
    (labelId) => _.cloneDeep(item.labels[labelId]))

  _.forEach(labels, (label) => {
    label.parent = newLabelId
    // sync the category and attributes of the labels
    label.category = _.cloneDeep(newLabel.category)
    label.attributes = _.cloneDeep(newLabel.attributes)
  })

  // update track information
  let tracks = state.task.tracks
  let trackId = -1
  for (const label of labels) {
    trackId = label.track
    if (trackId >= 0) break
  }
  if (trackId >= 0) {
    newLabel.track = trackId
    let track = tracks[trackId]
    const trackLabelIndex = _.findIndex(
      track.labels, (p) => (p[0] === item.index))
    track = updateObject(track, { labels: updateListItem(
      track.labels, trackLabelIndex, [item.index, newLabelId ])})
    tracks = updateObject(tracks, { [trackId]: track })
  }

  // update the item
  item = updateObject(item, {
    labels: updateObject(item.labels, _.zipObject(children, labels))})
  const items = updateListItem(state.task.items, item.id, item)
  const task = updateObject(state.task, { items, tracks })
  return { ...state, task }
}

/**
 * Update the user selection
 * @param {State} state
 * @param {types.ChangeSelectAction} action
 */
export function changeSelect (
    state: State, action: types.ChangeSelectAction): State {
  const newSelect = updateObject(state.user.select, action.select)
  if (newSelect.item < 0 || newSelect.item >= state.task.items.length) {
    newSelect.item = state.user.select.item
  }
  return updateObject(state, { user: updateUserSelect(state.user, newSelect) })
}

/**
 * Signify a new item is loaded
 * @param {State} state
 * @param {types.LoadItemAction} action
 * @return {State}
 */
export function loadItem (state: State, action: types.LoadItemAction): State {
  const itemIndex = action.itemIndex
  let session = state.session
  session = updateObject(session, {
    items:
      updateListItem(session.items, itemIndex,
        updateObject(session.items[itemIndex], { loaded: true }))
  })
  return updateObject(state, { session })
}

/**
 * Delete labels from one item
 * @param item
 * @param labelIds
 */
export function deleteLabelsFromItem (
  item: ItemType, labelIds: number[]): ItemType {
  let labels = item.labels
  const deletedLabels = pickObject(item.labels, labelIds)

  // find related labels and shapes
  const updatedLabels: {[key: number]: LabelType} = {}
  const updatedShapes: { [key: number]: IndexedShapeType } = {}
  const deletedShapes: { [key: number]: IndexedShapeType } = {}
  _.forEach(deletedLabels, (label) => {
    if (label.parent >= 0) {
      // TODO: consider multiple level parenting
      const parentLabel = _.cloneDeep(labels[label.parent])
      parentLabel.children = removeListItems(parentLabel.children, [label.id])
      updatedLabels[parentLabel.id] = parentLabel
    }
    label.shapes.forEach((shapeId) => {
      let shape = item.shapes[shapeId]
      shape = updateObject(
          shape, { label: removeListItems(shape.label, [label.id]) })
      updatedShapes[shape.id] = shape
    })
  })
  // remove widow labels
  _.forEach(updatedLabels, (label) => {
    if (label.children.length === 0) {
      deletedLabels[label.id] = label
    }
  })
  // remove orphan shapes
  _.forEach(updatedShapes, (shape) => {
    if (shape.label.length === 0) {
      deletedShapes[shape.id] = shape
    }
  })

  labels = removeObjectFields(updateObject(
    item.labels, updatedLabels), getObjectKeys(deletedLabels))
  const shapes = removeObjectFields(updateObject(
    item.shapes, updatedShapes), getObjectKeys(deletedShapes))
  return { ...item, labels, shapes }
}

/**
 * Delete labels from one item
 * @param item
 * @param labelIds
 */
export function deleteLabelsFromItems (
  items: ItemType[], labelIds: number[][]): ItemType[] {
  items = [...items]
  items.forEach((item, index) => {
    items[index] = deleteLabelsFromItem(item, labelIds[index])
  })
  return items
}

/**
 * Delete labels action
 * @param state
 * @param action
 */
export function deleteLabels (
  state: State, action: types.DeleteLabelsAction): State {
  const newItems = deleteLabelsFromItems(
    pickArray(state.task.items, action.itemIndices), action.labelIds)
  const items = assignToArray(
    [...state.task.items], newItems, action.itemIndices)
  const task = updateObject(state.task, { items })
  // Reset selected object
  let { user } = state
  for (const ids of action.labelIds) {
    if (user.select.label === -1) {
      break
    }
    for (const labelId of ids) {
      if (user.select.label === labelId) {
        user = updateUserSelect(user, { label: -1 })
        break
      }
    }
  }
  return updateObject(state, { user, task })
}

/**
 * assign Attribute to a label
 * @param {State} state
 * @param {number} _labelId
 * @param {object} _attributeOptions
 * @return {State}
 */
export function changeAttribute (state: State, _labelId: number,
                                 _attributeOptions: object): State {
  return state
}

/**
 * Notify all the subscribers to update. it is an no-op now.
 * @param {State} state
 * @return {State}
 */
export function updateAll (state: State): State {
  return state
}

/**
 * turn on/off assistant view
 * @param {State} state
 * @return {State}
 */
export function toggleAssistantView (state: State): State {
  let user = state.user
  user = updateObject(user, {
    layout:
      updateObject(user.layout, {
        assistantView:
          !user.layout.assistantView
      })
  })
  return updateObject(state, { user })
}
