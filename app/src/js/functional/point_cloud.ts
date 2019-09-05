import _ from 'lodash'
import * as types from '../action/types'
import {getCurrentItemViewerConfig,
  setCurrentItemViewerConfig} from './state_util'
import { State } from './types'
import { updateObject } from './util'

/**
 * Move camera and target position
 * @param {State} state: Current state
 * @param {action: types.MoveCameraAndTargetAction} action
 * @return {State}
 */
export function moveCameraAndTarget (
  state: State, action: types.UpdatePointCloudViewerConfigAction): State {
  let config = getCurrentItemViewerConfig(state)
  config = updateObject(
    config, action.newFields)
  return setCurrentItemViewerConfig(state, config)
}
