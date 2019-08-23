import _ from 'lodash'
import { Dispatch, Middleware, Store } from 'redux'
import { StateWithHistory } from 'redux-undo'
import * as THREE from 'three'
import * as types from '../action/types'
import { Window } from '../components/window'
import { State } from '../functional/types'
import { configureStore } from './configure_store'
export const enum ConnectionStatus {
  SAVED, SAVING, RECONNECTING, UNSAVED
}

/**
 * Singleton session class
 */
class Session {
  /** The store to save states */
  public store: Store<StateWithHistory<State>>
  /** Images of the session */
  public images: HTMLImageElement[]
  /** Point cloud */
  public pointClouds: THREE.Points[]
  /** Item type: image, point cloud */
  public itemType: string
  /** The window component */
  public window?: Window
  /** Dev mode */
  public devMode: boolean
  /** Connection status for saving */
  public status: ConnectionStatus
  /** Function to update status display */
  public updateStatusDisplay: (newStatus: ConnectionStatus) => ConnectionStatus
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
    this.images = []
    this.pointClouds = []
    this.itemType = ''
    this.actionQueue = []
    this.actionLog = []
    this.status = ConnectionStatus.UNSAVED
    this.registered = false
    // TODO: make it configurable in the url
    this.devMode = true

    this.websocket = new WebSocket(`ws://${window.location.host}/register`)
    /* sync on every action */
    this.middleware = () => (
      next: Dispatch
    ) => (action) => {
      this.actionQueue.push(action)
      this.sendActions()
      return next(action)
    }
    this.store = configureStore({}, this.devMode, this.middleware)
    this.updateStatusDisplay = (newStatus: ConnectionStatus) => {
      return newStatus
    }
  }

  /**
   * Send the action to the backend
   */
  public sendActions () {
    if (this.websocket.readyState === 1 && this.registered) {
      while (this.actionQueue.length > 0) {
        this.websocket.send(JSON.stringify(this.actionQueue.shift()))
      }
    }
  }

  /**
   * Send the registration message to the backend
   */
  public sendRegistration () {
    this.registered = true
    this.websocket.send(JSON.stringify({
      sessionId: this.id,
      taskId:    this.getState().task.config.taskId
    }))
    this.updateStatusDisplay(ConnectionStatus.UNSAVED)
  }

  /**
   * Send the register message
   * Only called after session ID is set
   */
  public registerWebsocket () {
    this.websocket.onmessage = (e) => {
      if (typeof e.data === 'string') {
        if (JSON.parse(e.data) === 1) {
          /* on receipt of ack from backend
             send any queued actions */
          this.sendActions()
        } else {
          const response: types.ActionType = JSON.parse(e.data)
          this.actionLog.push(response)
        }
      }
    }
    /* if websocket is not yet open, this runs */
    this.websocket.onopen = () => {
      this.sendRegistration()
    }
    /* if websocket is already open, this runs
       registered flag ensures no duplicate registration */
    if (this.websocket.readyState === 1 && !this.registered) {
      this.sendRegistration()
    }
    this.websocket.onclose = () => {
      this.registered = false
      this.updateStatusDisplay(ConnectionStatus.RECONNECTING)
      this.websocket = new WebSocket(`ws://${window.location.host}/register`)
      this.registerWebsocket()
    }
  }

  /**
   * Get current state in store
   * @return {State}
   */
  public getState (): State {
    return this.store.getState().present
  }

  /**
   * Get the id of the current session
   */
  public get id (): string {
    return this.getState().session.id
  }

  /**
   * Wrapper for redux store dispatch
   * @param {types.ActionType} action: action description
   */
  public dispatch (action: types.ActionType): void {
    this.store.dispatch(action)
  }

  /**
   * Subscribe all the controllers to the states
   * @param {Function} callback: view component
   */
  public subscribe (callback: () => void) {
    this.store.subscribe(callback)
  }
}

export default new Session()
