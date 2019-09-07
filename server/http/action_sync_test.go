package main

import (
  "github.com/gorilla/websocket"
  "log"
  "net/http"
  "net/http/httptest"
  "strings"
	"testing"
)

// Helper functions
// Connections to server and starts receiver/returner
func startReceiver(h *Hub, s *Session, w http.ResponseWriter, r *http.Request) {
  upg := websocket.Upgrader{ReadBufferSize: 1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	conn, err := upg.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Register Mock Server Error:", err)
	}
  s.Conn = conn
  go actionReceiver(s, h)
  go actionReturner(s)
}

// Check that an addLabel action can be read
func checkReadLabel(t *testing.T, itemIndex int, ws *websocket.Conn) {
  receiveAction := &AddLabelAction{}
  err := ws.ReadJSON(receiveAction)
  if err != nil {
    t.Fatal(err)
  }
  if receiveAction.Time == "" {
    t.Fatalf("Action not timestamped %v", receiveAction)
  }
  // fix bug with timestamp
  if receiveAction.ItemIndex != itemIndex {
    t.Fatal("Action changed")
  }
}

// Tests that a valid task action is echoed back
// and a valid non-task action is received without error
// and a non-valid action causes an error
func TestActionLoop(t *testing.T) {
  loader := MockTaskLoader{}
  hub := newhub(loader)
  go hub.run()

  session := MakeSession(0)
  hub.registerSession <- session

  // Mock a websocket connection
  server := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			startReceiver(hub, session, w, r)
	   }))
  defer server.Close()

  // Convert http://127.0.0.1 to ws://127.0.0.
  url := "ws" + strings.TrimPrefix(server.URL, "http")

  // Connect to the server
  ws, _, err := websocket.DefaultDialer.Dial(url, nil)
  if err != nil {
      t.Fatal(err)
  }
  defer ws.Close()

  // Send multiple action types, receive only task action
  taskAction1, _ := MakeAddLabel(0, 0, session.SessionId)
  taskAction2, _ := MakeAddLabel(1, 1, session.SessionId)
  userAction1 := ChangeSelectAction{
    ItemIndex: 3,
  }
  userAction1.Type = changeSelect
  userAction2 := ChangeSelectAction{
    ItemIndex: 4,
  }
  userAction2.Type = changeSelect
  sendActions := []interface{}{*taskAction1, userAction1, userAction2, *taskAction2}
  if err := ws.WriteJSON(sendActions); err != nil {
    t.Fatal(err)
  }
  checkReadLabel(t, taskAction1.ItemIndex, ws)
  checkReadLabel(t, taskAction2.ItemIndex, ws)

  // Send an invalid action
  type FakeAction struct {
    Type int
  }
  invalidAction := FakeAction{ Type: 3 }
  sendActions3 := []FakeAction{invalidAction}
  if err := ws.WriteJSON(sendActions3); err != nil {
    t.Fatal(err)
  }
  // Check that the channel closed
  receiveAction := &FakeAction{}
  if err := ws.ReadJSON(&receiveAction); err == nil {
    t.Fatal("No error on read when channel is closed")
  }
}
