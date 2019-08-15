package main

import (
  "github.com/gorilla/websocket"
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

func actionReceiver(conn *websocket.Conn, session *Session, h *Hub) {
  var msg ActionMsg
  for {
    err := conn.ReadJSON(&msg)
    if err != nil {
      log.Println("Websocket ReadJSON Error", err)
      conn.Close()
      h.unregisterSession <- session
    }
    h.execAction <- &msg
  }
}

func actionReturner(session *Session, actionResponse *ActionResponse, h *Hub) {
  err := session.conn.WriteJSON(&actionResponse)
  if err != nil {
    log.Println("Websocket WriteJSON Error", err)
    session.conn.Close()
    h.unregisterSession <- session
  }
}
