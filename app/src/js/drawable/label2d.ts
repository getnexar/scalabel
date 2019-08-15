import _ from 'lodash'
import { sprintf } from 'sprintf-js'
import Session from '../common/session'
import { LabelType, ShapeType, State } from '../functional/types'
import { Size2D } from '../math/size2d'
import { Vector2D } from '../math/vector2d'
import { Context2D, getColorById } from './util'

export enum DrawMode {
  VIEW,
  CONTROL
}

export interface ViewMode {
  /** whether the label is dimmed to show the other labels more clearly */
  dimmed: boolean
}

/**
 * Abstract class for 2D drawable labels
 */
export abstract class Label2D {
  /* The members are public for testing purpose */
  /** label id in state */
  protected _labelId: number
  /** index of the label */
  protected _index: number
  /** drawing order of the label */
  protected _order: number
  /** the corresponding label in the state */
  protected _label: LabelType | null
  /** drawing mode */
  protected _viewMode: ViewMode
  /** whether the label is selected */
  protected _selected: boolean
  /** -1 means no handle is selected */
  protected _selectedHandle: number
  /** whether the label is highlighted */
  protected _highlighted: boolean
  /** -1 means no handle is selected */
  protected _highlightedHandle: number
  /** rgba color decided by labelId */
  protected _color: number[]

  constructor () {
    this._index = -1
    this._labelId = -1
    this._selected = false
    this._selectedHandle = -1
    this._highlighted = false
    this._highlightedHandle = -1
    this._order = -1
    this._label = null
    this._color = [0, 0, 0, 1]
    this._viewMode = {
      dimmed: false
    }
  }

  /** Set whether the label is highlighted */
  public setViewMode (mode: Partial<ViewMode>): void {
    this._viewMode = _.assign(this._viewMode, mode)
  }

  /**
   * Set index of this label
   */
  public set index (i: number) {
    this._index = i
  }

  /** get index */
  public get index (): number {
    return this._index
  }

  /** get labelId */
  public get labelId (): number {
    return this._labelId
  }

  /** select the label */
  public setSelected (s: boolean, h: number = -1) {
    if (s && h < 0) {
      throw Error('need to select handle as well')
    }
    this._selected = s
    this._selectedHandle = h
  }

  /** highlight the label */
  public setHighlighted (h: boolean, handleIndex: number = -1) {
    if (h && handleIndex < 0) {
      throw Error('need to highlight handle as well')
    }
    this._highlighted = h
    this._highlightedHandle = handleIndex
  }

  /** return order of this label */
  public get order (): number {
    return this._order
  }

  /** set the order of this label */
  public set order (o: number) {
    this._order = o
  }

  /**
   * Draw the label on viewing or control convas
   * @param {Context2D} canvas
   * @param {number} ratio: display to image size ratio
   * @param {DrawMode} mode
   */
  public abstract draw (canvas: Context2D, ratio: number, mode: DrawMode): void

  /**
   * Draw the label tag on viewing or control convas
   * @param {Context2D} ctx
   * @param {[number, number]} position
   * @param {number} ratio
   * @param {number[]} fillStyle
   */
  public drawTag (ctx: Context2D,
                  ratio: number,
                  position: [number, number],
                  fillStyle: number[]
                  ) {
    const TAG_WIDTH = 25
    const TAG_HEIGHT = 14
    const [x, y] = position
    const self = this
    ctx.save()
    const config = Session.getState().config
    const category = self._label ?
    config.categories[self._label.category[0]] : ''
    const attributes = self._label ? self._label.attributes : {}
    const words = category.split(' ')
    let tw = TAG_WIDTH
    // abbreviate tag as the first 3 chars of the last word
    let abbr = words[words.length - 1].substring(0, 3)
    for (const attributeId of Object.keys(attributes)) {
      const attribute = config.attributes[Number(attributeId)]
      if (attribute.toolType === 'switch') {
        abbr += ',' + attribute.tagText
        tw += 18
      } else if (attribute.toolType === 'list') {
        if (attribute &&
          attributes[Number(attributeId)][0] > 0) {
          abbr += ',' + attribute.tagText + ':' +
              attribute.tagSuffixes[attributes[Number(attributeId)][0]]
          tw += 36
        }
      }
    }

    ctx.fillStyle = sprintf('rgb(%d, %d, %d)',
      fillStyle[0], fillStyle[1], fillStyle[2])
    ctx.fillRect(x * ratio, (y - TAG_HEIGHT) * ratio,
                 tw * ratio, TAG_HEIGHT * ratio)
    ctx.fillStyle = 'rgb(0,0,0)'
    ctx.font = sprintf('%dpx Verdana', 10 * ratio)
    ctx.fillText(abbr, (x + 3) * ratio, (y - 3) * ratio)
    ctx.restore()
  }

  /**
   * Drag the handle to a new position
   * @param {Vector2D} start: starting point of the drag
   * @param {Vector2D} delta: displacement
   * @param {Size2D} limit: limist of the canvas frame
   */
  public abstract drag (start: Vector2D, delta: Vector2D, limit: Size2D): void

  /**
   * Expand the primitive shapes to drawable shapes
   * @param {ShapeType[]} shapes
   */
  public abstract updateShapes (shapes: ShapeType[]): void

  /** Update the shapes of the label to the state */
  public abstract commitLabel (): void

  /**
   * Initialize this label to be temporary
   * @param {State} state
   * @param {number} itemIndex
   * @param {Vector2D} start: starting coordinate of the label
   */
  public abstract initTemp (
    state: State, start: Vector2D): void

  /** Convert label state to drawable */
  public updateState (
    state: State, itemIndex: number, labelId: number): void {
    const item = state.items[itemIndex]
    this._label = item.labels[labelId]
    this._order = this._label.order
    this._labelId = this._label.id
    this._color = getColorById(this._labelId)
    this.setSelected(labelId === state.current.label, 0)
    this.updateShapes(this._label.shapes.map((i) => item.shapes[i].shape))
  }
}

export default Label2D
