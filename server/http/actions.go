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
  applyToSessionState(SessionData) bool
}

type UserAction interface {
  BaseAction
  applyToUserState(UserData) bool
}

type TaskAction interface {
  BaseAction
  applyToTaskState(TaskData) bool
}

type GenericAction struct {
  Type      string `json:"type" yaml:"type"`
  SessionId string `json:"sessionId" yaml:"sessionId"`
  Time      string `json:"time" yaml:"time"`
}

type AddLabelAction struct {
  GenericAction
  ItemIndex int           `json:"itemIndex" yaml:"itemIndex"`
  Label     LabelData     `json:"label" yaml:"label"`
  Shapes    []interface{} `json:"shapes" yaml:"shapes"`
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

func (action AddLabelAction) applyToTaskState(state TaskData) bool {
    return true
}

func (action ChangeShapeAction) applyToTaskState(state TaskData) bool {
    return true
}

func (action GoToItemAction) applyToUserState(state UserData) bool {
    return true
}

func (action LoadItemAction) applyToSessionState(state SessionData) bool {
    return true
}
