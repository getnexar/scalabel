package main

import (
	"github.com/gorilla/websocket"
	"log"
	"time"
)

// Sends new ping with this interval
const pingPeriod = 25 * time.Second
// Must receive pong within this time, must be greater than pingPeriod
const pongPeriod = 30 * time.Second
// Must write within this time
const writePeriod = 10 * time.Second

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

	session.conn.SetReadDeadline(time.Now().Add(pongPeriod))
	session.conn.SetPongHandler(func(string) error {
		session.conn.SetReadDeadline(time.Now().Add(pongPeriod))
		return nil
	})

	for {
		var msg ActionMsg
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
		delete(msg.Args, "sessionId")
		h.execAction <- &msg
	}
}

func actionReturner(session *Session, h *Hub) {
	timer := time.NewTicker(pingPeriod)
	defer func() {
		session.conn.Close()
	}()

	for {
		select {
		case actionResponse, ok := <-session.send:
			session.conn.SetWriteDeadline(time.Now().Add(writePeriod))
			if !ok {
				log.Println("Channel closed")
				return
			}
			err := session.conn.WriteJSON(actionResponse)
			if err != nil {
				log.Println("Websocket WriteJSON Error", err)
				return
			}
		case <-timer.C:
			session.conn.SetWriteDeadline(time.Now().Add(writePeriod))
			err := session.conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				return
			}
		}
	}
}
