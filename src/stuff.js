import { World } from "uecs";

import * as qECS from "@app/util/EQuery";

// components
import {
  Animator,
  Body
} from "@app/components";

// systems
import {
  render, reOrigin, animate
} from "@app/systems";
import Vector from "@app/util/Vector";
import rInfo from "@app/util/renderinfo";

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
      const {space} = rInfo;
      const x = Math.floor(mousePos.x / space);
      const y = Math.floor(mousePos.y / space);
      console.log(`(${x},${y})`);
      reOrigin(this.world);
    });
  }

  // set up / seed world
  createEntities() {
    // start with 1 spot between player and enemy
    this.world.create(new Body(new Vector(-1, 0)), new Animator);
    this.world.create(new Body(new Vector(1, 0)), new Animator);
  }

  setRunning(next = true) {
    this.running = next;
  }

  step() {
    this.doStep = true;
  }

  renderStep() {
    this.ctx.clearRect(0, 0, 800, 600);
    render(this.world, this.ctx, this.grid);
  }

  logicStep(dt) {
    //
    animate(this.world, dt);
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
