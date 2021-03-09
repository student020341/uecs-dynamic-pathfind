
export default class Vector {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }

  add(...args) {
    if (args.length === 2 && args.every(arg => typeof arg === "number")) {
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

  fromAdd(...args) {
    const vec = this.clone();
    return vec.add(...args);
  }

  fromSub(vec) {
    return new Vector(
      vec.x - this.x,
      vec.y - this.y
    );
  }

  distanceTo(vec) {
    const dx = Math.pow(vec.x - this.x, 2);
    const dy = Math.pow(vec.y - this.y, 2);
    return Math.sqrt(dx + dy);
  }

  normalized() {
    const l = Math.sqrt((this.x * this.x) + (this.y * this.y));
    return new Vector(this.x/l, this.y/l);
  }

  clone() {
    return new Vector(this.x, this.y);
  }
}
