import { Vector2D } from '../math/vector2d'
import { Context2D } from './util'

export interface Edge2DStyle {
  lineWidth: number
  color: number[]
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

/**
 * Drawable 2D Edge
 */
export class Edge2D {
  private _src: Vector2D
  private _dest: Vector2D
  private _type: string
  private _control_points: []
  constructor (src: Vector2D, dest: Vector2D, type: string = '',
               controlPoints: [] = []) {
    this._src = src
    this._dest = dest
    this._type = type
    this._control_points = []
  }

  /**
   * Draw the edge on a 2D context
   * @param {Context2D} context
   * @param {number} ratio: display to image ratio
   * @param {RectStyle} style
   */
  public draw (
    context: Context2D, ratio: number, style: Edge2DStyle): void {
    context.save()
    // convert to display resolution
    const src_real = this._src.clone().scale(ratio)
    const dest_real = this._dest.clone().scale(ratio)

    context.moveTo(src_real.x, src_real.y)
    context.lineTo(dest_real.x, dest_real.y)
    context.closePath()
    context.fill()
    context.stroke()
    context.restore()
  }
}
