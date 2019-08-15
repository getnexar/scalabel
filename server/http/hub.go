package main

import (
  "github.com/gorilla/websocket"
	"log"
  "time"
)

type Session struct {
  sessionId string
  conn      *websocket.Conn
}

type Hub struct {
	registerSession   chan *Session
	unregisterSession chan *Session
  execAction        chan *ActionMsg
	sessions          map[string]*Session
  actionLog         map[int]*ActionResponse
  numActions        int
}

func newhub() *Hub {
	return &Hub{
		sessions:          make(map[string]*Session),
		registerSession:   make(chan *Session),
		unregisterSession: make(chan *Session),
    execAction:        make(chan *ActionMsg),
    actionLog:         make(map[int]*ActionResponse),
    numActions:        0,
	}
}

func (h *Hub) run() {
	for {
		select {
		case sess := <-h.registerSession:
			h.sessions[sess.sessionId] = sess
		case sess := <-h.unregisterSession:
			sessID := sess.sessionId
			_, ok := h.sessions[sessID]
			if ok {
				delete(h.sessions, sessID)
			}
    case action := <-h.execAction:
      timeStamp := time.Now().String()
      log.Printf("Got this message: %v at %s\n", action, timeStamp)
      actionResponse := &ActionResponse {
        Action: *action,
        Time: timeStamp,
      }
      h.actionLog[h.numActions] = actionResponse
      h.numActions += 1
      for _, sess := range h.sessions {
          go actionReturner(sess, actionResponse, h)
      }
		}

	}
}
