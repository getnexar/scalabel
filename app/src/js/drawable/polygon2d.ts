import _ from 'lodash'
import { changeLabelShape } from '../action/common'
import { addPolygon2dLabel } from '../action/Polygon2d'
import * as labels from '../common/label_types'
import Session from '../common/session'
import { makeLabel, makePolygon } from '../functional/states'
import { PolygonType, ShapeType, State } from '../functional/types'
import { Size2D } from '../math/size2d'
import { Vector2D } from '../math/vector2d'
import { Edge2D } from './edge2d'
import { DrawMode, Label2D } from './label2d'
import { PolygonPoint2D } from './polygon_point2d'
import { makePoint2DStyle, Point2D } from './point2d'
import { Context2D } from './util'


// const DEFAULT_VIEW_EDGE_STYLE = makeEdge2DStyle({ lineWidth: 4 })
// const DEFAULT_VIEW_POINT_STYLE = makePoint2DStyle({ radius: 8 })
// const DEFAULT_VIEW_HIGH_POINT_STYLE = makePoint2DStyle({ radius: 12 })
// const DEFAULT_CONTROL_EDGE_STYLE = makeEdge2DStyle({ lineWidth: 10 })
// const DEFAULT_CONTROL_POINT_STYLE = makePoint2DStyle({ radius: 12 })

/** list all states */
enum Polygon2DState {
  Free,
  Draw,
  Reshape,
  Link
}

/**
 * polygon 2d label
 */
export class Polygon2D extends Label2D {
  /** array for vertices */
  private _points: PolygonPoint2D[]
  /** array for edges */
  private _edges: Edge2D[]
  /** polygon label state */
  private _state: Polygon2DState
  constructor () {
    super()
    this._points = []
    this._edges = []
    this._state = Polygon2DState.Free
  }

  /**
   * Draw the label on viewing or control canvas
   * @param _context
   * @param _ratio
   * @param _mode
   */
  public draw (_context: Context2D, _ratio: number, _mode: DrawMode): void {}

  /**
   * reshape the polygon
   * @param _end
   * @param _limit
   */
  public reshape (_end: Vector2D, _limit: Size2D): void {}

  /**
   * Move the polygon
   * @param _end
   * @param _limit
   */
  public move (_end: Vector2D, _limit: Size2D): void {}

  /**
   * Handle mouse down
   * @param coord
   */
  public onMouseDown (_coord: Vector2D): boolean { return true }

  /**
   * Handle mouse move
   * @param coord
   */
  public onMouseMove (_coord: Vector2D, _limit: Size2D): boolean {
    return true
  }

  /**
   * Handle mouse up
   * @param coord
   */
  public onMouseUp (_coord: Vector2D): boolean { return true }

  /**
   * finish one operation and whether add new label, save changes
   */
  public commitLabel (): boolean {
    return true
  }

  /**
   * create new polygon label
   * @param _state
   * @param _start
   */
  public initTemp (_state: State, _start: Vector2D): void {}

  /**
   * to update the shape of polygon
   * @param _shapes
   */
  public updateShapes (_shapes: ShapeType[]): void {}

  /**
   *  transfer point to edges
   * @param _poly
   */
  private _updateShapesValues (_poly: PolygonPoint2D[]): void {}
}
