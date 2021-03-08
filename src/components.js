
import Vector from "@app/util/Vector";

/**
 * a bounding box for basic rendering and collision
 */
export class EntBox {
  /**
   * 
   * @param {number} x x position
   * @param {number} y y position
   * @param {number} w width
   * @param {number} h height
   */
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}
