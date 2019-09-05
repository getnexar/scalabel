import Session from '../common/session'
import { ImageViewerConfigType } from '../functional/types'
import { Vector2D } from '../math/vector2d'
import { getVisibleCanvasCoords, toCanvasCoords } from '../view/image'
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

export function zoomImage (
  zoomRatio: number,
  offsetX: number,
  offsetY: number,
  display: HTMLDivElement,
  canvas: HTMLCanvasElement,
  config: ImageViewerConfigType,
  canvasWidth: number,
  canvasHeight: number,
  displayToImageRatio: number
) {
  const displayRect = display.getBoundingClientRect()
  // mouseOffset
  let mouseOffset
  let upperLeftCoords
  if (config.viewScale > 1.0) {
    upperLeftCoords = getVisibleCanvasCoords(display, canvas)
    if (offsetX < 0 || offsetY < 0) {
      mouseOffset = [
        Math.min(displayRect.width, canvas.width) / 2,
        Math.min(displayRect.height, canvas.height) / 2
      ]
    } else {
      mouseOffset = toCanvasCoords(
        new Vector2D(offsetX, offsetY),
        false,
        displayToImageRatio
      )
      mouseOffset[0] -= upperLeftCoords[0]
      mouseOffset[1] -= upperLeftCoords[1]
    }
  }

  // zoom to point
  let scrollLeft = display.scrollTop
  let scrollTop = display.scrollLeft
  // translate back to origin
  if (mouseOffset) {
    scrollTop = canvas.offsetTop
    scrollLeft = canvas.offsetLeft
  }

  if (mouseOffset && upperLeftCoords) {
    if (canvasWidth > displayRect.width) {
      scrollLeft =
        zoomRatio * (upperLeftCoords[0] + mouseOffset[0])
        - mouseOffset[0]
    }
    if (canvasHeight > displayRect.height) {
      scrollTop =
        zoomRatio * (upperLeftCoords[1] + mouseOffset[1])
        - mouseOffset[1]
    }
  }
  Session.dispatch(updateImageViewerConfig({
    viewScale: config.viewScale * zoomRatio,
    viewOffsetX: offsetX,
    viewOffsetY: offsetY,
    displayTop: scrollTop,
    displayLeft: scrollLeft
  }))
}
