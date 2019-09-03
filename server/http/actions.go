package main

import (
	"log"
  "time"
)

// Task actions
const addLabel = "ADD_LABEL"
const changeLabelShape = "CHANGE_LABEL_SHAPE"
const changeShape = "CHANGE_LABEL_PROPS"
const deleteLabel = "DELETE_LABEL"
const tagImage = "TAG_IMAGE"
var taskActions = map[string]struct{}{
  addLabel: {},
  changeLabelShape: {},
	changeShape: {},
	deleteLabel: {},
	tagImage: {},
}

// User actions
const changeSelect = "CHANGE_SELECT"
const imageZoom = "IMAGE_ZOOM"
const toggleAssistantView = "TOGGLE_ASSISTANT_VIEW"
const moveCameraAndTarget = "MOVE_CAMERA_AND_TARGET"
var userActions = map[string]struct{}{
  changeSelect: {},
	imageZoom: {},
	toggleAssistantView: {},
	moveCameraAndTarget: {},
}

// Session actions
const loadItem = "LOAD_ITEM"
const initSession = "INIT_SESSION"
const updateAll = "UPDATE_ALL"
var sessionActions = map[string]struct{}{
  loadItem: {},
	initSession: {},
	updateAll: {},
}

// Basic methods for all actions
type BaseAction interface {
  addTimestamp()
  getSessionId() string
}

// Each action type must also be able to update the state
// Corresponding to its data type
type SessionAction interface {
  BaseAction
  applyToSessionState(*SessionData) (*SessionData)
}

type UserAction interface {
  BaseAction
  applyToUserState(*UserData) (*UserData)
}

type TaskAction interface {
  BaseAction
  updateState(*TaskData) (*TaskData)
}

// Basic fields for all actions
type GenericAction struct {
  Type      string `json:"type" yaml:"type"`
  SessionId string `json:"sessionId" yaml:"sessionId"`
  Time      string `json:"time" yaml:"time"`
}

// Specify full parameters for all actions
// These should match the action definitions in the frontend
//Task actions
type AddLabelAction struct {
  GenericAction
  ItemIndex int         `json:"itemIndex" yaml:"itemIndex"`
  Label     LabelData   `json:"label" yaml:"label"`
  Shapes    []ShapeRect `json:"shapes" yaml:"shapes"`
}

type ChangeShapeAction struct {
  GenericAction
  ItemIndex int       `json:"itemIndex" yaml:"itemIndex"`
  ShapeId   int       `json:"shapeId" yaml:"shapeId"`
  Props     ShapeRect `json:"props" yaml:"props"`
}

type ChangeLabelAction struct {
	GenericAction
	ItemIndex int       `json:"itemIndex" yaml:"itemIndex"`
	LabelId   int       `json:"labelId" yaml:"labelId"`
	Props     LabelData `json:"props" yaml:"props"`
}

type DeleteLabelAction struct {
	GenericAction
	ItemIndex int `json:"itemIndex" yaml:"itemIndex"`
	LabelId   int `json:"labelId" yaml:"labelId"`
}

type TagImageAction struct {
	GenericAction
	ItemIndex      int   `json:"itemIndex" yaml:"itemIndex"`
	AttributeIndex int   `json:"attributeIndex" yaml:"attributeIndex"`
	SelectedIndex  []int `json:"selectedIndex" yaml:"selectedIndex"`
}

// User actions
type ChangeSelectAction struct {
  GenericAction
  ItemIndex int `json:"itemIndex" yaml:"itemIndex"`
}

type ImageZoomAction struct {
	GenericAction
}

type ToggleAssistantViewAction struct {
	GenericAction
}

type MoveCameraAndTargetAction struct {
	GenericAction
}

// Session actions
type LoadItemAction struct {
  GenericAction
  ItemIndex int               `json:"itemIndex" yaml:"itemIndex"`
  Config    ImageViewerConfig `json:"config" yaml:"config"`
}

type InitSessionAction struct {
	GenericAction
}

type UpdateAllAction struct {
	GenericAction
}

// Define common functions for all actions
func (action GenericAction) addTimestamp() {
  action.Time = time.Now().String()
  log.Printf("Timestamped this message: %v\n", action)
}

func (action GenericAction) getSessionId() string {
  return action.SessionId
}

// Specify implementations of all actions by defining their update methods
// These should be immutable and should match the frontend behavior

// Helper functions
// Create a copy of items then update one of them
func updateItems(state *TaskData, item ItemData, index int) []ItemData {
	var items = make([]ItemData, len(state.Items))
	copy(items, state.Items)
	items[index] = item
	return items
}

func copyShapeMap(shapes map[int]ShapeData) map[int]ShapeData {
	var newShapes = make(map[int]ShapeData)
	for k, v := range shapes {
		newShapes[k] = v
	}
	return newShapes
}

