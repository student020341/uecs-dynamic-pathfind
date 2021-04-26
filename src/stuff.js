import { World, Tag } from "uecs";

import * as qECS from "@app/util/EQuery";

// components
import { Animator, Body } from "@app/components";

// systems
import {
  render,
  animate,
} from "@app/systems";
import Vector from "@app/util/Vector";
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

      console.log("mouse", mousePos);
    });

    // intentions
    const steps = [
      new Vector(10, 0),
      new Vector(50, 30),
      new Vector(0, 100)
    ];
    // animator event, event example
    gameEvents.on("animatorFinish", () => {
      console.log("animations completed");

      // replace with some kind of event manager?
      this.world.view(Tag.for("player")).each(ent => {
        if (steps.length > 0) {
          const step = steps.shift();
          const body = this.world.get(ent, Body);
          const animator = this.world.get(ent, Animator);

          animator.setAnimation(1, body.position, body.position.fromAdd(step));
          this.animating = true;
        }
      });
    });
  }

  // set up / seed world
  createEntities() {
    // start with 1 spot between player and enemy
    const test = this.world.create(
      new Body(new Vector(20, 20), "blue"),
      new Animator(),
      Tag.for("player")
    );

    // move entity to the right over 1 second
    const animator = this.world.get(test, Animator);
    animator.setAnimation(1, new Vector(20, 20), new Vector(40, 20));
    animator.source = "foo";
    this.animating = true;

    const blap = this.world.create(
      new Body(new Vector(20, 100), "red"),
      new Animator()
    );

    const a2 = this.world.get(blap, Animator);
    a2.source = "bar";
    a2.setAnimation(1.5, new Vector(20, 100), new Vector(50, 60));

    // const [player] = qECS.query(this.world, Animator, Body, Tag.for("player"));
    //   // items are returned in the positional order of their specification +1 (entity id at 0), just like world.view
    //   /** @type {Animator} */
    //   const pAnimator = player[1];
    //   /** @type {Vector} */
    //   const position = player[2].position;
    //   pAnimator.setAnimation(
    //     position.x == 2 ? 0.5 : 1, // go left in half a second
    //     position,
    //     position.x == 2 ? new Vector(1, 1) : new Vector(2, 1) // animate character left and right
    //   );
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
