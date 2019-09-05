package main

import (
	"errors"
	"log"
  "time"
)

// Task actions
const addLabel = "ADD_LABEL"
const changeShape = "CHANGE_LABEL_SHAPE"
const changeLabel = "CHANGE_LABEL_PROPS"
const deleteLabel = "DELETE_LABEL"
const tagImage = "TAG_IMAGE"
const linkLabels = "LINK_LABELS"
var taskActions = map[string]struct{}{
  addLabel: {},
  changeShape: {},
	changeLabel: {},
	deleteLabel: {},
	tagImage: {},
	linkLabels: {},
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
  updateState(*TaskData) (*TaskData, error)
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

type LinkLabelAction struct {
		GenericAction
		ItemIndex int   `json:"itemIndex" yaml:"itemIndex"`
		LabelIds  []int `json:"labelIds" yaml:"labelIds"`
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

func getItem(state *TaskData, itemIndex int) (ItemData, error) {
	if itemIndex >= 0 && itemIndex < len(state.Items) {
		return state.Items[itemIndex], nil
	} else {
		return ItemData{}, errors.New("No item at specified index")
	}
}

func getShape(item ItemData, shapeId int) (ShapeData, error) {
	if shape, ok := item.Shapes[shapeId]; ok {
		return shape, nil
	} else {
		return ShapeData{}, errors.New("No shape with specified ID")
	}
}

func getLabel(item ItemData, labelId int) (LabelData, error) {
	if label, ok := item.Labels[labelId]; ok {
		return label, nil
	} else {
		return LabelData{}, errors.New("No label with specified ID")
	}
}

// Merges all non-default properties of mergeLable into startLabel
func mergeLabels(startLabel LabelData, mergeLabel LabelData) (LabelData) {
	if mergeLabel.Id >= 0 {
		startLabel.Id = mergeLabel.Id
	}
	if mergeLabel.Item >= 0 {
		startLabel.Item = mergeLabel.Item
	}
	if len(mergeLabel.Type) > 0 {
		startLabel.Type = mergeLabel.Type
	}
	if len(mergeLabel.Category) > 0 {
		startLabel.Category = mergeLabel.Category
	}
	if len(mergeLabel.Attributes) > 0 {
		startLabel.Attributes = mergeLabel.Attributes
	}
	if mergeLabel.Parent >= 0 {
		startLabel.Parent = mergeLabel.Parent
	}
	if len(mergeLabel.Children) > 0 {
		startLabel.Children = mergeLabel.Children
	}
	if len(mergeLabel.Shapes) > 0 {
		startLabel.Shapes = mergeLabel.Shapes
	}
	if mergeLabel.Track >= 0 {
		startLabel.Track = mergeLabel.Track
	}
	if mergeLabel.Order >= 0 {
		startLabel.Order = mergeLabel.Order
	}
	return startLabel
}

// Task actions
func (action AddLabelAction) updateState(state *TaskData) (*TaskData, error) {
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

	item, err := getItem(state, action.ItemIndex)
	if err != nil {
		return state, err
	}

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

  return &newState, nil
}

func (action ChangeShapeAction) updateState(state *TaskData) (*TaskData, error) {
	newState := *state

  var shapeId = action.ShapeId
	item, err := getItem(state, action.ItemIndex)
	if err != nil {
		return state, err
	}
  indexedShape, err := getShape(item, shapeId)
	if err != nil {
		return state, err
	}

	// Update the desired shape's properties
	newIndexedShape := indexedShape
	newIndexedShape.Shape = action.Props

	var newShapes = copyShapeMap(item.Shapes)
	newShapes[shapeId] = newIndexedShape

	newItem := item
	newItem.Shapes = newShapes

	var newItems = updateItems(state, newItem, action.ItemIndex)
	newState.Items = newItems

	return &newState, nil
}

func (action ChangeLabelAction) updateState(
	state *TaskData) (*TaskData, error) {
	newState := *state

  var labelId = action.LabelId
  var props = action.Props

	item, err := getItem(state, action.ItemIndex)
	if err != nil {
		return state, err
	}
	newLabel, err := getLabel(item, labelId)
	if err != nil {
		return state, err
	}
	newLabel = mergeLabels(newLabel, props)

	var newLabels = copyLabelMap(item.Labels)
	newLabels[labelId] = newLabel
	newItem := item
	newItem.Labels = newLabels

	var newItems = updateItems(state, newItem, action.ItemIndex)
	newState.Items = newItems

	return &newState, nil
}

func (action DeleteLabelAction) updateState(
	state *TaskData) (*TaskData, error) {
	newState := *state

	var labelId = action.LabelId
	item, err := getItem(state, action.ItemIndex)
	if err != nil {
		return state, err
	}
	label, err := getLabel(item, labelId)
	if err != nil {
		return state, err
	}
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

	return &newState, nil
}

func (action TagImageAction) updateState(state *TaskData) (*TaskData, error) {
	return state, nil
}

func (action LinkLabelAction) updateState(state *TaskData) (*TaskData, error) {
	return state, nil
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
