package main

import (
	"log"
  "time"
)

/*
5- apply action to correct state (for all levels)
  Would also save to correct file here
*/

const addLabel = "ADD_LABEL"
const changeLabelShape = "CHANGE_LABEL_SHAPE"
var taskActions = map[string]struct{}{
  addLabel: {},
  changeLabelShape: {},
}

const goToItem = "GO_TO_ITEM"
var userActions = map[string]struct{}{
  goToItem: {},
}

const loadItem = "LOAD_ITEM"
var sessionActions = map[string]struct{}{
  loadItem: {},
}

type BaseAction interface {
  addTimestamp()
  getSessionId() string
}

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

type GenericAction struct {
  Type      string `json:"type" yaml:"type"`
  SessionId string `json:"sessionId" yaml:"sessionId"`
  Time      string `json:"time" yaml:"time"`
}

type AddLabelAction struct {
  GenericAction
  ItemIndex int         `json:"itemIndex" yaml:"itemIndex"`
  Label     LabelData   `json:"label" yaml:"label"`
  Shapes    []ShapeRect `json:"shapes" yaml:"shapes"`
}

type ChangeShapeAction struct {
  GenericAction
  ItemIndex int         `json:"itemIndex" yaml:"itemIndex"`
  ShapeId   int         `json:"shapeId" yaml:"shapeId"`
  Props     ShapeRect   `json:"props" yaml:"props"`
}

type GoToItemAction struct {
  GenericAction
  ItemIndex int `json:"itemIndex" yaml:"itemIndex"`
}

type LoadItemAction struct {
  GenericAction
  ItemIndex int       `json:"itemIndex" yaml:"itemIndex"`
  Config ViewerConfig `json:"config" yaml:"config"`
}

func (action GenericAction) addTimestamp() {
  action.Time = time.Now().String()
  log.Printf("Timestamped this message: %v\n", action)
}

func (action GenericAction) getSessionId() string {
  return action.SessionId
}

func (action AddLabelAction) updateState(state *TaskData) *TaskData {
	newState := *state

	var newShapeId = state.Status.MaxShapeId + 1
  var labelId = state.Status.MaxLabelId + 1
	var order = state.Status.MaxOrder + 1
	var shapeIds = make([]int, len(action.Shapes))
	for i := range(shapeIds) {
		shapeIds[i] = i + newShapeId
	}

	var newStatus = TaskStatus{
		MaxLabelId: labelId,
		MaxShapeId: shapeIds[len(shapeIds) - 1],
		MaxOrder: order,
	}
	newState.Status = newStatus

	var item = state.Items[action.ItemIndex]
	var newShapes = make(map[int]ShapeData)
	for k, v := range item.Shapes {
  	newShapes[k] = v
	}
	for i := range action.Shapes {
		var newId = i + newShapeId
		newShapes[newId] = ShapeData{
			Id: newId,
			Label: []int{labelId},
			Manual: true,
			Shape: action.Shapes[i],
		}
	}

	var shapesForLabel = append(action.Label.Shapes, shapeIds...)

	newLabel := action.Label
	newLabel.Id = labelId
	newLabel.Item = action.ItemIndex
	newLabel.Shapes = shapesForLabel
	newLabel.Order = order

	var newLabels = make(map[int]LabelData)
	for k, v := range item.Labels {
		newLabels[k] = v
	}
	newLabels[labelId] = newLabel

	newItem := item
	newItem.Labels = newLabels
	newItem.Shapes = newShapes

	var newItems = make([]ItemData, len(state.Items))
	copy(newItems, state.Items)
	newItems[action.ItemIndex] = newItem
	newState.Items = newItems

  return &newState
}

func (action ChangeShapeAction) updateState(state *TaskData) *TaskData {
	newState := *state

  var shapeId = action.ShapeId
  var item = state.Items[action.ItemIndex]
  var indexedShape = item.Shapes[shapeId]

	newIndexedShape := indexedShape
	newIndexedShape.Shape = action.Props

	var newShapes = make(map[int]ShapeData)
	for k, v := range item.Shapes {
  	newShapes[k] = v
	}
	newShapes[shapeId] = newIndexedShape

	newItem := item
	newItem.Shapes = newShapes

	var newItems = make([]ItemData, len(state.Items))
	copy(newItems, state.Items)
	newItems[action.ItemIndex] = newItem
	newState.Items = newItems

	return &newState
}

func (action GoToItemAction) applyToUserState(state *UserData) *UserData {
  return state
}

func (action LoadItemAction) applyToSessionState(
	state *SessionData) *SessionData {
  return state
}
