package main

import (
  "errors"
  "encoding/json"
	"fmt"
	"io/ioutil"
  "math/rand"
	"path"
	"testing"
)

//Helper functions for testing
// Check if rectangles have the same coordinates
func checkRectsEqual(rect1 ShapeRect, rect2 ShapeRect) error {
    if rect1.X1 == rect2.X1 && rect1.X2 == rect2.X2 &&
      rect1.Y1 == rect2.Y1 && rect1.Y2 == rect2.Y2 {
        return nil
    }
    return fmt.Errorf("Shape is incorrect")
}

// Check if an item's shape and label data has changed
func checkShapesAdded(item ItemData, numShapes int) error {
  if len(item.Labels) == numShapes && len(item.Shapes) == numShapes {
    return nil
  }
  return fmt.Errorf("Number of shapes is incorrect")
}

// Check if a shape was added correctly (to a new label)
func checkShapeCorrect(item ItemData, numShapes int, labelId int,
  shapeId int, addedShape ShapeRect) error {
  shape := item.Shapes[shapeId].Shape
  shapesForLabel := item.Labels[labelId].Shapes
  err := checkShapesAdded(item, numShapes)
  if err != nil {
    return err
  }
  if len(shapesForLabel) != 1 || shapesForLabel[0] != shapeId  {
    return fmt.Errorf("Label is incorrect")
  }
  return checkRectsEqual(addedShape, shape)
}

// Make a random rectangle
func makeRect() ShapeRect {
  x1 := rand.Float32() * 10
  y1 := rand.Float32() * 10
  x2 := x1 + rand.Float32() * 10
  y2 := x2 + rand.Float32() * 10
  return ShapeRect{
    X1: x1,
    X2: x2,
    Y1: y1,
    Y2: y2,
  }
}

// Load dummy task data
func readTaskData() (*TaskData, error) {
  statePath := path.Join("testdata", "task_state.json")
	inputBytes, err := ioutil.ReadFile(statePath)
	if err != nil {
		return &TaskData{}, err
	}
  taskState := TaskData{}
  err = json.Unmarshal(inputBytes, &taskState)
  if err != nil {
		return &TaskData{}, err
	}
  return &taskState, nil
}

// Gets a random index corresponding to a nonzero value
func indexOfNonzero(values []int) int {
  numNonzero := 0
  for _, v := range(values) {
    if v != 0 {
      numNonzero++
    }
  }
  if numNonzero == 0 {
    return -1
  }
  ind := rand.Intn(numNonzero)
  currentNum := 0
  for i, v := range(values) {
    if v != 0 {
      if currentNum == ind {
        return i
      }
      currentNum++
    }
  }
  return -1
}

// Object used to store metadata about actions so they can be checked later
type CheckData struct {
   Shape     ShapeRect
   LabelId   int
   NumShapes int
   ItemIndex int
   ShapeId   int
}

// Create a new AddLabel action, and use it to update the state
func runAddLabel(state *TaskData, itemIndex int, labelId int) (
  *TaskData, ShapeRect, error) {
  label := LabelData{
    Id: labelId,
    Item: itemIndex,
    Shapes: []int{},
  }
  shapes := make([]ShapeRect, 1)
  shape := makeRect()
  shapes[0] = shape
  action := AddLabelAction{
    ItemIndex: itemIndex,
    Label: label,
    Shapes: shapes,
  }
  newState, err := action.updateState(state)
  return newState, shape, err
}

// Check that an AddLabel action was executed correctly
func checkAddLabel(state *TaskData, checkData CheckData) error {
  numShapes := checkData.NumShapes
  labelId := checkData.LabelId
  shape := checkData.Shape
  itemIndex := checkData.ItemIndex
  item := state.Items[itemIndex]
  err := checkShapeCorrect(item, numShapes, labelId, labelId, shape)
  if err != nil {
    return fmt.Errorf("Label not added correctly: %v", err)
  }
  return nil
}

// Create a new ChangeShape action, and use it to update the state
func runChangeShape(state *TaskData, itemIndex int, shapeId int) (
  *TaskData, ShapeRect, error){
  shape := makeRect()
  changeAction := ChangeShapeAction{
    ItemIndex: itemIndex,
    ShapeId: shapeId,
    Props: shape,
  }
  newState, err := changeAction.updateState(state)
  return newState, shape, err
}

