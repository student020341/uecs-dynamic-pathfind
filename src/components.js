import Vector from "@app/util/Vector";
import SpriteSheetData from "@app/util/SpriteSheet";

// object of moving thing / player
export class Box {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  getPosVector() {
    return new Vector(this.x, this.y);
  }
}

// sprite related

export class Sprite {
  /**
   *
   * @param {HTMLImageElement} ref
   * @param {number} framerate
   * @param {SpriteSheetData} sheetData
   * @param {string} startingAnimation
   */
  constructor(ref, framerate, sheetData, startingAnimation) {
    this.ref = ref;
    this.framerate = framerate;
    this.sheetData = sheetData;
    this.currentFrame = 0;
    this.currentAnimation =
      startingAnimation in sheetData.animations
        ? startingAnimation
        : Object.keys(sheetData.animations)[0];
    // accumulated delta time on current frame
    this.frameAcc = 0;
  }

  getCurrentAnimation() {
    return this.sheetData.animations[this.currentAnimation];
  }
}

// animator related

export class Animator {
  /** @type {string} a possible source of animation, ex: game did something (re-origin), player did something (moved) */
  source = "";
  /** @type {number} seconds for change to occur over */
  goal = 0.5;
  /** @type {number} accumulated time */
  progress = 0;
  /** @type {boolean} whether  */
  shouldAnimate = false;
  /** @type {*} target to animate towards */
  target;
  /** @type {*} original position */
  start;
  /** @type {function(Animator, number):void} interpollation step for this animator*/
  step;

  /**
   *
   * @param {Object} options
   * @param {string} options.source
   * @param {number} options.goal
   * @param {number} options.progress
   * @param {boolean} options.shouldAnimate
   * @param {*} options.start
   * @param {*} options.target
   * @param {function(Animator, number):void} options.step
   */
  setOptions(options) {
    Object.keys(options).forEach((key) => {
      this[key] = options[key];
    });

    return this;
  }

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

export class Scrollable {
  /**
   * 
   * @param {number} speed scroll speed
   * @param {boolean} interactable 
   * @param {string} type tile type
   */
  constructor(speed, interactable, type) {
    this.speed = speed;
    this.interactable = interactable;
    this.type = type;
  }
}
