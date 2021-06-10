import Vector from "@app/util/Vector";

// object of moving thing / player
export class Body {
  /**
   * 
   * @param {Vector} position 
   * @param {string} color
   */
  constructor(position, color) {
    this.position = position;
    this.color = color;
  }
}
