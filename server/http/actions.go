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
  applyToSessionState(SessionData) (SessionData, error)
}

type UserAction interface {
  BaseAction
  applyToUserState(UserData) (UserData, error)
}

type TaskAction interface {
  BaseAction
  updateState(TaskData) (TaskData, error)
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
  Props     interface{} `json:"props" yaml:"props"`
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

func (action AddLabelAction) updateState(state TaskData) (TaskData, error) {
  // var itemIndex = action.ItemIndex
  // var label = action.Label
  // var shapes = action.Shapes
  // var newShapeId = state.Status.MaxShapeId + 1
  // var labelId = state.Status.MaxLabelId + 1
	// var order = state.Status.MaxOrder + 1
	// var item = state.Items[itemIndex]
	//
	// var shapeIds = make([]int, len(shapes))
	// for i := range(shapeIds) {
	// 	shapeIds[i] = i + newShapeId
	// }
	//
	// var newStatus = &TaskStatus{
	// 	MaxLabelId: labelId,
	// 	MaxShapeId: shapeIds[len(shapeIds) - 1],
	// 	MaxOrder: order,
	// }
	//
	// var newShapes = make(map[int]ShapeData)
	// for k, v := range item.Shapes {
	// 	newShapes[k] = v
	// }
	// for i := range shapes {
	// 	var newId = i + newShapeId
	// 	var labelForShape []int
	// 	labelForShape[0] = labelId
	// 	var newShape = &ShapeData{
	// 		Id: newId,
	// 		Label: labelForShape,
	// 		Manual: true,
	// 		Shape: shapes[i],
	// 	}
	// 	newShapes[newId] = *newShape
	// }
	//
	// var shapesForLabel = append(label.Shapes, shapeIds...)
	//
	// var newLabel = &LabelData{
	// 	Id: labelId,
	// 	Item: itemIndex,
	// 	Type: label.Type,
	// 	Category: label.Category,
	// 	Attributes: label.Attributes,
	// 	Parent: label.Parent,
	// 	Children: label.Children,
	// 	Shapes: shapesForLabel,
	// 	SelectedShape: label.SelectedShape,
	// 	State: label.State,
	// 	Order: order,
	// }
	// var newLabels = make(map[int]LabelData)
	// for k, v := range item.Labels {
	// 	newLabels[k] = v
	// }
	// newLabels[labelId] = *newLabel
	//
	// var newItem = &ItemData{
	// 	Id: item.Id,
	// 	Index: item.Index,
	// 	Url: item.Url,
	// 	Labels: newLabels,
	// 	Shapes: newShapes,
	// }
	// var newItems = make([]ItemData, len(state.Items))
	// for i := range newItems {
	// 	if i == itemIndex {
	// 		newItems[i] = *newItem
	// 	} else {
	// 		newItems[i] = state.Items[i]
	// 	}
	// }
	// var newState = &TaskData{
	// 	Config: state.Config,
	// 	Status: *newStatus,
	// 	Items: newItems,
	// 	Tracks: state.Tracks,
	// }
	//
  // return *newState, nil
	return TaskData{}, nil
}

func (action ChangeShapeAction) updateState(state TaskData) (TaskData, error) {
  return state, nil
}

func (action GoToItemAction) applyToUserState(state UserData) (UserData, error) {
  return state, nil
}

func (action LoadItemAction) applyToSessionState(state SessionData) (SessionData, error) {
  return state, nil
}
