package main

import (
  "github.com/gorilla/websocket"
	"log"
	"time"
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

func actionEchoer(conn *websocket.Conn) {
  for {
    var msg ActionMsg
    err := conn.ReadJSON(&msg)
    if err != nil {
      log.Println("Websocket ReadJSON Error", err)
      conn.Close()
    }
    timeStamp := time.Now().String()
    log.Printf("Got this message: %v at %s\n", msg, timeStamp)
    actionResponse := ActionResponse {
      Action: msg,
      Time: timeStamp,
    }
    err := conn.WriteJSON(&actionResponse)
    if err != nil {
      log.Println("Websocket WrtieJSON Error", err)
      conn.Close()
    }
  }
}
