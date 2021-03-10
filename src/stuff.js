import { World, Tag } from "uecs";

import * as qECS from "@app/util/EQuery";

// components
import { Animator, Body, Tile } from "@app/components";

// systems
import {
  render,
  reOrigin,
  animate,
  createTiles,
  selectTile,
} from "@app/systems";
import Vector from "@app/util/Vector";
import rInfo from "@app/util/renderinfo";
import gameEvents from "@app/util/events";

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
    this.animating = false;

    // tiles for selecting stuff
    /** @type {Array<Tile>} */
    this.tiles = [];

    // canvas events and things
    this.doEvents();

    this.createEntities();
  }

  doEvents() {
    // click canvas
    this.canvas.addEventListener("click", (ev) => {
      const rect = ev.target.getBoundingClientRect();
      const mousePos = {
        x: ev.clientX - rect.left - rect.width / 2,
        y: ev.clientY - rect.top - rect.height / 2,
      };
      const { space } = rInfo;
      const x = Math.floor(mousePos.x / space);
      const y = Math.floor(mousePos.y / space);
      console.log(`(${x},${y})`);
      selectTile(this.world, x, y);
    });

    // animator event
    gameEvents.on("animatorFinish", () => {
      createTiles(this.world);
    });

    // tile / move select event
    gameEvents.on("selectTile", () => {
      this.animating = true;
    });
  }

  // set up / seed world
  createEntities() {
    // start with 1 spot between player and enemy
    this.world.create(
      new Body(new Vector(-1, 0)),
      new Animator(),
      Tag.for("player")
    );
    this.world.create(
      new Body(new Vector(1, 0)),
      new Animator(),
      Tag.for("chicken")
    );

    reOrigin(this);
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
    if (this.animating) {
      animate(this, dt);
    }
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
