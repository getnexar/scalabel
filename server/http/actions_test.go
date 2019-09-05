package main

import (
  "errors"
  "encoding/json"
	"fmt"
	"io/ioutil"
  "math/rand"
	"path"
  "reflect"
	"testing"
)

//Helper functions for testing
// Check if rectangles have the same coordinates
func checkRectsEqual(rect1 ShapeRect, rect2 ShapeRect) error {
    if rect1.X1 == rect2.X1 && rect1.X2 == rect2.X2 &&
      rect1.Y1 == rect2.Y1 && rect1.Y2 == rect2.Y2 {
        return nil
    }
    return errors.New("Shape is incorrect")
}

// Check if an item's shape and label data has changed
func checkShapesAdded(item ItemData, numShapes int) error {
  if len(item.Labels) == numShapes && len(item.Shapes) == numShapes {
    return nil
  }
  return errors.New("Number of shapes is incorrect")
}

// Check if a shape was added correctly (to a new label)
func checkShapeCorrect(item ItemData, numShapes int, labelId int,
  addedShape ShapeRect) error {
  shapeId := labelId
  shape := item.Shapes[shapeId].Shape
  shapesForLabel := item.Labels[labelId].Shapes
  err := checkShapesAdded(item, numShapes)
  if err != nil {
    return err
  }
  if len(shapesForLabel) != 1 || shapesForLabel[0] != shapeId  {
    return errors.New("Label is incorrect")
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
func randomIndexOfNonzero(values []int) int {
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

func randomKey(dict map[int]LabelData) int {
  labelInd := rand.Intn(len(dict))
  j := 0
  for k := range(dict) {
    if j == labelInd {
      return k
    }
    j++
  }
  return -1
}

// Object used to store metadata about actions so they can be checked later
type CheckData struct {
   Shape      ShapeRect
   LabelId    int
   NumShapes  int
   ItemIndex  int
   ShapeId    int
   LabelProps LabelData
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
  err := checkShapeCorrect(item, numShapes, labelId, shape)
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

//Create a new ChangeLabel action, and use it to udpate the stae
func runChangeLabel(state *TaskData, itemIndex int, labelId int) (
  *TaskData, LabelData, error) {
    props := LabelData{
      Category: []int{1},
      Attributes: map[string][]int{"a": []int{1}},
      Parent: 0,
      Children: []int{1, 2},
    }
    changeLabelAction := ChangeLabelAction{
      ItemIndex: itemIndex,
      LabelId: labelId,
      Props: props,
    }
    newState, err := changeLabelAction.updateState(state)
    return newState, props, err
}

//Check that a ChangeLabel action was executed correctly
func checkChangeLabel(state *TaskData, checkData CheckData) error {
  itemIndex := checkData.ItemIndex
  labelId := checkData.LabelId
  props := checkData.LabelProps
  label := state.Items[itemIndex].Labels[labelId]
  if !reflect.DeepEqual(props.Category, label.Category) ||
    !reflect.DeepEqual(props.Attributes, label.Attributes) ||
    props.Parent != label.Parent ||
    !reflect.DeepEqual(props.Children, label.Children) {
    return errors.New("Label props were not modified correctly")
  }
  return nil
}

//Create a new DeleteLabel action, and use it to update the state
func runDeleteLabel(state *TaskData, itemIndex int, labelId int) (
  *TaskData, error) {
  deleteAction := DeleteLabelAction{
    ItemIndex: itemIndex,
    LabelId: labelId,
  }
  newState, err := deleteAction.updateState(state)
  return newState, err
}

//Check that a DeleteLabel action was executed correctly
func checkDeleteLabel(state *TaskData, checkData CheckData) error {
  itemIndex := checkData.ItemIndex
  labelId := checkData.LabelId
  if _, ok := state.Items[itemIndex].Labels[labelId]; ok {
    return errors.New("Label was not deleted")
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
  case changeLabel:
    return checkChangeLabel(state, checkData)
  case deleteLabel:
    return checkDeleteLabel(state, checkData)
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
    itemIndexWithShape := randomIndexOfNonzero(numShapes)
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
    case changeLabel:
      if itemIndexWithShape == -1 {
        return errors.New("There are no labels to modify")
      }
      labelMap := states[i].Items[itemIndexWithShape].Labels
      labelId := randomKey(labelMap)
      returnState, props, err := runChangeLabel(
        states[i], itemIndexWithShape, labelId)
      if err != nil {
        return fmt.Errorf("changeLabel failed: %v", err)
      }
      newState = returnState
      newCheckData = CheckData{
        LabelProps: props,
        LabelId: labelId,
        ItemIndex: itemIndexWithShape,
      }
    case deleteLabel:
      if itemIndexWithShape == -1 {
        return errors.New("There are no labels to delete")
      }
      labelMap := states[i].Items[itemIndexWithShape].Labels
      labelId := randomKey(labelMap)
      returnState, err := runDeleteLabel(
        states[i], itemIndexWithShape, labelId)
      if err != nil {
        return fmt.Errorf("deleteLabel failed: %v", err)
      }
      newState = returnState
      newCheckData = CheckData{
        LabelId: labelId,
        ItemIndex: itemIndexWithShape,
      }
      //This assumes label only had one shape attached
      numShapes[itemIndexWithShape]--
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

// Runs the test corresponding to the action queue
func runTest(t *testing.T, actionQueue []string, maxTask int) {
  // Prepare initial state
  initialState, err := readTaskData()
  if err != nil {
    t.Fatal(err)
  }
  err = runActions(initialState, actionQueue, maxTask)
  if err != nil {
    t.Fatal(err)
  }
}

// Runs a test that is expected to fail
func runFailTest(t *testing.T, actionQueue []string, maxTask int) {
  // Prepare initial state
  initialState, err := readTaskData()
  if err != nil {
    t.Fatal(err)
  }
  err = runActions(initialState, actionQueue, maxTask)
  if err == nil {
    t.Fatal("Test was expected to fail but did not")
  }
}

// Test action updates for task data
// Tests that the addLabel action works
func TestAddLabel(t *testing.T) {
  actionQueue := []string{addLabel, addLabel, addLabel}
  // add some labels to one items
  runTest(t, actionQueue, 0)
  // add some labels to different items
  runTest(t, actionQueue, 1)
}

// Tests that the changeShape action works
func TestChangeShape(t *testing.T) {
  // add a label then change it a few times
  actionQueue := []string{addLabel, changeShape, changeShape}
  runTest(t, actionQueue, 0)

  // error if you try to change nonexistent shapes
  actionQueue = []string{changeShape}
  runFailTest(t, actionQueue, 0)
}

// Tests that the changeLabel action works
func TestChangeLabel(t *testing.T) {
  // add some labels then modify them
  actionQueue := []string{addLabel, addLabel, changeLabel, changeLabel}
  runTest(t, actionQueue, 0)

  // error if you try to modify nonexistent labels
  actionQueue = []string{changeLabel}
  runFailTest(t, actionQueue, 0)
}

// Tests that the deleteLabel action works
func TestDeleteLabel(t *testing.T) {
  // add some labels then delete them
  actionQueue := []string{addLabel, deleteLabel, addLabel, deleteLabel}
  runTest(t, actionQueue, 0)

  // error if you try to delete nonexistent labels
  actionQueue = []string{addLabel, deleteLabel, deleteLabel}
  runFailTest(t, actionQueue, 0)
}

// Tests some random sequeneces of actions
// func TestRandomizedActions(t *testing.T) {
//
// }
