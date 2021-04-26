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

// mutate body position over time
export class Animator {
  /** @type {string} a possible source of animation, ex: game did something (re-origin), player did something (moved) */
  source = "something";
  /** @type {number} seconds for change to occur over */
  goal = 1;
  /** @type {number} accumulated time */
  progress = 0;
  /** @type {boolean} whether  */
  shouldAnimate = false;
  /** @type {Vector} target to animate towards */
  target = new Vector(0, 0);
  /** @type {Vector} original position */
  start = new Vector(0, 0);

  /** @type {VoidFunction} function to run when animator completes */
  onFinish = null;

  /**
   * 
   * @param {number} goal animation time in seconds
   * @param {Vector} start starting vector of body
   * @param {Vector} target target vector for body
   */
  setAnimation(goal, start, target) {
    this.progress = 0;
    this.shouldAnimate = true;
    this.goal = goal;
    this.start = start;
    this.target = target;
  }
}
