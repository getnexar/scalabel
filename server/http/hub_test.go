package main

import (
	"fmt"
	"testing"
	"time"
)

// Helper functions
// Makes a dummy session
func makeSession(taskNum int) *Session {
  return &Session{
		SessionId:   getUuidV4(),
		TaskId:		   fmt.Sprintf("fakeTaskId%v", taskNum),
		ProjectName: "testProject",
		Send:        make(chan *TaskAction),
	}
}

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

func checkBroadcasted(t *testing.T, session *Session) {
	if _, ok := <-session.Send; !ok {
		t.Fatal("Did not broadcast action")
	}
}

type MockTaskLoader struct{}

func (MockTaskLoader) LoadTaskData(projectName string, taskIndex string) (
	TaskData, error) {
		taskData, err := ReadTaskData()
		return *taskData, err
}

// Tests that hub correctly registers
// And unregisters sessions and tasks
func TestRegistration(t *testing.T) {
	loader := MockTaskLoader{}
  hub := newhub(loader)
	go hub.run()
  sess1 := makeSession(0)
  sess2 := makeSession(0)
  sess3 := makeSession(1)

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
// func TestActionBroadcast(t *testing.T) {
//   // Create two sessions for a task
//   // and one for a different task
// 	loader := MockTaskLoader{}
// 	hub := newhub(loader)
// 	go hub.run()
// 	sess1 := makeSession(0)
//   sess2 := makeSession(0)
//   sess3 := makeSession(1)
// 	hub.registerSession <- sess1
// 	hub.registerSession <- sess2
// 	hub.registerSession <- sess3
//
//   // Send action from 1 session
// 	var action BaseAction
// 	action = &AddLabelAction{}
// 	taskAction := action.(TaskAction)
// 	hub.execAction <- &taskAction
//
//   // Make sure same task sessions received it
//   // And different task sessions did not
// 	checkBroadcasted(t, sess1)
// 	checkBroadcasted(t, sess2)
// 	_, ok := <-sess3.Send
// 	if ok {
// 		t.Fatal("Broadcasted but should not have")
// 	}
// }

// // Tests that hub correctly maintains and saves state
// // func TestSaveState(t *testing.T) {
// //   // Similar to previous test
// //   // Check by running actions here manually as well?
// //   // Or reuse testing code from other file
// //
// // 	// Note- need to mock save and load above as well
// // 	// To do this make an interface that must implement loading
// // 	// for task (operates on struct of arguments)
// // }
