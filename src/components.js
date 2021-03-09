import {World} from "uecs";
import Vector from "@app/util/Vector";

export class Body {
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
  // todo: investigate why this seems innacurate
  /** @type {number} seconds for change to occur over */
  goal = 2;
  /** @type {number} accumulated time */
  progress = 0;
  /** @type {boolean} whether  */
  shouldAnimate = false;
  /** @type {Vector} target to animate towards */
  target = new Vector(0, 0);
}
