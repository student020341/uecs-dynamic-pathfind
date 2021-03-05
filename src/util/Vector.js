
export default class Vector {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
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
}
