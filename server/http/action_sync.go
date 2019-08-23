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

type ActionMessage struct {
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

	err := session.conn.SetReadDeadline(time.Now().Add(pongPeriod))
	if err != nil {
		log.Println("Read Deadline Error", err)
		return
	}
	session.conn.SetPongHandler(func(string) error {
		err := session.conn.SetReadDeadline(time.Now().Add(pongPeriod))
		if err != nil {
			log.Println("Read Deadline Error", err)
			return err
		}
		return nil
	})

	for {
		messages := make([]map[string]interface{}, 0)
		err := session.conn.ReadJSON(&messages)
		if err != nil {
			log.Println("Websocket ReadJSON Error", err)
			return
		}
		//Process default action fields
		for _, message := range messages {
			var actionMessage ActionMessage
			if actionType, ok := message["type"].(string); ok {
				actionMessage.Type = actionType
				delete(message, "type")
			}
			if sessionId, ok := message["sessionId"].(string); ok {
				actionMessage.SessionId = sessionId
				delete(message, "sessionId")
			}
			actionMessage.Args = message
			h.execAction <- &actionMessage
		}
	}
}

func actionReturner(session *Session) {
	timer := time.NewTicker(pingPeriod)
	defer func() {
		timer.Stop()
		session.conn.Close()
	}()

	for {
		select {
		case actionResponse, ok := <-session.send:
			if !ok {
				log.Println("Channel closed")
				return
			}
			err := session.conn.SetWriteDeadline(time.Now().Add(writePeriod))
			if err != nil {
				log.Println("Write Deadline Error", err)
				return
			}
			var formattedAction map[string]interface{} = make(map[string]interface{})
			formattedAction["type"] = actionResponse.Type
			formattedAction["sessionId"] = actionResponse.SessionId
			for k, v := range actionResponse.Args {
				formattedAction[k] = v
			}
			err = session.conn.WriteJSON(formattedAction)
			if err != nil {
				log.Println("Websocket WriteJSON Error", err)
				return
			}
		case <-timer.C:
			err := session.conn.SetWriteDeadline(time.Now().Add(writePeriod))
			if err != nil {
				log.Println("Write Deadline Error", err)
				return
			}
			err = session.conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				return
			}
		}
	}
}
