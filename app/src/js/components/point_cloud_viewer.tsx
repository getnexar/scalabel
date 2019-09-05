import createStyles from '@material-ui/core/styles/createStyles'
import { withStyles } from '@material-ui/core/styles/index'
import * as React from 'react'
import * as THREE from 'three'
import { dragCamera, moveBack, moveCameraAndTarget, moveDown, moveForward, moveLeft, moveRight, moveUp, rotateCamera, zoomCamera } from '../action/point_cloud'
import Session from '../common/session'
import { Label3DList } from '../drawable/label3d_list'
import { getCurrentItem, getCurrentItemViewerConfig, isItemLoaded } from '../functional/state_util'
import { PointCloudViewerConfigType, State } from '../functional/types'
import { Vector3D } from '../math/vector3d'
import { convertMouseToNDC, updateThreeCameraAndRenderer } from '../view/point_cloud'
import PlayerControl from './player_control'
import { Viewer } from './viewer'

const styles = () => createStyles({
  canvas: {
    position: 'absolute',
    height: '100%',
    width: '100%'
  },
  background_with_player_control: {
    display: 'block', height: '100%',
    position: 'absolute',
    outline: 'none', width: '100%', background: '#000000'
  }
})

interface ClassType {
  /** CSS canvas name */
  canvas: string
  /** background */
  background_with_player_control: string
}

interface Props {
  /** CSS class */
  classes: ClassType
}

/**
 * Normalize mouse coordinates to make canvas left top origin
 * @param x
 * @param y
 * @param canvas
 */
function normalizeCoordinatesToCanvas (
  x: number, y: number, canvas: HTMLCanvasElement): number[] {
  return [
    x - canvas.getBoundingClientRect().left,
    y - canvas.getBoundingClientRect().top
  ]
}

/**
 * Canvas Viewer
 */
class PointCloudViewer extends Viewer<Props> {
  /** Canvas to draw on */
  private canvas: HTMLCanvasElement | null
  /** ThreeJS Renderer */
  private renderer?: THREE.WebGLRenderer
  /** ThreeJS Scene object */
  private scene: THREE.Scene
  /** ThreeJS Camera */
  private camera: THREE.PerspectiveCamera
  /** ThreeJS sphere mesh for indicating camera target location */
  private target: THREE.Mesh
  /** Current point cloud for rendering */
  private pointCloud: THREE.Points | null
  /** ThreeJS raycaster */
  private raycaster: THREE.Raycaster
  /** Mouse click state */
  private mouseDown: boolean
  /** Mouse position */
  private mX: number
  /** Mouse position */
  private mY: number
  /** The hashed list of keys currently down */
  private _keyDownMap: { [key: string]: boolean }
  /** Modifier string 'Control' or 'Meta' */
  private _modifierString: string

  /** drawable label list */
  private _labels: Label3DList

  /** Ref Handler */
  private refInitializer:
    (component: HTMLCanvasElement | null) => void

  /** UI handler */
  private mouseDownHandler: (e: React.MouseEvent<HTMLCanvasElement>) => void
  /** UI handler */
  private mouseUpHandler: (e: React.MouseEvent<HTMLCanvasElement>) => void
  /** UI handler */
  private mouseMoveHandler: (e: React.MouseEvent<HTMLCanvasElement>) => void
  /** UI handler */
  private keyDownHandler: (e: KeyboardEvent) => void
  /** UI handler */
  private keyUpHandler: (e: KeyboardEvent) => void
  /** UI handler */
  private mouseWheelHandler: (e: React.WheelEvent<HTMLCanvasElement>) => void
  /** UI handler */
  private doubleClickHandler: () => void

