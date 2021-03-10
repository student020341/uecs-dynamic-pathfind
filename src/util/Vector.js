export default class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * mutate and return this vector
   *
   * @param  {Array<number>|Vector} args x,y numbers or a Vector
   * @returns {Vector}
   */
  add(...args) {
    if (args.length === 2 && args.every((arg) => typeof arg === "number")) {
      this.x += args[0];
      this.y += args[1];
    } else if (args.length === 1 && args[0] instanceof Vector) {
      this.x += args[0].x;
      this.y += args[0].y;
    } else {
      throw new Error("Invalid arguments passed to Vector.add");
    }

    // why not
    return this;
  }

  /**
   * mutate and return this vector
   *
   * @param  {Array<number>|Vector} args x,y numbers or a Vector
   * @returns {Vector}
   */
  sub(...args) {
    if (args.length === 2 && args.every((arg) => typeof arg === "number")) {
      this.x -= args[0];
      this.y -= args[1];
    } else if (args.length === 1 && args[0] instanceof Vector) {
      this.x -= args[0].x;
      this.y -= args[0].y;
    } else {
      throw new Error("Invalid arguments passed to Vector.add");
    }

    // why not
    return this;
  }

  /**
   * add to a cloned vector
   *
   * @param  {...any} args
   * @returns {Vector}
   */
  fromAdd(...args) {
    const vec = this.clone();
    return vec.add(...args);
  }

  /**
   * difference between 2 vectors as new vector
   *
   * @param {Vector} vec
   * @returns  {Vector}
   */
  fromSub(vec) {
    return new Vector(vec.x - this.x, vec.y - this.y);
  }

  /**
   * get distance between 2 Vectors
   *
   * @param {Vector} vec
   * @returns {number}
   */
  distanceTo(vec) {
    const dx = Math.pow(vec.x - this.x, 2);
    const dy = Math.pow(vec.y - this.y, 2);
    return Math.sqrt(dx + dy);
  }

  /**
   * return normalized clone
   *
   * @returns {Vector}
   */
  normalized() {
    const l = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Vector(this.x / l, this.y / l);
  }

  /**
   * get copy of vector
   *
   * @returns {Vector}
   */
  clone() {
    return new Vector(this.x, this.y);
  }

  /**
   * mutate vector x,y to be absolute values
   *
   * @returns {Vector}
   */
  absolute() {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);
    return this;
  }

  toString() {
    return `(${this.x},${this.y})`;
  }
}
