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
  const oldFill = ctx.fillStyle;
  world.view(Body).each((_ent, body) => {
    const {x, y} = body.position;
    const cx = offsetX + x * space + 15;
    const cy = offsetY + y * space + 15;
    ctx.strokeRect(cx, cy, 10, 10);
    ctx.fillStyle = body.color;
    ctx.fillRect(cx+1, cy+1, 9, 9);

    const animator = world.get(_ent, Animator);
    if (animator && animator.source === "re-origin") {
      ctx.beginPath();
      ctx.arc(offsetX + x * space + (space/2), offsetY + y * space + (space/2), 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  // restore fill
  ctx.fillStyle = oldFill;

  // temp
  // const xw = 800 / space;
  // const yh = 600 / space;
  // for (let x = 0; x < xw; x++) {
  //   for (let y = 0; y < yh; y++) {
  //     ctx.strokeRect(x * space, y * space, space, space);
  //   }
  // }

  // get view of tiles
  if (!game.animating) {
    world.view(Tile).each((_, tile) => {
      const cx = offsetX + tile.position.x * space;
      const cy = offsetY + tile.position.y * space;
      ctx.strokeRect(cx, cy, space, space);
      ctx.strokeText(`(${tile.position.x},${tile.position.y})`, cx+2, cy+12);
    });
  }
};

/**
 * Move all units towards 0,0
 * 
 * @param {Game} game
 */
export const reOrigin = (game) => {
  game.doingReorigin = true;
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
    animator.source = "re-origin";
    animator.start = body.position;
    animator.target = body.position.fromAdd(ldiff);
    animator.shouldAnimate = true;
    animator.progress = 0;
    animator.goal = 0.2;
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

/**
 * 
 * @param {World} world 
 */
export const createTiles = (world) => {
  const [chicken] = qECS.query(world, Body, Tag.for("chicken"));

  const chickenBody = chicken[1];
  const {position: pos} = chickenBody;
  
  const leftMost = pos.x - 3;
  const topMost = pos.y - 2;
  const bottomMost = pos.y + 3;

  // remove old tiles
  world.view(Tile).each((ent, _tile) => {
    world.destroy(ent);
  });

  // create new tiles
  for (let x = leftMost;x < pos.x; x++) {
    for (let y = topMost;y < bottomMost; y++) {
      world.create(new Tile(new Vector(x, y)));
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
    // player selects tile
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
    playerAnimator.source = "selectTile";
    playerAnimator.goal = 0.6;

    // also have chicken select tile
    const [chickenEnt] = qECS.query(world, Animator, Body, Tag.for("chicken"));
    /** @type {Animator} */
    const chickenAnimator = chickenEnt[1];
    chickenAnimator.progress = 0;
    chickenAnimator.start = chickenEnt[2].position;
    chickenAnimator.target = chickenEnt[2].position.clone().add(new Vector(
      Math.round(Math.random() * 2 - 1),
      Math.round(Math.random() * 2 - 1)
    ));
    chickenAnimator.shouldAnimate = true;
    chickenAnimator.source = "selectTile";
    chickenAnimator.goal = 0.6;
    
    gameEvents.emit("selectTile");
  }
};
