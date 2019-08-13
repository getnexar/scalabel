import _ from 'lodash'
import { AnyAction, Dispatch, Middleware, Store } from 'redux'
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
  public websocket?: WebSocket
  /** Timestamped action log */
  public actionLog: AnyAction[]
  /** Middleware to use */
  public middleware: Middleware

  /**
   * no-op for state initialization
   */
  constructor () {
    this.images = []
    this.pointClouds = []
    this.itemType = ''
    // TODO: make it configurable in the url
    this.devMode = true

    // set up gateway
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        interface InitResponse {
          /** Address for websocket */
          Addr: string,
          /** Port for websocket */
          Port: string,
        }
        const data = JSON.parse(xhr.response) as InitResponse
        const addr = data.Addr
        const port = data.Port
        const websocket = new WebSocket(`ws://${addr}:${port}/register`)

        websocket.onmessage = (e) => {
          if (typeof e.data === 'string') {
            const response: AnyAction = JSON.parse(e.data)
            this.actionLog.push(response)
          }
        }
        this.websocket = websocket
      }
    }
    xhr.open('GET', './websocketInfo')
    xhr.send()

    /* sync on every action */
    this.middleware = () => (
      next: Dispatch
    ) => (action) => {
      if (this.websocket) {
        this.websocket.send(JSON.stringify(action))
      }
      return next(action)
    }

    this.store = configureStore({}, this.devMode, this.middleware)
    this.status = ConnectionStatus.UNSAVED
    this.actionLog = []
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
