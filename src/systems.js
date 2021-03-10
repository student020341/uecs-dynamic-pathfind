import intBox from "intersects/box";
import { World, Tag } from "uecs";

import {Animator, Body, Tile} from "@app/components";

import Vector from "@app/util/Vector";
import rInfo from "@app/util/renderinfo";
import {lerp, clamp} from "@app/util/Interp";
import Game from "@app/stuff";
import gameEvents from "@app/util/events";
import * as qECS from "@app/util/EQuery";

/**
 * 
 * @param {Game} game 
 * @param {CanvasRenderingContext2D} ctx 
 */
export const render = (game) => {
  // todo
  // offset of screen to get (0,0) in the middle
  const offsetX = 400;
  const offsetY = 300;
  const {world, ctx} = game;
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

  // get view of tiles
  world.view(Tile).each((_, tile) => {
    ctx.strokeRect(offsetX + tile.position.x * space, offsetY + tile.position.y * space, space, space);
  });
};

/**
 * Move all units towards 0,0
 * 
 * @param {Game} game
 */
export const reOrigin = (game) => {
  game.animating = true;
  const world = game.world;
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
    animator.start = body.position;
    animator.target = body.position.fromAdd(ldiff);
    animator.shouldAnimate = true;
    animator.progress = 0;
  });
}

/**
 * 
 * @param {Game} game 
 * @param {number} dt 
 */
export const animate = (game, dt) => {
  const world = game.world;
  let anyAnimating = false;
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
    }
  });

  if (game.animating && !anyAnimating) {
    game.animating = false;
    gameEvents.emit("animatorFinish");
  }
};

/**
 * 
 * @param {World} world 
 */
export const createTiles = (world) => {
  const [player] = qECS.query(world, Body, Tag.for("player"));
  const [chicken] = qECS.query(world, Body, Tag.for("chicken"));

  const playerBody = player[1];
  const chickenBody = chicken[1];
  const diff = playerBody.position.fromSub(chickenBody.position);
  console.log(`player to chicken diff: ${diff}`);
  
  // todo: reduce
  let left, right, up, down;
  let xDir = Math.sign(diff.x);
  let yDir = Math.sign(diff.y);
  // player left of chicken
  if (xDir > 0) {
    right = diff.x - 1;
    left = 2 - right;
  } else if (xDir < 0) {
    // player right of chicken
    left = Math.abs(diff.x) - 1;
    right = 2 - left;
  } else {
    // player above or below chicken
    left = 2;
    right = 2;
  }

  // remove old tiles
  world.view(Tile).each((ent, _tile) => {
    world.destroy(ent);
  });

  // add new tiles
  if (left !== 0) {
    for(let i = 0;i < left;i++) {
      world.create(new Tile(playerBody.position.clone().sub(1 + i, 0)));
    }
  }
  if (right !== 0) {
    for (let i = 0;i < right;i++) {
      world.create(new Tile(playerBody.position.clone().add(i + 1, 0)));
    }
  }
}

/**
 * 
 * @param {World} world 
 * @param {number} x x mouse in grid
 * @param {number} y y mouse in grid
 */
export const selectTile = (world, x, y) => {
  const [tile] = qECS.filter(world, (_, _tile) => _tile.position.x === x && _tile.position.y === y, Tile);
  if (tile) {
    /** @type {Tile} */
    const c = tile[1];
    const [playerEnt] = qECS.query(world, Animator, Body, Tag.for("player"));
    /** @type {Animator} */
    const playerAnimator = playerEnt[1];
    /** @type {Body} */
    const playerBody = playerEnt[2];

    playerAnimator.progress = 0;
    playerAnimator.start = playerBody.position;
    playerAnimator.target = c.position;
    playerAnimator.shouldAnimate = true;
    
    gameEvents.emit("selectTile");
  }
};
