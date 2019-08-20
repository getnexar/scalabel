package main

import (
	"log"
)

type ActionMsg struct {
  Type      string     `json:"type" yaml:"type"`
  SessionId string     `json:"sessionId" yaml:"sessionId"`
  Args      interface{}
}

type ActionResponse struct {
  Action ActionMsg `json:"action" yaml:"action"`
  Time   string    `json:"time" yaml:"time"`
}

func actionReceiver(session *Session, h *Hub) {
	defer func() {
		session.conn.Close()
		h.unregisterSession <- session
	}()

  var msg ActionMsg
  for {
    err := session.conn.ReadJSON(&msg)
    if err != nil {
      log.Println("Websocket ReadJSON Error", err)
      return
    }
    h.execAction <- &msg
  }
}

func actionReturner(session *Session, h *Hub) {
	defer func() {
		session.conn.Close()
		h.unregisterSession <- session
	}()

  for actionResponse := range session.send {
		actionResponse := actionResponse
    err := session.conn.WriteJSON(&actionResponse)
    if err != nil {
      log.Println("Websocket WriteJSON Error", err)
      return
    }
  }
}
