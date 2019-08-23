package main

import (
	"github.com/gorilla/websocket"
	"log"
	"time"
)

type Session struct {
	sessionId string
	taskId    string
	conn      *websocket.Conn
	send      chan *ActionResponse
}

type Hub struct {
	registerSession   chan *Session
	unregisterSession chan *Session
	execAction        chan *ActionMessage
	sessions          map[string]*Session
	sessionsByTask    map[string]map[string]*Session
	actionsByTask     map[string][]*ActionResponse
}

func newhub() *Hub {
	return &Hub{
		registerSession:   make(chan *Session),
		unregisterSession: make(chan *Session),
		execAction:        make(chan *ActionMessage),
		sessions:          make(map[string]*Session),
		sessionsByTask:    make(map[string]map[string]*Session),
		actionsByTask:     make(map[string][]*ActionResponse),
	}
}

func (h *Hub) run() {
	for {
		select {
		case session := <-h.registerSession:
			if _, ok := h.sessionsByTask[session.taskId]; !ok {
				h.sessionsByTask[session.taskId] = make(map[string]*Session)
				h.actionsByTask[session.taskId] = make([]*ActionResponse, 0)
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
			}
		case action := <-h.execAction:
			timeStamp := time.Now().String()
			log.Printf("Got this message: %v at %s\n", action, timeStamp)

			actionResponse := &ActionResponse {
				Type:      action.Type,
				SessionId: action.SessionId,
				Args:      action.Args,
				Time:      timeStamp,
			}
			taskId := h.sessions[action.SessionId].taskId
			h.actionsByTask[taskId] =
				append(h.actionsByTask[taskId], actionResponse)
			for _, session := range h.sessionsByTask[taskId] {
				session.send <- actionResponse
			}
		}
	}
}
