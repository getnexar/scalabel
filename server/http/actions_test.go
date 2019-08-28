package main

import (
  "encoding/json"
	"fmt"
	"io/ioutil"
  "math/rand"
	"path"
	"testing"
)

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

// Update state by adding a new label and shape to the item
func addShapeToState(startState *TaskData, itemIndex int, labelId int) (
  *TaskData, ShapeRect, error) {
  addLabel := LabelData{
    Id: labelId,
    Item: itemIndex,
    Shapes: []int{},
  }
  addShapes := make([]ShapeRect, 1)
  addShape := makeRect()
  addShapes[0] = addShape
  addAction := AddLabelAction{
    ItemIndex: itemIndex,
    Label: addLabel,
    Shapes: addShapes,
  }
  addState, err := addAction.updateState(startState)
  return addState, addShape, err
}

// Tests that the add label and change shape actions work
func TestAddChangeShapeActions(t *testing.T) {
  // Prepare initial state
	initialState, err := readTaskData()
  if err != nil {
    t.Fatal(err)
  }
  itemIndex := 1
  numShapes := 0
  initialItem := initialState.Items[itemIndex]
  err = checkShapesAdded(initialItem, numShapes)
  if err != nil {
    t.Fatal(fmt.Errorf("Initial state not empty: %v", err))
  }

  // Add the first shape
  labelId1 := 0
  addState, shape1, err := addShapeToState(initialState,
    itemIndex, labelId1)
  if err != nil {
    t.Fatal("Adding label to state failed", err)
  }
  numShapes++
  addItem := addState.Items[itemIndex]
  err = checkShapeCorrect(addItem, numShapes, labelId1, labelId1, shape1)
  if err != nil {
    t.Fatal(fmt.Errorf("First label not added correctly: %v", err))
  }

  // Change the shape
  shape2 := makeRect()
  changeAction := ChangeShapeAction{
    ItemIndex: itemIndex,
    ShapeId: 0,
    Props: shape2,
  }
  changeState, err := changeAction.updateState(addState)
  if err != nil {
    t.Fatal("Changing shape in state failed", err)
  }
  changeShape := changeState.Items[itemIndex].Shapes[0].Shape
  err = checkRectsEqual(changeShape, shape2)
  if err != nil {
    t.Fatal(fmt.Errorf("Shape was not modified correctly"))
  }

  // Add another shape
  labelId2 := labelId1 + 1
  addState2, shape3, err := addShapeToState(changeState,
    itemIndex, labelId2)
  if err != nil {
    t.Fatal("Adding another label to state failed", err)
  }
  numShapes++
  addItem2 := addState2.Items[itemIndex]
  err = checkShapeCorrect(addItem2, numShapes, labelId2, labelId2, shape3)
  if err != nil {
    t.Fatal(fmt.Errorf("Second label not added correctly: %v ", err))
  }

  // Check immutability of state
  numShapes = 0
  initialItem = initialState.Items[itemIndex]
  err = checkShapesAdded(initialItem, numShapes)
  if err != nil {
    t.Fatal(fmt.Errorf("Not immutable; initialState changed: %v", err))
  }
  numShapes++
  addItem = addState.Items[itemIndex]
  err = checkShapeCorrect(addItem, numShapes, labelId1, labelId1, shape1)
  if err != nil {
    t.Fatal(fmt.Errorf("Not immutable; addState changed: %v", err))
  }
  changeShape = changeState.Items[itemIndex].Shapes[0].Shape
  err = checkRectsEqual(changeShape, shape2)
  if err != nil {
    t.Fatal(fmt.Errorf("Not immutable; changeState changed: %v", err))
  }
  numShapes++
  addItem2 = addState2.Items[itemIndex]
  err = checkShapeCorrect(addItem2, numShapes, labelId2, labelId2, shape3)
  if err != nil {
    t.Fatal(fmt.Errorf("Not immutable; addState2 changed: %v", err))
  }
}
