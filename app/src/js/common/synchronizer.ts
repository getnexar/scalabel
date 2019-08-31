import _ from 'lodash'
import { Dispatch, Middleware } from 'redux'
import * as types from '../action/types'
import Session, { ConnectionStatus } from './session'
/**
 * Singleton session class
 */
export class Synchronizer {
  /** Websocket connection */
  public websocket: WebSocket
  /** Actions queued to send */
  public actionQueue: types.BaseAction[]
  /** Timestamped action log */
  public actionLog: types.BaseAction[]
  /** Middleware to use */
  public middleware: Middleware
  /** Whether websocket is registered */
  public registered: boolean

  /**
   * no-op for state initialization
   */
  constructor () {
    this.actionQueue = []
    this.actionLog = []
    this.registered = false
    this.websocket = new WebSocket(`ws://${window.location.host}/register`)
    /* sync on every action */
    const self = this
    this.middleware = () => (
      next: Dispatch
    ) => (action) => {
      /* Do not send received actions back again */
      if (Session.id === action.sessionId) {
        self.actionQueue.push(action)
        self.sendActions()
      }
      return next(action)
    }
    this.registerWebsocket()
  }

  /**
   * Send the action to the backend
   */
  public sendActions () {
    if (this.websocket.readyState === 1 && this.registered) {
      if (this.actionQueue.length > 0) {
        this.websocket.send(JSON.stringify(this.actionQueue))
        this.actionQueue = []
      }
    }
  }

  /**
   * Send the registration message to the backend
   */
  public sendRegistration () {
    this.registered = true
    this.websocket.send(JSON.stringify({
      sessionId:   Session.id,
      taskId:      Session.getState().task.config.taskId,
      projectName: Session.getState().task.config.projectName
    }))
    Session.updateStatusDisplay(ConnectionStatus.UNSAVED)
  }

  /**
   * Send the register message
   * Only called after session ID is set
   */
  public registerWebsocket () {
    const self = this
    this.websocket.onmessage = (e) => {
      const response: types.ActionType | number = JSON.parse(e.data)
      if (response === 1) {
        /* on receipt of ack from backend
           send any queued actions */
        self.sendActions()
      } else {
        const responseAction = response as types.ActionType
        self.actionLog.push(responseAction)
        if (responseAction.sessionId !== Session.id) {
          Session.dispatch(responseAction)
        }
      }
    }
    /* if websocket is not yet open, this runs */
    this.websocket.onopen = () => {
      self.sendRegistration()
    }
    /* if websocket is already open, this runs
       registered flag ensures no duplicate registration */
    if (this.websocket.readyState === 1 && !this.registered) {
      this.sendRegistration()
    }
    this.websocket.onclose = () => {
      self.registered = false
      Session.updateStatusDisplay(ConnectionStatus.RECONNECTING)
      self.websocket = new WebSocket(`ws://${window.location.host}/register`)
      self.registerWebsocket()
    }
  }
}

export default Synchronizer
