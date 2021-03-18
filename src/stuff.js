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
    this.statsData = {};
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
    this.scrollSpeed = 64;

    // how many tiles pass without a spawn, resets on spawn, increases chance of spawn
    this.spawnCounter = 1;

    /** @type {Object.<string, SpriteSheetData>} */
    this.spriteData = {};
    this.setupSpriteData();

    // canvas events and things
    this.doEvents();

    this.createEntities();
  }

  updateStat(key, text) {
    if (!text) {
      delete this.statsData[key];
    } else {
      this.statsData[key] = text;
    }

    this.statsNode.innerText = Object.keys(this.statsData).map(k => `[${k}]: ${this.statsData[k]}`).join("\n");
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
    playerSpriteData.registerAnimation("attack", [93, 94, 95, 96, 97, 98, 99, 71, 70]);
    this.spriteData["player"] = playerSpriteData;

    // trees
    const treeSpriteData = new SpriteSheetData(48, 48, 4, 1);
    Array.from(new Array(4)).forEach((_, i) => treeSpriteData.regsiterSprite(`tree_${i+1}`, i));
    this.spriteData["trees"] = treeSpriteData;
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
      
      const [player] = qECS.query(this.world, Sprite, Tag.for("player"));
      /** @type {Sprite} */
      const pSprite = player[1];
      if (pSprite.currentAnimation === "run") {
        pSprite.currentAnimation = "attack";
        pSprite.framerate = 1/16;
        pSprite.currentFrame = 0;
      }
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
      new Sprite(this.resources[0], 1 / 6, this.spriteData["player"], "run"),
      Tag.for("player")
    );

    // environment
    for (let i = 0; i < 26; i++) {
      this.world.create(
        new Box(i * 32, 600 - 64, 32, 32),
        new Sprite(this.resources[2], -1, this.spriteData["env"], "grass_2"),
        new Scrollable(this.scrollSpeed, false, "ground")
      );
      this.world.create(
        new Box(i * 32, 600 - 32, 32, 32),
        new Sprite(this.resources[2], -1, this.spriteData["env"], "dirt_2"),
        new Scrollable(this.scrollSpeed, false, "ground")
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
    const prevFill = this.ctx.fillStyle;
    this.ctx.fillStyle = "cyan";
    this.ctx.fillRect(0, 0, 800, 600);
    this.ctx.fillStyle = prevFill;
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