// Check that a ChangeShape action was executed correctly
func checkChangeShape(state *TaskData, checkData CheckData) error {
  shape := checkData.Shape
  itemIndex := checkData.ItemIndex
  shapeId := checkData.ShapeId
  realShape := state.Items[itemIndex].Shapes[shapeId].Shape
  err := checkRectsEqual(shape, realShape)
  if err != nil {
    return fmt.Errorf("Shape was not modified correctly: %v", err)
  }
  return nil
}

// Routes action to appropriate checking function
func checkAction(actionType string, state *TaskData, checkData CheckData) error {
  switch actionType {
  case addLabel:
    return checkAddLabel(state, checkData)
  case changeShape:
    return checkChangeShape(state, checkData)
  default:
    return errors.New("tried to check non-existent action")
  }
}

// Runs the desired actions with random parameters and checks the effects
// To only operate on one item, can set maxItem = 0
func runActions(initialState *TaskData, actionQueue []string, maxItem int) error {
  // Store states to check for immutability later
  states := make([]*TaskData, len(actionQueue) + 1)
  states[0] = initialState
  // Store info about actions to check for immutability later
  checkData := make([]CheckData, len(actionQueue) + 1)
  currentLabelId := 0
  numShapes := make([]int, maxItem + 1)
  // First check the initial state is empty
  for i := 0; i <= maxItem; i++ {
    err := checkShapesAdded(initialState.Items[i], numShapes[i])
    if err != nil {
      return fmt.Errorf("initial state not empty: %v", err)
    }
  }
  // Run actions and check updated state
  for i, actionType := range(actionQueue) {
    var newState *TaskData
    var newCheckData CheckData
    itemIndex := rand.Intn(maxItem + 1)
    itemIndexWithShape := indexOfNonzero(numShapes)
    switch actionType {
    case addLabel:
      returnState, newShape, err := runAddLabel(
        states[i], itemIndex, currentLabelId)
      if err != nil {
        return fmt.Errorf("addLabel failed: %v", err)
      }
      newState = returnState
      numShapes[itemIndex]++
      newCheckData = CheckData{
        Shape: newShape,
        LabelId: currentLabelId,
        NumShapes: numShapes[itemIndex],
        ItemIndex: itemIndex,
      }
      currentLabelId++
    case changeShape:
      if itemIndexWithShape == -1 {
        return errors.New("There are no shapes to change")
      }
      shapeId := rand.Intn(numShapes[itemIndexWithShape])
      returnState, newShape, err := runChangeShape(
        states[i], itemIndexWithShape, shapeId)
      if err != nil {
        return fmt.Errorf("changeShape failed: %v", err)
      }
      newState = returnState
      newCheckData = CheckData{
        Shape: newShape,
        ShapeId: shapeId,
        ItemIndex: itemIndexWithShape,
      }
    default:
      return errors.New("tried to run non-existent action")
    }
    err := checkAction(actionType, newState, newCheckData)
    if err != nil {
      return err
    }
    states[i+1] = newState
    checkData[i+1] = newCheckData
  }

  // Check the initial state is unchanged
  for i := 0; i <= maxItem; i++ {
    err := checkShapesAdded(initialState.Items[i], 0)
    if err != nil {
      return fmt.Errorf("initial state changed: %v", err)
    }
  }
  // Check that states are all immutable
  for i, actionType := range(actionQueue) {
    err := checkAction(actionType, states[i+1], checkData[i+1])
    if err != nil {
      return fmt.Errorf("Not immutable: %v", err)
    }
  }
  return nil
}

// Test action updates for task data
// Tests that the addLabel action works
func TestAddLabel(t *testing.T) {
  // Prepare initial state
	initialState, err := readTaskData()
  if err != nil {
    t.Fatal(err)
  }
  // add some labels to one items
  actionQueue := []string{addLabel, addLabel, addLabel}
  err = runActions(initialState, actionQueue, 0)
  if err != nil {
    t.Fatal(err)
  }

  // add some labels to different items
  actionQueue = []string{addLabel, addLabel, addLabel}
  err = runActions(initialState, actionQueue, 1)
  if err != nil {
    t.Fatal(err)
  }
}

// Tests that the changeShape action works
func TestChangeShape(t *testing.T) {
  // Prepare initial state
	initialState, err := readTaskData()
  if err != nil {
    t.Fatal(err)
  }

  // add a label then change it a few times
  actionQueue := []string{addLabel, changeShape, changeShape}
  err = runActions(initialState, actionQueue, 0)
  if err != nil {
    t.Fatal(err)
  }
}
