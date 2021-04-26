import intBox from "intersects/box";

import {Animator, Body} from "@app/components";

import Vector from "@app/util/Vector";
import {lerp, clamp} from "@app/util/Interp";
import Game from "@app/stuff";
import gameEvents from "@app/util/events";

/**
 * 
 * @param {Game} game 
 * @param {CanvasRenderingContext2D} ctx 
 */
export const render = (game) => {
  const {world, ctx} = game;
  const oldFill = ctx.fillStyle;
  world.view(Body).each((_ent, body) => {
    const {x, y} = body.position;

    ctx.fillStyle = body.color;
    ctx.fillRect(x, y, 20, 20);
  });
  // restore fill
  ctx.fillStyle = oldFill;
};

/**
 * 
 * @param {Game} game 
 * @param {number} dt 
 */
export const animate = (game, dt) => {
  const world = game.world;
  let anyAnimating = false;
  // collect active animator events so we can respond to 
  // particular things finishing, like re-origin
  world.view(Body, Animator).each((_, body, animator) => {
    if (!animator.shouldAnimate) {
      return;
    }
    
    animator.progress = clamp(animator.progress + dt, 0, animator.goal);
    const percent = clamp(animator.progress / animator.goal, 0, 1);
    const value = new Vector(
      lerp(animator.start.x, animator.target.x, percent),
      lerp(animator.start.y, animator.target.y, percent)
    );

    body.position = value;

    animator.shouldAnimate = percent !== 1;
    if (animator.shouldAnimate) {
      anyAnimating = true;
    } else {
      // done animating
      animator.progress = 0;
    }
  });

  if (game.animating && !anyAnimating) {
    game.animating = false;
    gameEvents.emit("animatorFinish");
  }
};

