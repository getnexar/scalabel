import Session from '../common/session'

/**
 * Static class for updating viewer config in response to UI events
 */
export default class ViewerConfigUpdater {
  /** The hashed list of keys currently down */
  private _keyDownMap: { [key: string]: boolean }
  /** Mouse x-coord */
  private _mX: number
  /** Mouse y-coord */
  private _mY: number
  /** Mouse x on down */
  private _downX: number
  /** Mouse y on down */
  private _downY: number
  /** Whether mouse is down */
  private _mouseDown: boolean

  constructor () {
    this._keyDownMap = {}
    this._mX = 0
    this._mY = 0
    this._downX = 0
    this._downY = 0
    this._mouseDown = false
  }

  /**
   * Handle mouse movement
   * @param e
   */
  public onMouseMove (e: MouseEvent) {
    const state = Session.getState()
    switch (state.task.config.itemType) {
      case 'image':
        break
      case 'pointcloud':
        break
    }
  }

  /**
   * Handle mouse down
   * @param e
   */
  public onMouseDown (e: MouseEvent) {
    const state = Session.getState()
    switch (state.task.config.itemType) {
      case 'image':
        break
      case 'pointcloud':
        break
    }
  }

  /**
   * Handle mouse up
   * @param e
   */
  public onMouseUp (e: MouseEvent) {
    const state = Session.getState()
    switch (state.task.config.itemType) {
      case 'image':
        break
      case 'pointcloud':
        break
    }
  }

  /**
   * Handle key down
   * @param e
   */
  public onKeyDown (e: KeyboardEvent) {
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
    const state = Session.getState()
    switch (state.task.config.itemType) {
      case 'image':
        break
      case 'pointcloud':
        break
    }
  }
}
