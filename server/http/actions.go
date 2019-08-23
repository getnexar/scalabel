package main

/*
4- filter to broadcast/sync code based on TaskLevel
5- apply action to correct state (for all levels)
  Would also save to correct file here
*/

const addLabel = "ADD_LABEL"
const changeLabelShape = "CHANGE_LABEL_SHAPE"
const taskActions = make(map[string]struct{})
taskActions[addLabel] = struct{}
taskActions[changeLabelShape] = struct{}

const goToItem = "GO_TO_ITEM"
const userActions = make(map[string]struct{})
userActions[goToItem] = struct{}

const loadItem = "LOAD_ITEM"
const sessionActions = make(map[string]struct{})
userActions[loadItem] = struct{}

type SessionAction interface {
  applyToSessionState(SessionData) boolean
}

type UserAction interface {
  applyToUserState(UserData) boolean
}

type TaskAction interface {
  applyToTaskState(TaskData) boolean
}

type GenericAction struct {
  Type      string `json:"type" yaml:"type"`
  SessionId string `json:"sessionId" yaml:"sessionId"`
  Time      string `json:"time" yaml:"time"`
}

type AddLabelAction struct {
  GenericAction
  ItemIndex int           `json:"itemIndex" yaml:"itemIndex"`
  Label     LabelType     `json:"label" yaml:"label"`
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

func (action AddLabelAction) applyToTaskState(state TaskData) boolean {
    return true
}

func (action ChangeShapeAction) applyToTaskState(state TaskData) boolean {
    return true
}

func (action GoToItemAction) applyToUserState(state UserData) boolean {
    return true
}

func (action LoadItemAction) applyToUserState(state SessionData) boolean {
    return true
}
