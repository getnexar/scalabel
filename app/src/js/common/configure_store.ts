import { applyMiddleware, createStore, Middleware, Reducer, Store } from 'redux'
import undoable, { includeAction, StateWithHistory } from 'redux-undo'
import {
// SAT specific actions
  ADD_LABEL,
  DELETE_LABEL,
  IMAGE_ZOOM,
  TAG_IMAGE
} from '../action/types'
import { makeState } from '../functional/states'
import { State } from '../functional/types'
import { reducer } from './reducer'

/**
 * Configure the main store for the state
 * @param {Partial<State>} json: initial state
 * @param {boolean} devMode: whether to turn on dev mode
 * @return {Store<StateWithHistory<State>>}
 */
export function configureStore (
    initialState: Partial<State>,
    devMode: boolean = false,
    middleware: Middleware): Store<StateWithHistory<State>> {
  const initialHistory = {
    past: Array<State>(),
    present: makeState(initialState),
    future: Array<State>()
  }

  const undoableReducer: Reducer<StateWithHistory<State>> = undoable(reducer, {
    limit: 20, // add a limit to history
    filter: includeAction([
      // undoable actions
      IMAGE_ZOOM,
      ADD_LABEL,
      DELETE_LABEL,
      TAG_IMAGE
    ]),
    debug: devMode
  })

  return createStore(
    undoableReducer,
    initialHistory,
    applyMiddleware(middleware)
  )
}
