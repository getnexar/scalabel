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

// Read the json raw message into the correct struct based on its type
func readMessage(messageType string, rawMessage json.RawMessage) (
	BaseAction, error) {
	var actionMessage BaseAction
	switch messageType {
	case addLabel:
		actionMessage = &AddLabelAction{}
	case changeShape:
		actionMessage = &ChangeShapeAction{}
	case changeLabel:
		actionMessage = &ChangeLabelAction{}
	case deleteLabel:
		actionMessage = &DeleteLabelAction{}
	case tagImage:
		actionMessage = &TagImageAction{}
	case changeSelect:
		actionMessage = &ChangeSelectAction{}
	case imageZoom:
		actionMessage = &ImageZoomAction{}
	case toggleAssistantView:
		actionMessage = &ToggleAssistantViewAction{}
	case moveCameraAndTarget:
		actionMessage = &MoveCameraAndTargetAction{}
	case loadItem:
		actionMessage = &LoadItemAction{}
	case initSession:
		actionMessage = &InitSessionAction{}
	case updateAll:
		actionMessage = &UpdateAllAction{}
	default:
		log.Println("Action not implemented in go")
	}
	err := json.Unmarshal(rawMessage, &actionMessage)
	if err != nil {
		log.Println("Websocket Read Action JSON Error", err)
		return nil, err
	}
	// timestamp session and user actions
	// taskActions should be timestamped in the hub
	_, ok := taskActions[messageType]; if !ok {
		actionMessage.addTimestamp()
	}
	return actionMessage, nil
}

// Receives messages from the client and sends them to the hub
func actionReceiver(session *Session, h *Hub) {
	defer func() {
		session.conn.Close()
		h.unregisterSession <- session
	}()

	// Pong receiver detects client going offline
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
		// Read the action queue from the client
		// Unmarshal into generic actions to read the type
		messages := make([]GenericAction, 0)
		err = json.Unmarshal(bytes, &messages)
		if err != nil {
			log.Println("Websocket Read Generic JSON Error", err)
		}
		// Unmarshal into raw messages to be processed later
		rawMessages := make([]json.RawMessage, 0)
		err = json.Unmarshal(bytes, &rawMessages)
		if err != nil {
			log.Println("Websocket Read Raw JSON Error", err)
		}
		if len(rawMessages) != len(messages) {
			log.Println("Websocket Read Lengths Error", err)
		}

		for i, message := range messages {
			// Process raw message based on type
			actionMessage, err := readMessage(message.Type, rawMessages[i])
			if err != nil {
				return
			}
			// User action (dummy for now)
			_, ok := userActions[message.Type]; if ok {
				userAction, ok1 := actionMessage.(UserAction); if ok1 {
					userAction.applyToUserState(&UserData{})
				}
			}
			// Session action (dummy for now)
			_, ok = sessionActions[message.Type]; if ok {
				sessionAction, ok1 := actionMessage.(SessionAction); if ok1 {
					sessionAction.applyToSessionState(&SessionData{})
				}
			}
			// Task action is sent to the hub
			_, ok = taskActions[message.Type]; if ok {
				taskAction, ok1 := actionMessage.(TaskAction); if ok1 {
					h.execAction <- &taskAction
				}
			}
		}
	}
}

// Sends messages to the client
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
			// Sends action broadcasted by the hub to the client
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
			// Ping sender detects client going offline
			err = session.conn.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				return
			}
		}
	}
}
