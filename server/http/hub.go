package main

import (
	"github.com/gorilla/websocket"
)

type Session struct {
	sessionId string
	taskId    string
	conn      *websocket.Conn
	send      chan *TaskAction
}

type Hub struct {
	registerSession   chan *Session
	unregisterSession chan *Session
	execAction        chan *TaskAction
	sessions          map[string]*Session
	sessionsByTask    map[string]map[string]*Session
	actionsByTask     map[string][]*TaskAction
	statesByTask      map[string]TaskData
}

func newhub() *Hub {
	return &Hub{
		registerSession:   make(chan *Session),
		unregisterSession: make(chan *Session),
		execAction:        make(chan *TaskAction),
		sessions:          make(map[string]*Session),
		sessionsByTask:    make(map[string]map[string]*Session),
		actionsByTask:     make(map[string][]*TaskAction),
		statesByTask:      make(map[string]TaskData)
	}
}

func (h *Hub) run() {
	for {
		select {
		case session := <-h.registerSession:
			if _, ok := h.sessionsByTask[session.taskId]; !ok {
				h.sessionsByTask[session.taskId] = make(map[string]*Session)
				h.actionsByTask[session.taskId] = make([]*TaskAction, 0)
				h.statesByTask[session.taskId] = make(TaskData)
			}
			h.sessionsByTask[session.taskId][session.sessionId] = session
			h.sessions[session.sessionId] = session
		case session := <-h.unregisterSession:
			sessId := session.sessionId
			taskId := session.taskId

			if _, ok := h.sessionsByTask[taskId][sessId]; ok {
				delete(h.sessionsByTask[taskId], sessId)
				delete(h.sessions, sessId)
				close(session.send)
			}
			if len(h.sessionsByTask[taskId]) == 0 {
				delete(h.sessionsByTask, taskId)
				delete(h.statesByTask, taskId)
			}
		case action := <-h.execAction:
			taskAction := *action
			taskAction.addTimestamp()
			taskId := h.sessions[taskAction.getSessionId()].taskId

			h.statesByTask[taskId], err :=
				taskAction.updateState(h.statesByTask[taskId])
			if err == nil {
				h.actionsByTask[taskId] =
					append(h.actionsByTask[taskId], action)
				for _, session := range h.sessionsByTask[taskId] {
					session.send <- &taskAction
				}
			}
		}
	}
}
