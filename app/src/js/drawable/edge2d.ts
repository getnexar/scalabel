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

enum EdgeType {
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
  private _control_points: EdgePoint2D[]

  constructor (src: EdgePoint2D, dest: EdgePoint2D,
               type: EdgeType = EdgeType.line,
               _controlPoints: EdgePoint2D[] = []) {
    this._src = src
    this._dest = dest
    this._type = type
    this._control_points = _controlPoints
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
    const srcReal = this._src.clone().scale(ratio)
    const destReal = this._dest.clone().scale(ratio)

    context.moveTo(srcReal.x, srcReal.y)
    context.lineTo(destReal.x, destReal.y)
    context.closePath()
    context.fill()
    context.stroke()
    context.restore()
  }
}
