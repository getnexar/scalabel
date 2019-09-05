import Session from '../common/session'
import { ImageViewerConfigType } from '../functional/types'
import * as types from './types'

/**
 * Update viewer config
 * @param newFields
 */
export function updateImageViewerConfig (
  newFields: Partial<ImageViewerConfigType>
): types.UpdateImageViewerConfigAction {
  return {
    type: types.UPDATE_IMAGE_VIEWER_CONFIG,
    sessionId: Session.id,
    newFields
  }
}
