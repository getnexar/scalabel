import {RectType, ShapeType, VertexType} from './types';
import {VertexTypes} from './states';
import {sprintf} from 'sprintf-js';

/**
 * Drawing Utilities
 */
export const HOVERED_HANDLE_RADIUS = 12;
export const CONTROL_LINE_WIDTH = 10;
export const HANDLE_RADIUS = 8;
export const CONTROL_HANDLE_RADIUS = 12;

export const LINE_WIDTH = 4;
export const OUTLINE_WIDTH = 4;

export const BEZIER_COLOR = [200, 200, 100];
export const GRAYOUT_COLOR = [169, 169, 169];
export const SELECT_COLOR = [100, 0, 100];
export const CONTROL_FILL_COLOR = [255, 255, 255];
export const CONTROL_LINE_COLOR = [0, 0, 0];

export const ALPHA_HIGH_FILL = 0.5;
export const ALPHA_LOW_FILL = 0.3;
export const ALPHA_LINE = 1.0;
export const ALPHA_CONTROL_POINT = 0.5;

// color palette
const COLOR_PALETTE = [
  [31, 119, 180],
  [174, 199, 232],
  [255, 127, 14],
  [255, 187, 120],
  [44, 160, 44],
  [152, 223, 138],
  [214, 39, 40],
  [255, 152, 150],
  [148, 103, 189],
  [197, 176, 213],
  [140, 86, 75],
  [196, 156, 148],
  [227, 119, 194],
  [247, 182, 210],
  [127, 127, 127],
  [199, 199, 199],
  [188, 189, 34],
  [219, 219, 141],
  [23, 190, 207],
  [158, 218, 229]
];

/**
 * Get the color index given an ID
 * @param {number} id
 * @return {number[]}
 */
export function getColorById(id: number) {
  return (COLOR_PALETTE[id % COLOR_PALETTE.length]);
}

/**
 * Returns the rgba string given color and alpha values.
 * @param {number[]} color - in form (r, g, b).
 * @param {number} alpha - the alpha value.
 * @return {string} the rgba string (rgb if alpha not specified).
 */
export function rgba(color: number[], alpha: number = -1) {
  if (alpha < 0) {
    return sprintf('rgb(%d, %d, %d)', color[0], color[1], color[2]);
  } else {
    return sprintf('rgba(%d, %d, %d, %f)', color[0], color[1], color[2], alpha);
  }
}

/**
 * Get the hidden color as rgb, which encodes the id and handle index.
 * @param {number} index - The index.
 * @return {string} - The hidden color rgb string.
 */
export function hiddenStyleColor(index: number) {
  const color = index + 1;
  return rgba([(color >> 16) & 255, (color >> 8) & 255,
    (color & 255)]);
}

/**
 * Function to find mode of a number array.
 * @param {number[]} arr - the array.
 * @return {number} the mode of the array.
 */
export function mode(arr: number[]) {
  return arr.sort((a, b) =>
    arr.filter((v) => v === a).length
    - arr.filter((v) => v === b).length
  ).pop();
}

/**
 * Function to wrap index
 * @param {number} i - the raw index
 * @param {number} length - the actual length of the array
 * @return {number} the index in the array
 */
export function idx(i: number, length: number) {
  return (i + length) % length;
}

/**
 * Function to redraw shape
 * @param {ShapeType} shape - the shape to redraw
 * @param {any} context - the context to redraw on
 * @param {number} displayToImageRatio - display to image ratio
 */
export function redrawControlShape(shape: ShapeType,
                                   context: any,
                                   displayToImageRatio: number) {
  if (shape.name === 'VertexType') {
    redrawVertex(shape as VertexType, context, displayToImageRatio,
      CONTROL_HANDLE_RADIUS);
  } else if (shape.name === 'RectType') {
    redrawRect(shape as RectType, context, displayToImageRatio,
      CONTROL_LINE_WIDTH);
  }
}

/**
 * Function to redraw vertex
 * @param {VertexType} vertex - the vertex to redraw
 * @param {any} context - the context to redraw on
 * @param {number} displayToImageRatio - display to image ratio
 * @param {number} radius - radius of the vertex to be drawn
 * @param {number[]} color - rgb color, max value 1
 * @param {number} alpha - alpha value, max value 1
 */
export function redrawVertex(vertex: VertexType,
                             context: any,
                             displayToImageRatio: number,
                             radius: number = HANDLE_RADIUS,
                             color: number[] = [-1, -1, -1],
                             alpha: number = 1
                             ) {
  // convert to display resolution
  const x = displayToImageRatio * vertex.x;
  const y = displayToImageRatio * vertex.y;

  context.save();
  context.beginPath();
  if (vertex.type === VertexTypes.CONTROL_POINT
    || vertex.type === VertexTypes.MIDPOINT) {
    context.fillStyle = rgba(CONTROL_FILL_COLOR, ALPHA_CONTROL_POINT);
    context.strokeStyle = rgba(CONTROL_LINE_COLOR, ALPHA_CONTROL_POINT);
  } else {
    context.fillStyle = rgba(color, alpha);
  }
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.closePath();
  context.fill();
  context.restore();
}

/**
 * Function to redraw a rectangle
 * @param {RectType} rect - the rectangle to redraw
 * @param {any} context - the context to redraw on
 * @param {number} displayToImageRatio - display to image ratio
 * @param {number} lineWidth - line width
 * @param {number[]} color - rgba color, max value 1
 * @param {number} alpha - alpha value, max value 1
 * @param {boolean} dashed - whether or not the box is dashed
 */
export function redrawRect(rect: RectType,
                           context: any,
                           displayToImageRatio: number,
                           lineWidth: number = LINE_WIDTH,
                           color: number[] = [1, 1, 1],
                           alpha: number = 1,
                           dashed: boolean = false) {
  // convert to display resolution
  const x = displayToImageRatio * rect.x;
  const y = displayToImageRatio * rect.y;
  const w = displayToImageRatio * rect.w;
  const h = displayToImageRatio * rect.h;

  context.save();
  context.strokeStyle = rgba(color, alpha);
  if (dashed) {
    context.setLineDash([6, 2]);
  }
  context.lineWidth = lineWidth;
  context.strokeRect(x, y, w, h);
  context.restore();
}
