import { withStyles } from '@material-ui/core/styles'
import * as React from 'react'
import { updateImageViewerConfig } from '../action/image'
import Session from '../common/session'
import { Label2DList } from '../drawable/label2d_list'
import { getCurrentItemViewerConfig, isItemLoaded } from '../functional/state_util'
import { ImageViewerConfigType, State } from '../functional/types'
import { Vector2D } from '../math/vector2d'
import { imageViewStyle } from '../styles/label'
import {
  clearCanvas,
  drawImageOnCanvas,
  getCurrentImageSize,
  getVisibleCanvasCoords,
  imageDataToHandleId,
  MAX_SCALE,
  MIN_SCALE,
  normalizeMouseCoordinates,
  SCROLL_ZOOM_RATIO,
  toCanvasCoords,
  UP_RES_RATIO,
  updateCanvasScale,
  ZOOM_RATIO
} from '../view/image'
import MouseEventListeners from './mouse_event_listeners'
import PlayerControl from './player_control'
import { Viewer } from './viewer'

interface ClassType {
  /** image canvas */
  image_canvas: string
  /** label canvas */
  label_canvas: string
  /** control canvas */
  control_canvas: string
  /** image display area */
  display: string
  /** background */
  background: string
  /** background */
  background_with_player_control: string
}

interface Props {
  /** styles */
  classes: ClassType
}

/**
 * Canvas Viewer
 */
export class ImageView extends Viewer<Props> {
  /** The image context */
  public imageContext: CanvasRenderingContext2D | null
  /** The label context */
  public labelContext: CanvasRenderingContext2D | null
  /** The control context */
  public controlContext: CanvasRenderingContext2D | null

  /** drawable label list */
  private _labels: Label2DList
  /** The image canvas */
  private imageCanvas: HTMLCanvasElement | null
  /** The label canvas */
  private labelCanvas: HTMLCanvasElement | null
  /** The control canvas */
  private controlCanvas: HTMLCanvasElement | null
  /** The mask to hold the display */
  private display: HTMLDivElement | null
  /** The mask to hold the background */
  private background: HTMLDivElement | null

  // display variables
  /** The current scale */
  private scale: number
  /** The canvas height */
  private canvasHeight: number
  /** The canvas width */
  private canvasWidth: number
  /** The scale between the display and image data */
  private displayToImageRatio: number

  // keyboard and mouse status
  /** The hashed list of keys currently down */
  private _keyDownMap: { [key: string]: boolean }

  // scrolling
  /** The timer for scrolling */
  private scrollTimer: number | undefined

  // grabbing
  /** Whether or not the mouse is currently grabbing the image */
  private _isGrabbingImage: boolean
  /** The x coordinate when the grab starts */
  private _startGrabX: number
  /** The y coordinate when the grab starts */
  private _startGrabY: number
  /** The visible coordinates when the grab starts */
  private _startGrabVisibleCoords: number[]

  /**
   * Constructor, handles subscription to store
   * @param {Object} props: react props
   */
  constructor (props: Readonly<Props>) {
    super(props)

    // constants

    // initialization
    this._keyDownMap = {}
    this._isGrabbingImage = false
    this._startGrabX = -1
    this._startGrabY = -1
    this._startGrabVisibleCoords = []
    this.scale = 1
    this.canvasHeight = 0
    this.canvasWidth = 0
    this.displayToImageRatio = 1
    this.scrollTimer = undefined
    this.imageContext = null
    this.imageCanvas = null
    this.controlContext = null
    this.controlCanvas = null
    this.labelContext = null
    this.labelCanvas = null
    this.display = null
    this.background = null

    // set keyboard listeners
    document.onkeydown = this.onKeyDown.bind(this)
    document.onkeyup = this.onKeyUp.bind(this)

    this._labels = new Label2DList()
  }

  /**
   * Set the current cursor
   * @param {string} cursor - cursor type
   */
  public setCursor (cursor: string) {
    if (this.labelCanvas !== null) {
      this.labelCanvas.style.cursor = cursor
    }
  }

  /**
   * Set the current cursor to default
   */
  public setDefaultCursor () {
    this.setCursor('crosshair')
  }

