import { World, Tag } from "uecs";

import * as qECS from "@app/util/EQuery";

// components
import { Animator, Box, Scrollable, Sprite } from "@app/components";

// systems
import { render, animate, scroll } from "@app/systems";
import Vector from "@app/util/Vector";
import rInfo from "@app/util/renderinfo";
import gameEvents from "@app/util/events";
import { clamp } from "./util/Interp";
import SpriteSheetData from "@app/util/SpriteSheet";

export default class Game {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Array<HTMLImageElement>} resources
   */
  constructor(canvas, resources, stats) {
    // ref to node for misc display below canvas
    this.statsNode = stats;
    this.world = new World();
    this.running = true;
    this.doStep = false;
    /** @type {HTMLCanvasElement} */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext("2d");

    // images loaded in the index page
    this.resources = resources;

    // display grid based on render info space
    this.showGrid = false;

    // some animator is running
    // this is an optimization so certain functions aren't always running if there are no active animators
    this.animating = true;

    /** @type {Object.<string, SpriteSheetData>} */
    this.spriteData = {};
    this.setupSpriteData();

    // canvas events and things
    this.doEvents();

    this.createEntities();
  }

  setupSpriteData() {
    // food
    const foodSpriteData = new SpriteSheetData(16, 16, 8, 8);
    foodSpriteData.registerAnimation("cookie", 0, 0);
    this.spriteData["food"] = foodSpriteData;

    // env
    const envSpriteData = new SpriteSheetData(32, 32, 6, 8);
    [
      ["grass", 0],
      ["mushroom", 1],
      ["flower", 2],
      ["rock", 3],
      ["grass_1", 6],
      ["grass_2", 7],
      ["grass_3", 8],
      ["dirt_1", 12],
      ["dirt_2", 13],
      ["dirt_3", 14],
    ].forEach((arr) => {
      envSpriteData.regsiterSprite(...arr);
    });
    this.spriteData["env"] = envSpriteData;

    // player
    const playerSpriteData = new SpriteSheetData(50, 37, 7, 16);
    playerSpriteData.registerAnimation("idle", 0, 3);
    playerSpriteData.registerAnimation("sneak", 4, 7);
    playerSpriteData.registerAnimation("run", 8, 13);
    this.spriteData["player"] = playerSpriteData;
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
      // mouse point constrained to a sort of grid
      const { space } = rInfo;
      const x = Math.floor(mousePos.x / space);
      const y = Math.floor(mousePos.y / space);
      console.log(
        `mouse event exact (${new Vector(
          mousePos.x,
          mousePos.y
        )}) | rInfo space (${x},${y})`
      );
    });
  }

  // set up / seed world
  createEntities() {
    // food
    this.world.create(
      new Box(10, 10, 16, 16),
      new Sprite(this.resources[1], -1, this.spriteData["food"])
    );

    // player
    this.world.create(
      new Box(50, 500, 50, 37),
      new Sprite(this.resources[0], 1 / 6, this.spriteData["player"], "run")
    );

    // environment
    for (let i = 0; i < 26; i++) {
      this.world.create(
        new Box(i * 32, 600 - 64, 32, 32),
        new Sprite(this.resources[2], -1, this.spriteData["env"], "grass_2"),
        new Scrollable(16, false, "ground")
      );
      this.world.create(
        new Box(i * 32, 600 - 32, 32, 32),
        new Sprite(this.resources[2], -1, this.spriteData["env"], "dirt_2"),
        new Scrollable(16, false, "ground")
      );
    }
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
      scroll(this, dt);
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
