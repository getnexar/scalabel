package main

import (
	"log"
)

type ActionMsg struct {
  Type      string                 `json:"type" yaml:"type"`
  SessionId string                 `json:"sessionId" yaml:"sessionId"`
	Args      map[string]interface{} `json:"-" yaml:"-"`
}

type ActionResponse struct {
	Type      string                 `json:"type" yaml:"type"`
  SessionId string                 `json:"sessionId" yaml:"sessionId"`
	Args      map[string]interface{} `json:"args" yaml:"args"`
	Time      string                 `json:"time" yaml:"time"`
}

func actionReceiver(session *Session, h *Hub) {
	defer func() {
		session.conn.Close()
		h.unregisterSession <- session
	}()

  var msg ActionMsg
  for {
    err := session.conn.ReadJSON(&msg.Args)
    if err != nil {
      log.Println("Websocket ReadJSON Error", err)
      return
    }
		//Process default action fields
		if actionType, ok := msg.Args["type"].(string); ok {
			msg.Type = actionType
		}
		if sessionId, ok := msg.Args["sessionId"].(string); ok {
			msg.SessionId = sessionId
		}
		delete(msg.Args, "type")
		delete(msg.Args, "sessionid")

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
    err := session.conn.WriteJSON(actionResponse)
    if err != nil {
      log.Println("Websocket WriteJSON Error", err)
      return
    }
  }
}
