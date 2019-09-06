import { updateImageViewerConfig, zoomImage } from '../action/image'
import Session from '../common/session'
import { getCurrentItemViewerConfig } from '../functional/state_util'
import { ImageViewerConfigType } from '../functional/types'
import { SCROLL_ZOOM_RATIO } from '../helper/image'

/**
 * Static class for updating viewer config in response to UI events
 */

/**
 * Normalize mouse coordinates to make canvas left top origin
 * @param x
 * @param y
 * @param canvas
 */
function normalizeCoordinatesToCanvas (
  x: number, y: number, container: HTMLDivElement): number[] {
  return [
    x - container.getBoundingClientRect().left,
    y - container.getBoundingClientRect().top
  ]
}

/**
 * Class for managing viewer config
 */
export default class ViewerConfigUpdater {
  /** The hashed list of keys currently down */
  private _keyDownMap: { [key: string]: boolean }
  /** Mouse x-coord */
  private _mX: number
  /** Mouse y-coord */
  private _mY: number
  /** Whether mouse is down */
  private _mouseDown: boolean
  /** Display */
  private _container: HTMLDivElement | null

  constructor () {
    this._keyDownMap = {}
    this._mX = 0
    this._mY = 0
    this._container = null
    this._mouseDown = false
  }

  /**
   * Set container
   * @param container
   */
  public setContainer (container: HTMLDivElement) {
    this._container = container
  }

  /**
   * Handle mouse movement
   * @param e
   */
  public onMouseMove (e: MouseEvent) {
    if (!this._container) {
      return
    }
    const state = Session.getState()
    const normalized = normalizeCoordinatesToCanvas(
      e.clientX, e.clientY, this._container
    )
    if (this._mouseDown) {
      switch (state.task.config.itemType) {
        case 'image':
          if (this.isKeyDown('Control')) {
            const dx = normalized[0] - this._mX
            const dy = normalized[1] - this._mY
            const displayLeft = this._container.scrollLeft - dx
            const displayTop = this._container.scrollTop - dy
            Session.dispatch(updateImageViewerConfig({
              displayLeft, displayTop
            }))
          }
          break
        case 'pointcloud':
          break
      }
    }
    this._mX = normalized[0]
    this._mY = normalized[1]
  }

  /**
   * Handle mouse down
   * @param e
   */
  public onMouseDown (e: MouseEvent) {
    if (!this._container) {
      return
    }
    this._mouseDown = true
    const normalized = normalizeCoordinatesToCanvas(
      e.clientX, e.clientY, this._container
    )
    this._mX = normalized[0]
    this._mY = normalized[1]
  }

  /**
   * Handle mouse up
   * @param e
   */
  public onMouseUp (_e: MouseEvent) {
    this._mouseDown = false
  }

  /**
   * Handle mouse wheel
   * @param _e
   */
  public onMouseWheel (e: WheelEvent) {
    if (this.isKeyDown('Control')) { // control for zoom
      e.preventDefault()
      let zoomRatio = SCROLL_ZOOM_RATIO
      if (e.deltaY < 0) {
        zoomRatio = 1. / zoomRatio
      }
      const viewerConfig =
        getCurrentItemViewerConfig(Session.getState()) as ImageViewerConfigType
      const zoomAction = zoomImage(
        zoomRatio,
        viewerConfig
      )
      if (zoomAction) {
        Session.dispatch(zoomAction)
      }
    }
  }

  /**
   * Handle mouse leave
   * @param _e
   */
  public onMouseLeave (_e: MouseEvent) {
    return
  }

  /**
   * Handle Double Click
   * @param _e
   */
  public onDoubleClick (_e: MouseEvent) {
    return
  }

  /**
   * Handle key down
   * @param e
   */
  public onKeyDown (e: KeyboardEvent) {
    const key = e.key
    this._keyDownMap[key] = true
    const state = Session.getState()
    switch (state.task.config.itemType) {
      case 'image':
        break
      case 'pointcloud':
        break
    }
  }

  /**
   * Handle key up
   * @param e
   */
  public onKeyUp (e: KeyboardEvent) {
    const key = e.key
    delete this._keyDownMap[key]
  }

  /**
   * Whether a specific key is pressed down
   * @param {string} key - the key to check
   * @return {boolean}
   */
  private isKeyDown (key: string): boolean {
    return this._keyDownMap[key]
  }
}
