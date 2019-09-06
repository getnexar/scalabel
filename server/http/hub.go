package main

import (
	"github.com/gorilla/websocket"
	"log"
)

// save every time this number of actions occur
const saveFrequency = 5

type Session struct {
	SessionId   string
	TaskId      string
	ProjectName string
	Conn        *websocket.Conn
	Send        chan *TaskAction
}

// hub stores sessions, and coordinates them to their corresponding tasks
// sessions maps sessionId to Session
// byTask variables map taskId to corresponding objects
type Hub struct {
	registerSession   chan *Session
	unregisterSession chan *Session
	execAction        chan *TaskAction
	sessions          map[string]*Session
	sessionsByTask    map[string]map[string]*Session
	actionsByTask     map[string][]*TaskAction
	statesByTask      map[string]*TaskData
	loader            TaskLoader
}

func newhub(loader TaskLoader) *Hub {
	return &Hub{
		registerSession:   make(chan *Session),
		unregisterSession: make(chan *Session),
		execAction:        make(chan *TaskAction),
		sessions:          make(map[string]*Session),
		sessionsByTask:    make(map[string]map[string]*Session),
		actionsByTask:     make(map[string][]*TaskAction),
		statesByTask:      make(map[string]*TaskData),
		loader:            loader,
	}
}

func (h *Hub) run() {
	for {
		select {
		case session := <-h.registerSession:
			// Check if another session is already on the task
			if _, ok := h.sessionsByTask[session.TaskId]; !ok {
				// If no other session is on the task, initialize task info
				h.sessionsByTask[session.TaskId] = make(map[string]*Session)
				h.actionsByTask[session.TaskId] = make([]*TaskAction, 0)
				// loader is used to mock load during tests
				loadedTask, err := h.loader.LoadTaskData(
					session.ProjectName, session.TaskId)
				if err != nil {
					log.Fatal(err)
				}
				h.statesByTask[session.TaskId] = &loadedTask
			}
			// Initialize the session info
			h.sessionsByTask[session.TaskId][session.SessionId] = session
			h.sessions[session.SessionId] = session
		case session := <-h.unregisterSession:
			sessId := session.SessionId
			taskId := session.TaskId
			// Make sure the session still exists
			if _, ok := h.sessionsByTask[taskId][sessId]; ok {
				// Delete the session's info and close its channels
				delete(h.sessionsByTask[taskId], sessId)
				delete(h.sessions, sessId)
				close(session.Send)
			}
			// Check if this is the last session for its task
			if len(h.sessionsByTask[taskId]) == 0 {
				// Save the task data to disk, then delete it from the hub
				delete(h.sessionsByTask, taskId)
				err := (*h.statesByTask[taskId]).save()
				if err != nil {
					log.Fatal(err)
				}
				delete(h.statesByTask, taskId)
			}
		case action := <-h.execAction:
			taskAction := *action
			// Timestamp the action in the hub to enforce uniform times
			taskAction.addTimestamp()
			taskId := h.sessions[taskAction.getSessionId()].TaskId
			// Dispatch the action to update the state in the hub
			newState, err := taskAction.updateState(h.statesByTask[taskId])
			if err != nil {
				// If error occured, action was malformed
				// or out of sync with the state
				Error.Println(err)
			} else {
				h.statesByTask[taskId] = newState
				// Save task data to disk every few actions
				if (len(h.actionsByTask[taskId]) % saveFrequency == 0) {
					err := (*h.statesByTask[taskId]).save()
					if err != nil {
						log.Fatal(err)
					}
				}
				// Update action log
				h.actionsByTask[taskId] =
					append(h.actionsByTask[taskId], action)
				// Broadcast action to all sessions for this task
				for _, session := range h.sessionsByTask[taskId] {
					session.Send <- &taskAction
				}
			}
		}
	}
}
