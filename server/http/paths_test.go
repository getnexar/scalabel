package main

import (
	"fmt"
  "strconv"
	"testing"
	"time"
)

func assertEqual(p1, p2 string, t *testing.T) {
  if p1 != p2 {
    t.Fatalf("Wrong path: %s != %s", p1, p2)
  }
}

// Tests that paths are correct
func TestPaths(t *testing.T) {
  sat, err := ReadSampleSatData()
  if err != nil {
    t.Fatal(err)
  }

  projectName := sat.Config.ProjectName
  userId := sat.User.Id
  taskId := sat.Task.TaskId
  submitTime = strconv.FormatInt(sat.Task.SubmitTime, 10)
  task := sat.Task

  // Test that the sat submission paths are correct
  satKey := path.Join(projectName, "submissions", taskId, userId, submitTime)
  assertEqual(sat.GetKey(), satKey, t)
  satPath := path.Join(projectName, "submissions", taskId, userId)
  assertEqual(sat.GetPath(), satPath, t)
  assertEqual(GetSatPath(projectName, taskId, userId), satPath, t)

  // Test that the sat assignment path is correct
  satAssignment := path.Join(projectName, "assignments", taskId, userId)
  assertEqual(satAssignment, getAssignmentPath(projectName, taskId, userId), t)

  // Test that the task submission paths are correct
  taskKey := path.Join(projectName, "submissions", taskId, "sync", submitTime)
  assertEqual(task.GetKey(), taskKey, t)
  taskPath := path.Join(projectName, "submissions", taskId, "sync")
  assertEqual(task.GetPath(), taskPath, t)
  assertEqual(GetTaskPath(projectName, taskId), taskPath, t)
}
