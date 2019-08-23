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
		messageType, bytes, err := session.conn.ReadMessage()
		if err != nil {
			log.Println("Websocket Read Error", err)
			return
		}
		messages := make([]GenericAction, 0)
		err = json.Unmarshal(bytes, &messages)
		if err != nil {
			log.Println("Websocket ReadJSON Error", err)
		}
		for _, message := range messages {
			var actionMessage GenericAction
			switch message.Type {
			case addLabel:
				actionMessage = &AddLabelAction{}
			case goToItem:
				actionMessage = &GoToItemAction{}
			case changeLabelShape:
				actionMessage = &ChangeLabelShapeAction{}
			case loadItem:
				actionMessage = &LoadItemAction{}
			default:
				log.Println("Action not implemented in go yet")
			}
			err = json.Unmarshal(bytes, &actionMessage)
			if err != nil {
				log.Println("Websocket ReadJSON Error", err)
				return
			}
			_, ok := userActions[action.Type]; if ok {
				action.Time = time.Now().String()
				log.Printf("Got this message: %v\n", action)
				action.applyToUserState(UserData{})
			}
			_, ok := sessionActions[action.Type]; if ok {
				action.Time = time.Now().String()
				log.Printf("Got this message: %v\n", action)
				action.applyToSessionState(SessionData{})
			}
			_, ok := taskActions[action.Type]; if ok {
				h.execAction <- actionMessage
			}
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