  /**
   * Handler for zooming
   * @param {number} zoomRatio - the zoom ratio
   * @param {number} offsetX - the offset of x for zooming to cursor
   * @param {number} offsetY - the offset of y for zooming to cursor
   */
  public zoomHandler (zoomRatio: number,
                      offsetX: number, offsetY: number) {
    const viewerConfig =
      getCurrentItemViewerConfig(Session.getState()) as ImageViewerConfigType
    const newScale = viewerConfig.viewScale * zoomRatio
    if (newScale >= MIN_SCALE && newScale <= MAX_SCALE &&
        this.display && this.imageCanvas) {
      const state = Session.getState()
      const displayRect = this.display.getBoundingClientRect()
      const config =
      getCurrentItemViewerConfig(state) as ImageViewerConfigType
      // mouseOffset
      let mouseOffset
      let upperLeftCoords
      if (config.viewScale > 1.0) {
        upperLeftCoords = getVisibleCanvasCoords(this.display, this.imageCanvas)
        if (config.viewOffsetX < 0 || config.viewOffsetY < 0) {
          mouseOffset = [
            Math.min(displayRect.width, this.imageCanvas.width) / 2,
            Math.min(displayRect.height, this.imageCanvas.height) / 2
          ]
        } else {
          mouseOffset = toCanvasCoords(
            new Vector2D(config.viewOffsetX, config.viewOffsetY),
            false,
            this.displayToImageRatio
          )
          mouseOffset[0] -= upperLeftCoords[0]
          mouseOffset[1] -= upperLeftCoords[1]
        }
      }

      // zoom to point
      let scrollLeft = this.display.scrollTop
      let scrollTop = this.display.scrollLeft
      // translate back to origin
      if (mouseOffset) {
        scrollTop = this.imageCanvas.offsetTop
        scrollLeft = this.imageCanvas.offsetLeft
      }

      if (mouseOffset && upperLeftCoords) {
        if (this.canvasWidth > displayRect.width) {
          scrollLeft =
            zoomRatio * (upperLeftCoords[0] + mouseOffset[0])
            - mouseOffset[0]
        }
        if (this.canvasHeight > displayRect.height) {
          scrollTop =
            zoomRatio * (upperLeftCoords[1] + mouseOffset[1])
            - mouseOffset[1]
        }
      }
      Session.dispatch(updateImageViewerConfig({
        viewScale: newScale,
        viewOffsetX: offsetX,
        viewOffsetY: offsetY,
        displayTop: scrollTop,
        displayLeft: scrollLeft
      }))
    }
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  public render () {
    const { classes } = this.props
    const controlCanvas = (<canvas
      key='control-canvas'
      className={classes.control_canvas}
      ref={(canvas) => {
        if (canvas && this.display) {
          this.controlCanvas = canvas
          this.controlContext = canvas.getContext('2d')
          const displayRect =
            this.display.getBoundingClientRect()
          if (displayRect.width
            && displayRect.height
            && this.currentItemIsLoaded()
            && this.controlContext) {
            this.updateScale(this.controlCanvas, this.controlContext, true)
          }
        }
      }}
    />)
    const labelCanvas = (<canvas
      key='label-canvas'
      className={classes.label_canvas}
      ref={(canvas) => {
        if (canvas && this.display) {
          this.labelCanvas = canvas
          this.labelContext = canvas.getContext('2d')
          const displayRect =
            this.display.getBoundingClientRect()
          if (displayRect.width
            && displayRect.height
            && this.currentItemIsLoaded()
            && this.labelContext) {
            this.updateScale(this.labelCanvas, this.labelContext, true)
          }
        }
      }}
    />)
    const imageCanvas = (<canvas
      key='image-canvas'
      className={classes.image_canvas}
      ref={(canvas) => {
        if (canvas && this.display) {
          this.imageCanvas = canvas
          this.imageContext = canvas.getContext('2d')
          const displayRect =
            this.display.getBoundingClientRect()
          if (displayRect.width
            && displayRect.height
            && this.currentItemIsLoaded()
            && this.imageContext) {
            this.updateScale(this.imageCanvas, this.imageContext, true)
          }
        }
      }}
    />)

    const playerControl = (<PlayerControl key='player-control'
      num_frames={Session.getState().task.items.length}
    />)
    let canvasesWithProps
    if (this.display) {
      const displayRect = this.display.getBoundingClientRect()
      canvasesWithProps = React.Children.map(
        [imageCanvas, controlCanvas, labelCanvas], (canvas) => {
          return React.cloneElement(canvas,
            { height: displayRect.height, width: displayRect.width })
        }
      )
    }

    return (
      <div className={classes.background_with_player_control}>
        <div ref={(element) => {
          if (element) {
            this.background = element
          }
        }} className={classes.background}>
          <MouseEventListeners
            onMouseDown={this.onMouseDown.bind(this)}
            onMouseMove={this.onMouseMove.bind(this)}
            onMouseUp={this.onMouseUp.bind(this)}
            onMouseLeave={this.onMouseLeave.bind(this)}
            onDblClick={this.onDblClick.bind(this)}
            onWheel={this.onWheel.bind(this)}
          />
          <div ref={(element) => {
            if (element) {
              this.display = element
              const state = Session.getState()
              const config =
                getCurrentItemViewerConfig(state) as ImageViewerConfigType
              this.display.scrollTop = config.displayTop
              this.display.scrollLeft = config.displayLeft
            }
          }}
            className={classes.display}
          >
            {canvasesWithProps}
          </div>
        </div>
        {playerControl}
      </div>
    )
  }

  /**
   * Function to redraw all canvases
   * @return {boolean}
   */
  public redraw (): boolean {
    // redraw imageCanvas
    if (this.currentItemIsLoaded()) {
      this.redrawImageCanvas()
    }
    this.redrawLabels()
    return true
  }

  /**
   * Function to redraw the image canvas
   */
  public redrawImageCanvas () {
    if (this.currentItemIsLoaded() && this.imageCanvas && this.imageContext) {
      const image = Session.images[this.state.session.user.select.item]
      // redraw imageCanvas
      drawImageOnCanvas(this.imageCanvas, this.imageContext, image)
    }
    return true
  }

  /**
   * Redraw the labels
   */
  public redrawLabels () {
    if (this.labelCanvas !== null && this.labelContext !== null &&
      this.controlCanvas !== null && this.controlContext !== null) {
      clearCanvas(this.labelCanvas, this.labelContext)
      clearCanvas(this.controlCanvas, this.controlContext)
      this._labels.redraw(this.labelContext, this.controlContext,
        this.displayToImageRatio * UP_RES_RATIO)
    }
  }

  /**
   * notify state is updated
   */
  protected updateState (state: State): void {
    this._labels.updateState(state, state.user.select.item)
  }

  /**
   * Get the mouse position on the canvas in the image coordinates.
   * @param {MouseEvent | WheelEvent} e: mouse event
   * @return {Vector2D}
   * mouse position (x,y) on the canvas
   */
  private getMousePos (e: MouseEvent | WheelEvent): Vector2D {
    if (this.display && this.imageCanvas) {
      return normalizeMouseCoordinates(
        this.display,
        this.imageCanvas,
        this.canvasWidth,
        this.canvasHeight,
        this.displayToImageRatio,
        e.clientX,
        e.clientY
      )
    }
    return new Vector2D(0, 0)
  }

  /**
   * Get the label under the mouse.
   * @param {Vector2D} mousePos: position of the mouse
   * @return {number[]}
   */
  private fetchHandleId (mousePos: Vector2D): number[] {
    if (this.controlContext) {
      const [x, y] = toCanvasCoords(mousePos, true, this.displayToImageRatio)
      const data = this.controlContext.getImageData(x, y, 4, 4).data
      return imageDataToHandleId(data)
    } else {
      return [-1, 0]
    }
  }

  /**
   * Whether or not the mouse event is within the frame
   */
  private isWithinFrame (e: MouseEvent) {
    if (this.background === null) {
      return false
    }
    const background = this.background.getBoundingClientRect()
    return e.x >= background.left && e.y >= background.top &&
      e.x <= background.left + background.width &&
      e.y <= background.top + background.height
  }

  /**
   * Callback function when mouse is down
   * @param {MouseEvent} e - event
   */
  private onMouseDown (e: MouseEvent) {
    if (!this.isWithinFrame(e) || e.button !== 0) {
      return
    }
    // Control + click for dragging
    if (this.isKeyDown('Control')) {
      if (this.display && this.imageCanvas) {
        const display = this.display.getBoundingClientRect()
        if (this.imageCanvas.width > display.width ||
          this.imageCanvas.height > display.height) {
          // if needed, start grabbing
          this.setCursor('grabbing')
          this._isGrabbingImage = true
          this._startGrabX = e.clientX
          this._startGrabY = e.clientY
          this._startGrabVisibleCoords =
            getVisibleCanvasCoords(this.display, this.imageCanvas)
        }
      }
    } else {
      // get mouse position in image coordinates
      const mousePos = this.getMousePos(e)
      const [labelIndex, handleIndex] = this.fetchHandleId(mousePos)
      this._labels.onMouseDown(mousePos, labelIndex, handleIndex)
    }
    this.redrawLabels()
  }

  /**
   * Callback function when mouse is up
   * @param {MouseEvent} e - event
   */
  private onMouseUp (e: MouseEvent) {
    if (!this.isWithinFrame(e) || e.button !== 0) {
      return
    }
    // get mouse position in image coordinates
    this._isGrabbingImage = false
    this._startGrabX = -1
    this._startGrabY = -1
    this._startGrabVisibleCoords = []

    const mousePos = this.getMousePos(e)
    const [labelIndex, handleIndex] = this.fetchHandleId(mousePos)
    this._labels.onMouseUp(mousePos, labelIndex, handleIndex)
    this.redrawLabels()
  }

  /**
   * Callback function when mouse leaves
   * @param {MouseEvent} e - event
   */
  private onMouseLeave (e: MouseEvent) {
    this._keyDownMap = {}
    this.onMouseUp(e)
  }

  /**
   * Callback function when mouse moves
   * @param {MouseEvent} e - event
   */
  private onMouseMove (e: MouseEvent) {
    if (!this.isWithinFrame(e)) {
      this.onMouseLeave(e)
      return
    }
    // TODO: update hovered label
    // grabbing image
    if (this.isKeyDown('Control')) {
      if (this._isGrabbingImage) {
        if (this.display) {
          this.setCursor('grabbing')
          const dx = e.clientX - this._startGrabX
          const dy = e.clientY - this._startGrabY
          const displayLeft = this._startGrabVisibleCoords[0] - dx
          const displayTop = this._startGrabVisibleCoords[1] - dy
          Session.dispatch(updateImageViewerConfig({ displayLeft, displayTop }))
        }
      } else {
        this.setCursor('grab')
      }
    } else {
      this.setDefaultCursor()
    }

    // update the currently hovered shape
    const mousePos = this.getMousePos(e)
    const [labelIndex, handleIndex] = this.fetchHandleId(mousePos)
    this._labels.onMouseMove(
      mousePos, getCurrentImageSize(), labelIndex, handleIndex)
    this.redrawLabels()
  }

  /**
   * Callback function for scrolling
   * @param {WheelEvent} e - event
   */
  private onWheel (e: WheelEvent) {
    if (!this.isWithinFrame(e)) {
      return
    }
    // get mouse position in image coordinates
    const mousePos = this.getMousePos(e)
    if (this.isKeyDown('Control')) { // control for zoom
      e.preventDefault()
      if (this.scrollTimer !== undefined) {
        clearTimeout(this.scrollTimer)
      }
      if (e.deltaY < 0) {
        this.zoomHandler(SCROLL_ZOOM_RATIO, mousePos[0], mousePos[1])
      } else if (e.deltaY > 0) {
        this.zoomHandler(
          1 / SCROLL_ZOOM_RATIO, mousePos[0], mousePos[1])
      }
      this.redraw()
    }
  }

  /**
   * Callback function when double click occurs
   * @param {MouseEvent} e - event
   */
  private onDblClick (e: MouseEvent) {
    // get mouse position in image coordinates
    // const mousePos = this.getMousePos(e)
    // label-specific handling of double click
    // this.getCurrentController().onDblClick(mousePos)
    if (!this.isWithinFrame(e)) {
      return
    }
  }

  /**
   * Callback function when key is down
   * @param {KeyboardEvent} e - event
   */
  private onKeyDown (e: KeyboardEvent) {
    const key = e.key
    this._keyDownMap[key] = true
    if (key === '+') {
      // + for zooming in
      this.zoomHandler(ZOOM_RATIO, -1, -1)
    } else if (key === '-') {
      // - for zooming out
      this.zoomHandler(1 / ZOOM_RATIO, -1, -1)
    }
  }

  /**
   * Callback function when key is up
   * @param {KeyboardEvent} e - event
   */
  private onKeyUp (e: KeyboardEvent) {
    const key = e.key
    delete this._keyDownMap[key]
    if (key === 'Control' || key === 'Meta') {
      // Control or command
      this.setDefaultCursor()
    }
  }

  /**
   * Whether a specific key is pressed down
   * @param {string} key - the key to check
   * @return {boolean}
   */
  private isKeyDown (key: string): boolean {
    return this._keyDownMap[key]
  }

  /**
   * Set the scale of the image in the display
   * @param {object} canvas
   * @param {boolean} upRes
   */
  private updateScale (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    upRes: boolean
  ) {
    if (!this.display) {
      return
    }
    const state = Session.getState()
    const config =
      getCurrentItemViewerConfig(state) as ImageViewerConfigType

    if (config.viewScale < MIN_SCALE || config.viewScale >= MAX_SCALE) {
      return
    }
    (
      [
        this.canvasWidth,
        this.canvasHeight,
        this.displayToImageRatio,
        this.scale
      ] =
      updateCanvasScale(
        this.display,
        canvas,
        context,
        config,
        config.viewScale / this.scale,
        upRes
      )
    )
  }

  /**
   * function to check if the current item is loaded
   * @return {boolean}
   */
  private currentItemIsLoaded (): boolean {
    return isItemLoaded(this.state.session)
  }
}

export default withStyles(imageViewStyle, { withTheme: true })(ImageView)
