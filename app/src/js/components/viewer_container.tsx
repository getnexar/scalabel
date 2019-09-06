// tslint:disable:no-any
// TODO: remove the disable tag
import React from 'react'
import Session from '../common/session'
import { getCurrentItemViewerConfig } from '../functional/state_util'
import { ImageViewerConfigType } from '../functional/types'
import ViewerConfigUpdater from '../helper/viewer_config'
import MouseEventListeners from './mouse_event_listeners'

interface Props {
  /** Views */
  views: any[]
}

/**
 * Canvas Viewer
 */
class ViewerContainer extends React.Component<Props> {
  /** Topmost div */
  private divRef?: any
  /** Moveable container */
  private _container: HTMLDivElement | null
  /** Manage viewer config */
  private _viewerConfigUpdater: ViewerConfigUpdater

  /** UI handler */
  private _mouseDownHandler: (e: MouseEvent) => void
  /** UI handler */
  private _mouseUpHandler: (e: MouseEvent) => void
  /** UI handler */
  private _mouseMoveHandler: (e: MouseEvent) => void
  /** UI handler */
  private _mouseLeaveHandler: (e: MouseEvent) => void
  /** UI handler */
  private _doubleClickHandler: (e: MouseEvent) => void
  /** UI handler */
  private _wheelHandler: (e: WheelEvent) => void
  /** UI handler */
  private _keyDownHandler: (e: KeyboardEvent) => void
  /** UI handler */
  private _keyUpHandler: (e: KeyboardEvent) => void

  /**
   * Constructor
   * @param {Object} props: react props
   */
  constructor (props: any) {
    super(props)
    this._container = null
    this._viewerConfigUpdater = new ViewerConfigUpdater()
    this._mouseDownHandler =
      this._viewerConfigUpdater.onMouseDown.bind(this._viewerConfigUpdater)
    this._mouseUpHandler =
      this._viewerConfigUpdater.onMouseUp.bind(this._viewerConfigUpdater)
    this._mouseMoveHandler =
      this._viewerConfigUpdater.onMouseMove.bind(this._viewerConfigUpdater)
    this._mouseLeaveHandler =
      this._viewerConfigUpdater.onMouseLeave.bind(this._viewerConfigUpdater)
    this._doubleClickHandler =
      this._viewerConfigUpdater.onDoubleClick.bind(this._viewerConfigUpdater)
    this._wheelHandler =
      this._viewerConfigUpdater.onMouseWheel.bind(this._viewerConfigUpdater)
    this._keyDownHandler =
      this._viewerConfigUpdater.onKeyDown.bind(this._viewerConfigUpdater)
    this._keyUpHandler =
      this._viewerConfigUpdater.onKeyUp.bind(this._viewerConfigUpdater)
  }

  /**
   * Run when component mounts
   */
  public componentDidMount () {
    document.addEventListener('keydown', this._keyDownHandler)
    document.addEventListener('keyup', this._keyUpHandler)
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  public render () {
    let rectDiv: any
    if (this.divRef) {
      rectDiv = this.divRef.getBoundingClientRect()
    }

    const { views } = this.props
    let viewsWithProps = views
    if (rectDiv) {
      viewsWithProps = React.Children.map(views, (view) => {
        if (rectDiv) {
          return React.cloneElement(view,
            { height: rectDiv.height, width: rectDiv.width })
        } else {
          return React.cloneElement(view, {})
        }
      }
      )
    }

    return (
        <div
          ref={(element) => {
            if (element) {
              this.divRef = element
            }
          }}
          style={{
            display: 'block', height: '100%',
            position: 'absolute',
            outline: 'none', width: '100%', background: '#222222'
          }}
        >
          <div
            ref={(element) => {
              if (element) {
                this._container = element
                this._viewerConfigUpdater.setContainer(this._container)
                const state = Session.getState()
                const config =
                  getCurrentItemViewerConfig(state) as ImageViewerConfigType
                this._container.scrollTop = config.displayTop
                this._container.scrollLeft = config.displayLeft
              }
            }}
            style={{
              display: 'block',
              height: 'calc(100% - 20px)',
              top: '10px', left: '10px',
              position: 'absolute', overflow: 'scroll',
              outline: 'none',
              width: 'calc(100% - 20px)'
            }}
          >
            <MouseEventListeners
              onMouseDown={this._mouseDownHandler}
              onMouseMove={this._mouseMoveHandler}
              onMouseUp={this._mouseUpHandler}
              onMouseLeave={this._mouseLeaveHandler}
              onDblClick={this._doubleClickHandler}
              onWheel={this._wheelHandler}
            />
            {viewsWithProps}
          </div>
        </div >
    )
  }
}

export default ViewerContainer
