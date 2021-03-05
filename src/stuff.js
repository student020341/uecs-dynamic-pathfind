import { World, Tag } from "uecs";

// components
import {
  EntBox, MoveSteps
} from "@app/components";

// systems
import {
  renderBoxes, setSteps, PathNode, traverseSteps
} from "@app/systems";
import Vector from "@app/util/Vector";

export default class Game {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.world = new World();
    this.running = false;
    this.doStep = false;
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext("2d");

    // canvas events and things
    this.doEvents();

    this.createEntities();
  }

  doEvents() {
    // click canvas
    this.canvas.addEventListener("click", (ev) => {
      const rect = ev.target.getBoundingClientRect();
      const mousePos = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      };

      setSteps(this.world, mousePos);
    });
  }

  // set up / seed world
  createEntities() {
    this.world.create(new EntBox(50, 10, 10, 10), new MoveSteps);

    for (let x = 0;x < 5;x++) {
      const xOffset = 20 + x*30;
      for (let y = 0;y < 5;y++) {
        const yOffset = 100 + y*30;
        this.world.create(new EntBox(xOffset, yOffset, 10, 10));
      }
    }

    // non uniform x shape
    this.world.create(new EntBox(300, 200, 200, 10));
    this.world.create(new EntBox(350, 100, 40, 200));

    // hollow plus shape
    // left horizontal bars
    this.world.create(new EntBox(20, 400, 130, 10));
    this.world.create(new EntBox(20, 440, 130, 10));
    // right horizontal bars
    this.world.create(new EntBox(200, 400, 130, 10));
    this.world.create(new EntBox(200, 440, 130, 10));
    // top vertical bars
    this.world.create(new EntBox(150, 280, 10, 130));
    this.world.create(new EntBox(190, 280, 10, 130));
    // bottom vertical bars
    this.world.create(new EntBox(150, 440, 10, 130));
    this.world.create(new EntBox(190, 440, 10, 130));
  }

  setRunning(next = true) {
    this.running = next;
  }

  step() {
    this.doStep = true;
  }

  renderStep() {
    this.ctx.clearRect(0, 0, 800, 600);
    renderBoxes(this.world, this.ctx);
  }

  logicStep(dt) {
    traverseSteps(this.world, dt);
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

          // time delta
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
