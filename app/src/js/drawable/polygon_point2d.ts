import { Point2D } from './point2d'

enum PointType {
  vertex,
  mid,
  breizer
}

/** points2D for polygon */
export class PolygonPoint2D extends Point2D {

  /** point type */
  private _type: PointType

  constructor (
    x: number = 0, y: number = 0, type: PointType = PointType.vertex) {
    super(x, y)
    this._type = type
  }

  /** return  */
  public get type (): PointType {
    return this._type
  }
}
