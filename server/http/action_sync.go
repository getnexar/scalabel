package main

import (
	"github.com/gorilla/websocket"
	"encoding/json"
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
		_, bytes, err := session.conn.ReadMessage()
		if err != nil {
			log.Println("Websocket Read Bytes Error", err)
			return
		}
		messages := make([]GenericAction, 0)
		err = json.Unmarshal(bytes, &messages)
		if err != nil {
			log.Println("Websocket Read Generic JSON Error", err)
		}
		rawMessages := make([]json.RawMessage, 0)
		err = json.Unmarshal(bytes, &rawMessages)
		if err != nil {
			log.Println("Websocket Read Raw JSON Error", err)
		}
		if len(rawMessages) != len(messages) {
			log.Println("Websocket Read Lengths Error", err)
		}
		for i, message := range messages {
			_, ok := userActions[message.Type]; if ok {
				var actionMessage UserAction
				switch message.Type {
				case goToItem:
					actionMessage = &GoToItemAction{}
				default:
					log.Println("Action not implemented in go yet")
				}
				err = json.Unmarshal(rawMessages[i], &actionMessage)
				if err != nil {
					log.Println("Websocket Read User Action JSON Error", err)
					return
				}
				actionMessage.addTimestamp()
				_, err = actionMessage.applyToUserState(&UserData{})
				if err != nil {
					log.Println("Failed to commit user action to state", err)
				}
			}
			_, ok = sessionActions[message.Type]; if ok {
				var actionMessage SessionAction
				switch message.Type {
				case loadItem:
					actionMessage = &LoadItemAction{}
				default:
					log.Println("Action not implemented in go yet")
				}
				err = json.Unmarshal(rawMessages[i], &actionMessage)
				if err != nil {
					log.Println("Websocket Read Session Action JSON Error", err)
					return
				}
				actionMessage.addTimestamp()
				_, err = actionMessage.applyToSessionState(&SessionData{})
				if err != nil {
					log.Println("Failed to commit session action to state", err)
				}
			}
			_, ok = taskActions[message.Type]; if ok {
				var actionMessage TaskAction
				switch message.Type {
				case addLabel:
					actionMessage = &AddLabelAction{}
				case changeLabelShape:
					actionMessage = &ChangeShapeAction{}
				default:
					log.Println("Action not implemented in go yet")
				}
				err = json.Unmarshal(rawMessages[i], &actionMessage)
				if err != nil {
					log.Println("Websocket Read Task Action JSON Error", err)
					return
				}
				h.execAction <- &actionMessage
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
			err = session.conn.WriteJSON(actionResponse)
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