func copyLabelMap(labels map[int]LabelData) map[int]LabelData {
	var newLabels = make(map[int]LabelData)
	for k, v := range labels {
		newLabels[k] = v
	}
	return newLabels
}

// Task actions
func (action AddLabelAction) updateState(state *TaskData) *TaskData {
	newState := *state

	var newShapeId = state.Status.MaxShapeId + 1
  var labelId = state.Status.MaxLabelId + 1
	var order = state.Status.MaxOrder + 1
	var shapeIds = make([]int, len(action.Shapes))
	for i := range(shapeIds) {
		shapeIds[i] = i + newShapeId
	}

	// First update the status, i.e. the counters
	var newStatus = TaskStatus{
		MaxLabelId: labelId,
		MaxShapeId: shapeIds[len(shapeIds) - 1],
		MaxOrder: order,
	}
	newState.Status = newStatus

	var item = state.Items[action.ItemIndex]
	var newShapes = copyShapeMap(item.Shapes)
	// Add the new shapes from the action
	for i := range action.Shapes {
		var newId = i + newShapeId
		newShapes[newId] = ShapeData{
			Id: newId,
			Label: []int{labelId},
			Manual: true,
			Shape: action.Shapes[i],
		}
	}

	var newLabels = copyLabelMap(item.Labels)
	// Add the new label from the action
	var shapesForLabel = append(action.Label.Shapes, shapeIds...)
	newLabel := action.Label
	newLabel.Id = labelId
	newLabel.Item = action.ItemIndex
	newLabel.Shapes = shapesForLabel
	newLabel.Order = order
	newLabels[labelId] = newLabel

	newItem := item
	newItem.Labels = newLabels
	newItem.Shapes = newShapes

	var newItems = updateItems(state, newItem, action.ItemIndex)
	newState.Items = newItems

  return &newState
}

func (action ChangeShapeAction) updateState(state *TaskData) *TaskData {
	newState := *state

  var shapeId = action.ShapeId
  var item = state.Items[action.ItemIndex]
  var indexedShape = item.Shapes[shapeId]

	// Update the desired shape's properties
	newIndexedShape := indexedShape
	newIndexedShape.Shape = action.Props

	var newShapes = copyShapeMap(item.Shapes)
	newShapes[shapeId] = newIndexedShape

	newItem := item
	newItem.Shapes = newShapes

	var newItems = updateItems(state, newItem, action.ItemIndex)
	newState.Items = newItems

	return &newState
}

func (action ChangeLabelAction) updateState(
	state *TaskData) *TaskData {
	newState := *state

  var labelId = action.LabelId
  var props = action.Props

  var item = state.Items[action.ItemIndex]
  if _, ok := item.Labels[labelId]; !ok {
		return &newState
	}
  newLabel := item.Labels[labelId]
	// TODO: which props will be changed
	newLabel.Category = props.Category
	newLabel.Attributes = props.Attributes

	var newLabels = copyLabelMap(item.Labels)
	newLabels[labelId] = newLabel
	newItem := item
	newItem.Labels = newLabels

	var newItems = updateItems(state, newItem, action.ItemIndex)
	newState.Items = newItems

	return &newState
}

func (action DeleteLabelAction) updateState(
	state *TaskData) *TaskData {
	newState := *state

	var labelId = action.LabelId
	var item = state.Items[action.ItemIndex]
	var label = item.Labels[labelId]

	var newLabels = copyLabelMap(item.Labels)
	delete(newLabels, labelId)
	var newShapes = copyShapeMap(item.Shapes)
	for _, shapeIndex := range label.Shapes {
		delete(newShapes, shapeIndex)
	}

	newItem := item
	newItem.Shapes = newShapes
	newItem.Labels = newLabels

	var newItems = updateItems(state, newItem, action.ItemIndex)
	newState.Items = newItems

	return state
}

func (action TagImageAction) updateState(
	state *TaskData) *TaskData {
	return state
}

// User actions (dummy for now)
func (action ChangeSelectAction) applyToUserState(
	state *UserData) *UserData {
  return state
}

func (action ImageZoomAction) applyToUserState(
	state *UserData) *UserData {
  return state
}

func (action ToggleAssistantViewAction) applyToUserState(
	state *UserData) *UserData {
  return state
}

func (action MoveCameraAndTargetAction) applyToUserState(
	state *UserData) *UserData {
  return state
}

// Session actions (dummy for now)
func (action LoadItemAction) applyToSessionState(
	state *SessionData) *SessionData {
  return state
}

func (action InitSessionAction) applyToSessionState(
	state *SessionData) *SessionData {
  return state
}

func (action UpdateAllAction) applyToSessionState(
	state *SessionData) *SessionData {
  return state
}
