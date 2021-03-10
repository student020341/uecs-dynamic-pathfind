import {World} from "uecs";
import Vector from "@app/util/Vector";

// object of moving thing / player
export class Body {
  /**
   * 
   * @param {Vector} position 
   */
  constructor(position) {
    this.position = position;
  }
}

// object of tile vis / interaction
export class Tile {
  /**
   * 
   * @param {Vector} position 
   */
  constructor(position) {
    this.position = position;
  }
}

// mutate body position over time
export class Animator {
  /** @type {number} seconds for change to occur over */
  goal = 0.5;
  /** @type {number} accumulated time */
  progress = 0;
  /** @type {boolean} whether  */
  shouldAnimate = false;
  /** @type {Vector} target to animate towards */
  target = new Vector(0, 0);
  /** @type {Vector} original position */
  start = new Vector(0, 0);
}
