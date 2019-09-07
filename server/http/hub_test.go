package main

import (
	"fmt"
	"testing"
	"time"
)

// Helper functions
// Makes a dummy session
func MakeSession(taskNum int) *Session {
  return &Session{
		SessionId:   getUuidV4(),
		TaskId:		   fmt.Sprintf("fakeTaskId%v", taskNum),
		ProjectName: "testProject",
		Send:        make(chan *TaskAction, 5),
	}
}

// Check that hub contains correct number of tasks and session
func checkHubSessions(t *testing.T, hub *Hub, numSessions int, numTasks int) {
	// wait for hub to process any requests
	time.Sleep(time.Millisecond * 10)
	if len(hub.sessions) != numSessions {
		err := fmt.Errorf("Wrong number of sessions: %v desired, %v actual",
			numSessions, len(hub.sessions))
    t.Fatal(err)
  }
  if len(hub.sessionsByTask) != numTasks {
    t.Fatal("Wrong number of tasks")
  }
}

// Check that session has/does not have a pending action
func checkBroadcasted(t *testing.T, session *Session, messageExpected bool) {
	select {
	case _, ok := <-session.Send:
		if !ok {
			t.Fatal("Channel was closed")
		}
		if !messageExpected {
			t.Fatal("Broadcasted action but should not have")
		}
	case <-time.After(100 * time.Millisecond):
		if messageExpected {
			t.Fatal("Did not broadcast action")
		}
	}
}

type MockTaskLoader struct{}

func (MockTaskLoader) LoadTaskData(projectName string, taskIndex string) (
	TaskData, error) {
		taskData, err := ReadSampleTaskData()
		return *taskData, err
}

// Tests that hub correctly registers
// And unregisters sessions and tasks
func TestRegistration(t *testing.T) {
	loader := MockTaskLoader{}
  hub := newhub(loader)
	go hub.run()
  sess1 := MakeSession(0)
  sess2 := MakeSession(0)
  sess3 := MakeSession(1)

  // Register 2 sessions from same task
  hub.registerSession <- sess1
  hub.registerSession <- sess2
  checkHubSessions(t, hub, 2, 1)

  // Register a session from a different task
  hub.registerSession <- sess3
  checkHubSessions(t, hub, 3, 2)
	// Failing here- opening file twice??

  // Deregister one session but no tasks
  hub.unregisterSession <- sess2
  checkHubSessions(t, hub, 2, 2)

  // Deregister all
  hub.unregisterSession <- sess1
  hub.unregisterSession <- sess3
  checkHubSessions(t, hub, 0, 0)
}

// Tests that hub broadcasts actions correctly
func TestActionBroadcast(t *testing.T) {
  // Create two sessions for a task
  // and one for a different task
	loader := MockTaskLoader{}
	hub := newhub(loader)
	go hub.run()
	sess1 := MakeSession(0)
  sess2 := MakeSession(0)
  sess3 := MakeSession(1)
	hub.registerSession <- sess1
	hub.registerSession <- sess2
	hub.registerSession <- sess3

  // Send action from 1 session
	var action BaseAction
	action, _ = MakeAddLabel(0, 0, sess1.SessionId)
	taskAction := action.(TaskAction)
	hub.execAction <- &taskAction

  // Make sure same task sessions received it
  // And different task sessions did not
	checkBroadcasted(t, sess1, true)
	checkBroadcasted(t, sess2, true)
	checkBroadcasted(t, sess3, false)
}

// // Tests that hub correctly maintains and saves state
func TestSaveState(t *testing.T) {
	// Create two sessions for different task
	loader := MockTaskLoader{}
	hub := newhub(loader)
	go hub.run()
	sess1 := MakeSession(0)
	sess2 := MakeSession(1)
	hub.registerSession <- sess1
	hub.registerSession <- sess2

	// Send an action for each session
	var action1 BaseAction
	action1, shape1 := MakeAddLabel(0, 0, sess1.SessionId)
	taskAction1 := action1.(TaskAction)
	hub.execAction <- &taskAction1

	var action2 BaseAction
	action2, shape2 := MakeAddLabel(0, 0, sess2.SessionId)
	taskAction2 := action2.(TaskAction)
	hub.execAction <- &taskAction2

	// Wait for actions to be broadcasted
	checkBroadcasted(t, sess1, true)
	checkBroadcasted(t, sess2, true)

	// Make sure each task state is correct
	state1 := hub.statesByTask[sess1.TaskId]
	state2 := hub.statesByTask[sess2.TaskId]
	checkData1 := CheckData{
		Shape: shape1,
		LabelId: 0,
		NumShapes: 1,
		ItemIndex: 0,
	}
	checkData2 := CheckData{
		Shape: shape2,
		LabelId: 0,
		NumShapes: 1,
		ItemIndex: 0,
	}
	err := CheckAddLabel(state1, checkData1)
	if err != nil {
		t.Fatal(err)
	}
	err = CheckAddLabel(state2, checkData2)
	if err != nil {
		t.Fatal(err)
	}
}
