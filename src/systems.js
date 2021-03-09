import intBox from "intersects/box";
import { World } from "uecs";

import {Animator, Body} from "@app/components";

import Vector from "@app/util/Vector";
import rInfo from "@app/util/renderinfo";
import {lerp, clamp} from "@app/util/Interp";

/**
 * 
 * @param {World} world 
 * @param {CanvasRenderingContext2D} ctx 
 */
export const render = (world, ctx) => {
  // todo
  // offset of screen to get (0,0) in the middle
  const offsetX = 400;
  const offsetY = 300;
  const {space} = rInfo;
  world.view(Body).each((_, body) => {
    const {x, y} = body.position;
    ctx.strokeRect(offsetX + x * space, offsetY +  y * space, 10, 10);
  });

  // temp
  // const xw = 800 / space;
  // const yh = 600 / space;
  // for (let x = 0; x < xw; x++) {
  //   for (let y = 0; y < yh; y++) {
  //     ctx.strokeRect(x * space, y * space, space, space);
  //   }
  // }
};

/**
 * Move all units towards 0,0
 * 
 * @param {World} world 
 */
export const reOrigin = (world) => {
  const bodyView = world.view(Body, Animator);
  let ldiff;
  let ldist;
  const origin = new Vector(0, 0);
  let entityAtOrigin = false;

  // get point closest to center
  bodyView.each((_, body) => {
    // if one of the bodies are at the origin, we don't need to re-origin
    if (entityAtOrigin) {
      return;
    }

    if (body.position.x === 0 && body.position.y === 0) {
      entityAtOrigin = true;
      return;
    }

    const dist = body.position.distanceTo(origin);
    
    if (!ldist || dist < ldist) {
      ldist = dist;
      ldiff = body.position.fromSub(origin);
    }
  });

  // move everyone if units are off origin
  if (entityAtOrigin) {
    return;
  }

  bodyView.each((_, body, animator) => {
    animator.target = body.position.fromAdd(ldiff);
    animator.shouldAnimate = true;
    animator.progress = 0;
  });
}

/**
 * 
 * @param {World} world 
 * @param {number} dt 
 */
export const animate = (world, dt) => {
  world.view(Body, Animator).each((_, body, animator) => {
    if (!animator.shouldAnimate) {
      return;
    }
    
    animator.progress = clamp(animator.progress + dt, 0, animator.goal);
    const percent = clamp(animator.progress / animator.goal, 0, 1);
    const value = new Vector(
      lerp(body.position.x, animator.target.x, percent),
      lerp(body.position.y, animator.target.y, percent)
    );

    body.position = value;

    animator.shouldAnimate = percent !== 1;
  });
};
