import intBox from "intersects/box";

import {Body} from "@app/components";

import Vector from "@app/util/Vector";
import {lerp, clamp} from "@app/util/Interp";
import Game from "@app/stuff";

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
    ctx.strokeRect(x, y, 10, 10);
    ctx.fillStyle = body.color;
    ctx.fillRect(x+1, y+1, 9, 9);
  });
  // restore fill
  ctx.fillStyle = oldFill;
};
