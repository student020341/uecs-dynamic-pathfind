import { World, Tag } from "uecs";

// components
import { Body } from "@app/components";

// systems
import {
  render
} from "@app/systems";
import Vector from "@app/util/Vector";

export default class Game {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.world = new World();
    this.running = true;
    this.doStep = false;
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext("2d");

    // some animator is running
    // this is an optimization so certain functions aren't always running if there are no active animators
    this.animating = false;

    // canvas events and things
    this.doEvents();

    this.createEntities();
  }

  doEvents() {
    // click canvas
    this.canvas.addEventListener("click", (ev) => {
      const rect = ev.target.getBoundingClientRect();
      // mouse point inside of canvas
      const mousePos = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      };
      
      console.log(`mouse event (${new Vector(mousePos.x, mousePos.y)})`);
    });
  }

  // set up / seed world
  createEntities() {
    // start with 1 spot between player and enemy
    const test = this.world.create(
      new Body(new Vector(40, 40), "blue"),
      Tag.for("player")
    );
  }

  setRunning(next = true) {
    this.running = next;
  }

  step() {
    this.doStep = true;
  }

  renderStep() {
    this.ctx.clearRect(0, 0, 800, 600);
    render(this);
  }

  logicStep(dt) {
    //
    
  }

  async loop() {
    while (true) {
      let t2 = performance.now();
      let p = new Promise((resolve) =>
        requestAnimationFrame((t1) => {
          // skip logic for game paused
          const shouldRunFrame = this.running || this.doStep;
          if (!shouldRunFrame) {
            resolve();
            return;
          }

          // time delta in seconds
          let dt = (t1 - t2) / 1000;
          // do not interpolate latency greater than 1 second
          if (dt > 1) {
            resolve();
            return;
          }

          // allow 1 frame to run for a "step"
          if (this.doStep) {
            this.doStep = false;
          }

          // all game logic
          this.logicStep(dt);

          // all render code
          this.renderStep();

          resolve();
        })
      );

      await p;
    }
  }
}
