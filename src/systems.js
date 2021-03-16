import intBox from "intersects/box";

import {Animator, Body} from "@app/components";

import Vector from "@app/util/Vector";
import rInfo from "@app/util/renderinfo";
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
  const {space} = rInfo;
  const oldFill = ctx.fillStyle;
  world.view(Body).each((_ent, body) => {
    const {x, y} = body.position;
    // render everything scaled by space from rInfo
    // + offset box so it appears in the middle of one such space
    const cx = x * space + 15;
    const cy = y * space + 15;
    ctx.strokeRect(cx, cy, 10, 10);
    ctx.fillStyle = body.color;
    ctx.fillRect(cx+1, cy+1, 9, 9);
  });
  // restore fill
  ctx.fillStyle = oldFill;

  // display a grid based on renderInfo space
  // if the game needs no grid or scaling, this and any code involving rInfo can be removed
  if (game.showGrid) {
    const xw = 800 / space;
    const yh = 600 / space;
    for (let x = 0; x < xw; x++) {
      for (let y = 0; y < yh; y++) {
        ctx.strokeRect(x * space, y * space, space, space);
      }
    }
  }
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
  let animEvents = new Set();
  world.view(Body, Animator).each((_, body, animator) => {
    if (!animator.shouldAnimate) {
      return;
    }

    animEvents.add(animator.source);
    
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
      animator.source = "";
      animator.progress = 0;
    }
  });

  if (game.animating && !anyAnimating) {
    game.animating = false;
    gameEvents.emit("animatorFinish", Array.from(animEvents));
  }
};

