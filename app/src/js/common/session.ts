import _ from 'lodash'
import { Dispatch, Middleware, Store } from 'redux'
import { StateWithHistory } from 'redux-undo'
import * as THREE from 'three'
import * as types from '../action/types'
import { Window } from '../components/window'
import { State } from '../functional/types'
import { configureStore } from './configure_store'
import { Synchronizer } from './synchronizer'
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
  /** Synchronizer created if sync enabled **/
  public synchronizer?: Synchronizer
  /** Middleware that does nothing */
  public nullMiddleware: Middleware
  /** Overwriteable function that adds side effects to state change */
  public applyStatusEffects: () => void

  /**
   * no-op for state initialization
   */
  constructor () {
    this.images = []
    this.pointClouds = []
    this.itemType = ''
    this.status = ConnectionStatus.UNSAVED
    // TODO: make it configurable in the url
    this.devMode = true
    this.applyStatusEffects = () => {}
    const self = this
    this.updateStatusDisplay = (newStatus: ConnectionStatus) => {
      self.status = newStatus
      self.applyStatusEffects()
      return newStatus
    }
    this.nullMiddleware = () => (
      next: Dispatch
    ) => (action) => {
      return next(action)
    }
    this.store = configureStore({}, this.devMode, this.nullMiddleware)
  }

  /**
   * Starts  state synchronization
   */
  public initSynchronizer () {
    const self = this
    this.synchronizer = new Synchronizer(
      () => { return self.id },
      this.getState().task.config.taskId,
      this.updateStatusDisplay,
      this.dispatch
    )
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

  /**
   * Get the middleware the session should apply to the store
   */
  public get middleware (): Middleware {
    if (this.synchronizer != undefined) {
      return this.synchronizer.middleware
    } else {
      return this.nullMiddleware
    }
  }

  /**
   * Applies a side effect, like updating a component,
   * When the status is updated
   */
   public addStatusEffect(callback: () => void) {
     var oldApplyEffects = this.applyStatusEffects
     this.applyStatusEffects = () => {
       oldApplyEffects()
       callback()
     }
   }
}

export default new Session()
