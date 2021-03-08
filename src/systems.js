import intBox from "intersects/box";
import { World } from "uecs";

import { EntBox } from "@app/components";

import Vector from "@app/util/Vector";

/**
 *
 * @param {World} world
 *
 * @param {CanvasRenderingContext2D} ctx
 */
export const renderBoxes = (world, ctx) => {
  world.view(EntBox).each((_, /**@type {EntBox}*/ box) => {
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  });
};