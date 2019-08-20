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
  /** Websocket connection */
  public websocket: WebSocket
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
    this.actionLog = []
    this.status = ConnectionStatus.UNSAVED
    this.registered = false
    // TODO: make it configurable in the url
    this.devMode = true

    /* set up websocket */
    this.websocket = new WebSocket(`ws://${window.location.host}/register`)

    /* sync on every action */
    this.middleware = () => (
      next: Dispatch
    ) => (action) => {
      if (this.websocket.readyState === 1 && this.registered) {
        this.websocket.send(JSON.stringify(action))
      }
      return next(action)
    }
    this.store = configureStore({}, this.devMode, this.middleware)

    this.websocket.onmessage = (e) => {
      if (typeof e.data === 'string') {

        const response: types.ActionType = JSON.parse(e.data)
        this.actionLog.push(response)
      }
    }
  }

  /**
   * Send the register message
   * Only called after session ID is set
   */
  public registerWebsocket () {
    /* if websocket is not yet open, this runs */
    this.websocket.onopen = () => {
      this.registered = true
      this.websocket.send(JSON.stringify({
        sessionId: this.id
      }))
    }
    /* if websocket is already open, this runs
       extra check ensures no duplicate registration */
    if (this.websocket.readyState === 1 && !this.registered) {
      this.registered = true
      this.websocket.send(JSON.stringify({
        sessionId: this.id
      }))
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
    return this.getState().config.sessionId
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
