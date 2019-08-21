package main

import (
	"github.com/gorilla/websocket"
	"log"
	"time"
)

type Session struct {
	sessionId string
	taskId		string
	conn      *websocket.Conn
	send      chan *ActionResponse
}

type Hub struct {
	registerSession   chan *Session
	unregisterSession chan *Session
	execAction        chan *ActionMsg
	sessions					map[string]*Session
	sessionsByTask		map[string]map[string]*Session
	actionLogByTask 	map[string][]*ActionResponse
}

func newhub() *Hub {
	return &Hub{
		registerSession:   make(chan *Session),
		unregisterSession: make(chan *Session),
		execAction:        make(chan *ActionMsg),
		sessions:					 make(map[string]*Session),
		sessionsByTask:		 make(map[string]map[string]*Session),
		actionLogByTask:   make(map[string][]*ActionResponse),
	}
}

func (h *Hub) run() {
	for {
		select {
		case session := <-h.registerSession:
			if _, ok := h.sessionsByTask[session.taskId]; !ok {
				h.sessionsByTask[session.taskId] = make(map[string]*Session)
				h.actionLogByTask[session.taskId] = make([]*ActionResponse, 0)
			}
			h.sessionsByTask[session.taskId][session.sessionId] = session
			h.sessions[session.sessionId] = session
		case session := <-h.unregisterSession:
			if _, ok := h.sessions[session.sessionId]; ok {
				delete(h.sessions, session.sessionId)
			}
			if _, ok := h.sessionsByTask[session.taskId][session.sessionId]; ok {
				delete(h.sessionsByTask[session.taskId], session.sessionId)
			}
			if len(h.sessionsByTask[session.taskId]) == 0 {
				delete(h.sessionsByTask, session.taskId)
			}
		case action := <-h.execAction:
			timeStamp := time.Now().String()
			log.Printf("Got this message: %v at %s\n", action, timeStamp)

			actionResponse := &ActionResponse {
				Type: action.Type,
				SessionId: action.SessionId,
				Args: action.Args,
				Time: timeStamp,
			}
			taskId := h.sessions[action.SessionId].taskId
			h.actionLogByTask[taskId] = append(h.actionLogByTask[taskId], actionResponse)
			for _, session := range h.sessionsByTask[taskId] {
				session.send <- actionResponse
			}
		}

	}
}
