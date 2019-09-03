import _ from 'lodash'
import { changeLabelShape } from '../action/common'
import { addPolygon2dLabel } from '../action/Polygon2d'
import * as labels from '../common/label_types'
import Session from '../common/session'
import { makeLabel, makePolygon } from '../functional/states'
import { PolygonType, ShapeType, State } from '../functional/types'
import { Size2D } from '../math/size2d'
import { Vector2D } from '../math/vector2d'
import { Edge2D, makeEdge2DStyle } from './edge2d'
import { DrawMode, Label2D } from './label2d'
import { makePoint2DStyle, Point2D } from './point2d'
import { blendColor, Context2D, encodeControlColor, getColorById } from './util'

// type Shape = Poly2D | Point2D

const DEFAULT_VIEW_EDGE_STYLE = makeEdge2DStyle({ lineWidth: 4 })
const DEFAULT_VIEW_POINT_STYLE = makePoint2DStyle({ radius: 8 })
const DEFAULT_VIEW_HIGH_POINT_STYLE = makePoint2DStyle({ radius: 12 })
const DEFAULT_CONTROL_EDGE_STYLE = makeEdge2DStyle({ lineWidth: 10 })
const DEFAULT_CONTROL_POINT_STYLE = makePoint2DStyle({ radius: 12 })

/** list all states */
enum Polygon2DState {
  Free,
  Draw,
  Reshape,
  Link
}

export class Polygon2D extends Label2D {
  // private _shapes: Shape[]
  private vertices: Point2D[]
  private edges: Edge2D[]
  // private _closed: boolean
  private state: Polygon2DState
  constructor () {
    super()
    this.vertices = []
    this.edges = []
    this.state = Polygon2DState.Free
  }

   /** replace with get vertex edge state*/
  // public get shapes (): Array<Readonly<Shape>> {
  //   return this._shapes
  // }

  public draw (context: Context2D, ratio: number, mode: DrawMode): void {
    const self = this

    let pointStyle = makePoint2DStyle()
    let highPointStyle = makePoint2DStyle()
    let edgeStyle = makeEdge2DStyle()
    let assignColor: (i: number) => number[] = () => [0]

    switch (mode) {
      case DrawMode.VIEW:
        pointStyle = _.assign(pointStyle, DEFAULT_VIEW_POINT_STYLE)
        highPointStyle = _.assign(highPointStyle, DEFAULT_VIEW_HIGH_POINT_STYLE)
        edgeStyle = _.assign(edgeStyle, DEFAULT_VIEW_EDGE_STYLE)

        assignColor = (i: number): number[] => {
          if (i % 2 === 0 && i > 0) {
            return blendColor(self._color, [255, 255, 255], 0.7)
          } else {
            return self._color
          }
        }
        break
      case DrawMode.CONTROL:
        pointStyle = _.assign(pointStyle, DEFAULT_CONTROL_POINT_STYLE)
        highPointStyle = _.assign(highPointStyle, DEFAULT_CONTROL_POINT_STYLE)
        edgeStyle = _.assign(edgeStyle, DEFAULT_CONTROL_EDGE_STYLE)
        assignColor = (i: number): number[] => {
          return encodeControlColor(self._index, i)
        }
        break
    }

    edgeStyle.color = assignColor(0)
    for (const edge of this.edges) {
      edge.draw(context, ratio, edgeStyle)
    }

    // const poly = self._shapes[0]
    // edgeStyle.color = assignColor(0)
    // poly.draw(context, ratio, polyStyle)
    /**control free  */
    if (mode === DrawMode.CONTROL || this._selected || this._highlighted) {
      for (let i = 0; i < this.vertices.length; ++i) {
        const style = highPointStyle
        style.color = assignColor(i)
        this.vertices[i].draw(context, ratio, style)
      }

      // for (let i = 1; i <= 8; i += 1) {
      //   let style
      //   if (i === self._highlightedHandle) {
      //     style = highPointStyle
      //   }
      //   else {
      //     style = pointStyle
      //   }
      //   style.color = assignColor(i)
      //   const point = self._shapes[i] as Point2D
      //   point.draw(context, ratio, style)
      // }
    }
  }

  public resize (_start: Vector2D, _end: Vector2D, _limit: Size2D): void {}

  public move (_start: Vector2D, _end: Vector2D, _limit: Size2D): void {}

  public drag (_start: Vector2D, _end: Vector2D, _limit: Size2D): void {}

  /**finish one operation and whether add new label, save changes*/
  public commitLabel (): void {
    // if (this._label !== null) {
    //   if (this._labelId < 0) {
    //     const r = this.toPoly()
    //     Session.dispatch(addPolygon2dLabel(
    //       this._label.item, this._label.category, r.x1, r.y1, r.x2, r.y2, r.x3, r.y3, r.x4, r.y4
    //     ))
    //   }
    //   else {
    //     Session.dispatch(changeLabelShape(
    //       this._label.item, this._label.shapes[0], this.toPoly()
    //     ))
    //   }
    // }
  }

 /** for updateshapes */
  public initTemp (_state: State, _start: Vector2D): void {
    // const itemIndex = state.current.item
    // this._order = state.current.maxOrder + 1
    // this._label = makeLabel({
    //   type: labels.POLYGON_2D, id: -1, item: itemIndex,
    //   category: [state.current.category],
    //   order: this._order // ????
    // })
    // this._labelId = -1
    // this._color = getColorById(state.current.maxLabelId + 1)
    // // const poly = makePolygon({ x1: start.x, y1: start.y, x2: 0, y2: 0, x3: 0, y3: 0, x4: 0, y4: 0 })
    // // this.updateShapes([poly])
    // this.setSelected(true, 5) // ????
  }

  // public toPoly (): Polygon2D {
  //   return (this._shapes[0] as Polygon2D).toPoly()
  // }

  public updateShapes (_shapes: ShapeType[]): void {
    // if (this._label !== null) {
    //   const poly = shapes[0] as PolyType
    //   if (!_.isEqual(this.toPoly, poly)) {
    //     this.updateShapesValues(poly)
    //   }
    // }
  }

  private updateShapesValues (_poly: PolygonType): void {
  //   const [poly2d, tl, tm, tr, rm, br, bm, bl, lm] = this._shapes
  //   const x1 = poly.x1
  //   const y1 = poly.y1
  //   const x2 = poly.x2
  //   const y2 = poly.y2
  //   const x3 = poly.x3
  //   const y3 = poly.y3
  //   const x4 = poly.x4
  //   const y4 = poly.y4

  //   poly2d.set(x1, y1, x2, y2, x3, y3, x4, y4)

  //   tl.set(x1, y1)
  //   tr.set(x2, y2)
  //   bl.set(x3, y3)
  //   br.set(x4, y4)

  //   tm.set((x1 + x2) / 2, (y1 + y2) / 2)
  //   bm.set((x3 + x4) / 2, (y3 + y4) / 2)
  //   lm.set((x1 + x3) / 2, (y1 + y3) / 2)
  //   rm.set((x2 + x4) / 2, (y2 + y4) / 2)
  }
}