  /**
   * Constructor, handles subscription to store
   * @param {Object} props: react props
   */
  constructor (props: Readonly<Props>) {
    super(props)
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    this.target = new THREE.Mesh(
      new THREE.SphereGeometry(0.03),
        new THREE.MeshBasicMaterial({
          color:
            0xffffff
        }))
    this.scene.add(this.target)

    this.raycaster = new THREE.Raycaster()
    this.raycaster.near = 1.0
    this.raycaster.far = 100.0

    this.pointCloud = null

    this.canvas = null

    this.mouseDown = false
    this.mX = 0
    this.mY = 0

    this._keyDownMap = {}

    if (navigator.appVersion.indexOf('Mac') === -1) {
      this._modifierString = 'Control'
    } else {
      this._modifierString = 'Meta'
    }

    this._labels = new Label3DList()

    this.refInitializer = this.initializeRefs.bind(this)

    this.mouseDownHandler = this.handleMouseDown.bind(this)
    this.mouseUpHandler = this.handleMouseUp.bind(this)
    this.mouseMoveHandler = this.handleMouseMove.bind(this)
    this.keyDownHandler = this.handleKeyDown.bind(this)
    this.keyUpHandler = this.handleKeyUp.bind(this)
    this.mouseWheelHandler = this.handleMouseWheel.bind(this)
    this.doubleClickHandler = this.handleDoubleClick.bind(this)

    document.onkeydown = this.keyDownHandler
    document.onkeyup = this.keyUpHandler
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  public render () {
    const playerControl = (<PlayerControl key='player-control'
        num_frames={Session.getState().task.items.length}
    />)
    const { classes } = this.props
    return (
      <div className={classes.background_with_player_control}>
        <canvas className={classes.canvas} ref={this.refInitializer}
          onMouseDown={this.mouseDownHandler} onMouseUp={this.mouseUpHandler}
          onMouseMove={this.mouseMoveHandler} onWheel={this.mouseWheelHandler}
          onDoubleClick={this.doubleClickHandler}
        />
        {playerControl}
      </div >
    )
  }

  /**
   * Handles canvas redraw
   * @return {boolean}
   */
  public redraw (): boolean {
    const state = this.state.session
    const item = state.user.select.item
    const loaded = state.session.items[item].loaded
    if (loaded) {
      if (this.canvas) {
        this.updateRenderer()
        this.pointCloud = Session.pointClouds[item]
        this.renderThree()
      }
    }
    return true
  }

  /**
   * notify state is updated
   */
  protected updateState (state: State): void {
    this._labels.updateState(state, state.user.select.item)
  }

  /**
   * Render ThreeJS Scene
   */
  private renderThree () {
    if (this.renderer && this.pointCloud) {
      this.scene.children = []
      this._labels.render(this.scene)
      this.scene.add(this.pointCloud)
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Handle mouse down
   * @param {React.MouseEvent<HTMLCanvasElement>} e
   */
  private handleMouseDown (e: React.MouseEvent<HTMLCanvasElement>) {
    e.stopPropagation()
    this.mouseDown = true
    this._labels.onMouseDown()
  }

  /**
   * Handle mouse up
   * @param {React.MouseEvent<HTMLCanvasElement>} e
   */
  private handleMouseUp (e: React.MouseEvent<HTMLCanvasElement>) {
    e.stopPropagation()
    this.mouseDown = false
    this._labels.onMouseUp()
  }

  /**
   * Handle mouse move
   * @param {React.MouseEvent<HTMLCanvasElement>} e
   */
  private handleMouseMove (e: React.MouseEvent<HTMLCanvasElement>) {
    e.stopPropagation()

    if (!this.canvas) {
      return
    }

    const normalized = normalizeCoordinatesToCanvas(
      e.clientX, e.clientY, this.canvas
    )

    const newX = normalized[0]
    const newY = normalized[1]

    const NDC = convertMouseToNDC(
      newX,
      newY,
      this.canvas
    )
    const x = NDC[0]
    const y = NDC[1]

    if (!this._labels.onMouseMove(x, y, this.camera, this.raycaster) &&
        this.mouseDown) {
      if (this._keyDownMap[this._modifierString]) {
        Session.dispatch(dragCamera(
          this.mX,
          this.mY,
          newX,
          newY,
          this.camera,
          this.getCurrentViewerConfig()
        ))
      } else {
        Session.dispatch(rotateCamera(
          this.mX,
          this.mY,
          newX,
          newY,
          this.getCurrentViewerConfig()
        ))
      }
    }

    this.renderThree()

    this.mX = newX
    this.mY = newY
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e
   */
  private handleKeyDown (e: KeyboardEvent) {
    const viewerConfig: PointCloudViewerConfigType =
      this.getCurrentViewerConfig()

    this._keyDownMap[e.key] = true

    switch (e.key) {
      case '.':
        Session.dispatch(moveUp(viewerConfig))
        break
      case '/':
        Session.dispatch(moveDown(viewerConfig))
        break
      case 'Down':
      case 'ArrowDown':
        Session.dispatch(moveBack(viewerConfig))
        break
      case 'Up':
      case 'ArrowUp':
        Session.dispatch(moveForward(viewerConfig))
        break
      case 'Left':
      case 'ArrowLeft':
        Session.dispatch(moveLeft(viewerConfig))
        break
      case 'Right':
      case 'ArrowRight':
        Session.dispatch(moveRight(viewerConfig))
        break
    }
    if (this._labels.onKeyDown(e)) {
      this.renderThree()
    }
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} e
   */
  private handleKeyUp (e: KeyboardEvent) {
    if (this._labels.onKeyUp()) {
      this.renderThree()
    }
    delete this._keyDownMap[e.key]
  }

  /**
   * Handle mouse wheel
   * @param {React.WheelEvent<HTMLCanvasElement>} e
   */
  private handleMouseWheel (e: React.WheelEvent<HTMLCanvasElement>) {
    const viewerConfig: PointCloudViewerConfigType =
      this.getCurrentViewerConfig()
    const zoomAction = zoomCamera(viewerConfig, e.deltaY)
    if (zoomAction) {
      Session.dispatch(zoomAction)
    }
  }

  /**
   * Handle double click
   */
  private handleDoubleClick () {
    if (this.canvas && !this._labels.onDoubleClick()) {
      const NDC = convertMouseToNDC(
        this.mX,
        this.mY,
        this.canvas
      )
      const x = NDC[0]
      const y = NDC[1]

      this.raycaster.linePrecision = 0.2
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)
      const item = getCurrentItem(this.state.session)
      const pointCloud = Session.pointClouds[item.index]

      const intersects = this.raycaster.intersectObject(pointCloud)

      if (intersects.length > 0) {
        const newTarget = intersects[0].point
        const viewerConfig: PointCloudViewerConfigType =
          this.getCurrentViewerConfig()
        Session.dispatch(moveCameraAndTarget(
          new Vector3D(
            viewerConfig.position.x - viewerConfig.target.x + newTarget.x,
            viewerConfig.position.y - viewerConfig.target.y + newTarget.y,
            viewerConfig.position.z - viewerConfig.target.z + newTarget.z
          ),
          new Vector3D(
            newTarget.x,
            newTarget.y,
            newTarget.z
          )
        ))
      }
    }
  }

  /**
   * Set references to div elements and try to initialize renderer
   * @param {HTMLDivElement} component
   * @param {string} componentType
   */
  private initializeRefs (component: HTMLCanvasElement | null) {
    if (!component) {
      return
    }

    if (component.nodeName === 'CANVAS') {
      this.canvas = component
    }

    if (this.canvas) {
      const rendererParams = { canvas: this.canvas }
      this.renderer = new THREE.WebGLRenderer(rendererParams)
      if (isItemLoaded(this.state.session)) {
        this.updateRenderer()
      }
    }
  }

  /**
   * Update rendering constants
   */
  private updateRenderer () {
    if (this.canvas && this.renderer) {
      const config: PointCloudViewerConfigType = this.getCurrentViewerConfig()
      updateThreeCameraAndRenderer(
        this.canvas,
        config,
        this.renderer,
        this.camera,
        this.target
      )
    }
  }

  /**
   * Get point cloud view config
   */
  private getCurrentViewerConfig (): PointCloudViewerConfigType {
    return (getCurrentItemViewerConfig(this.state.session) as
      PointCloudViewerConfigType)
  }
}

export default withStyles(styles, { withTheme: true })(PointCloudViewer)
