import { EdgePoint2D } from './edge_point2d'
import { Context2D } from './util'

export interface Edge2DStyle {
  /** width of the line on drawing */
  lineWidth: number
  /** color of the line */
  color: number[]
  /** whether dashed */
  dashed: boolean
}

/**
 * Generate Edge2D style with default parameters
 * @param {Partial<Edge2DStyle>} style
 */
export function makeEdge2DStyle (
    style: Partial<Edge2DStyle> = {}): Edge2DStyle {
  return {
    lineWidth: 1,
    color: [0, 0, 0, 1],
    dashed: false,
    ...style
  }
}

export enum EdgeType {
  line,
  curve
}

/**
 * Drawable 2D Edge
 */
export class Edge2D {
  /** source of the edge */
  private _src: EdgePoint2D
  /** destination of the edge */
  private _dest: EdgePoint2D
  /** type of the edge */
  private _type: EdgeType
  /** control points of the edge */
  private _controlPoints: EdgePoint2D[]

  constructor (src: EdgePoint2D, dest: EdgePoint2D,
               type: EdgeType = EdgeType.line,
               _controlPoints: EdgePoint2D[] = []) {
    this._src = src
    this._dest = dest
    this._type = type
    this._controlPoints = _controlPoints
  }

  /** get and set source point */
  public get src (): EdgePoint2D {
    return this._src
  }

  public set src (s: EdgePoint2D) {
    this._src = s
  }

  /** get and set destination point */
  public get dest (): EdgePoint2D {
    return this._dest
  }

  public set dest (d: EdgePoint2D) {
    this._dest = d
  }

  /** get and set edge type */
  public get type (): EdgeType {
    return this._type
  }

  public set type (t: EdgeType) {
    this._type = t
  }

  /** get and set control points */
  public get control_point (): EdgePoint2D[] {
    return this._controlPoints
  }

  public set control_point (c: EdgePoint2D[]) {
    this._controlPoints = c
  }

  /**
   * Draw the edge on a 2D context
   * @param {Context2D} context
   * @param {number} ratio: display to image ratio
   * @param {RectStyle} style
   */
  public draw (
    context: Context2D, ratio: number, _style: Edge2DStyle): void {
    context.save()
    // convert to display resolution
    // const srcReal = this._src.clone().scale(ratio)
    const destReal = this._dest.clone().scale(ratio)

    // context.moveTo(srcReal.x, srcReal.y)
    // context.strokeStyle(_style)
    context.lineTo(destReal.x, destReal.y)
    // context.closePath()
    // context.fill()
    context.stroke()
    // context.restore()
  }
}
