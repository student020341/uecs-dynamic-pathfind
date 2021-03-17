import intBox from "intersects/box";

import { Animator, Box, Scrollable, Sprite } from "@app/components";

import Vector from "@app/util/Vector";
import { lerp, clamp } from "@app/util/Interp";
import Game from "@app/stuff";
import gameEvents from "@app/util/events";

/**
 *
 * @param {Game} game
 * @param {CanvasRenderingContext2D} ctx
 */
export const render = (game) => {
  const { world, ctx } = game;
  world.view(Box, Sprite).each((_ent, box, sprite) => {
    const { x: dx, y: dy, w: dw, h: dh } = box;
    const frame = sprite.currentFrame;
    const { x: sx, y: sy, w: sw, h: sh } = sprite.getCurrentAnimation()[frame];

    ctx.drawImage(sprite.ref, sx, sy, sw, sh, dx, dy, dw, dh);

    // debug
    // ctx.strokeRect(dx-2, dy-2, dw+4, dh+4);
  });
};

/**
 *
 * @param {Game} game
 * @param {number} dt
 */
export const animate = (game, dt) => {
  const world = game.world;

  world.view(Sprite).each((_, sprite) => {
    // not animated
    if (sprite.framerate < 0) {
      return;
    }

    const currentAnim = sprite.getCurrentAnimation();
    sprite.frameAcc = clamp(sprite.frameAcc + dt, 0, sprite.framerate);
    if (sprite.frameAcc === sprite.framerate) {
      // reached end of frame duration, increment frame
      sprite.frameAcc = 0;
      sprite.currentFrame++;
      // loop frame back to 0
      if (sprite.currentFrame >= currentAnim.length) {
        sprite.currentFrame = 0;
      }
    }
  });
};

/**
 *
 * @param {Game} game
 * @param {number} dt
 */
export const scroll = (game, dt) => {
  const { world } = game;

  let furthestX = 0;
  let createNewGroundTile = false;
  world.view(Scrollable, Box).each((_ent, scrollable, box) => {
    box.x -= dt * scrollable.speed;
    if (box.x > furthestX) {
      furthestX = box.x;
    }

    // remove scrollables that go off screen
    if (box.x <= -box.w) {
      world.destroy(_ent);
      if (scrollable.type == "ground") {
        createNewGroundTile = true;
      }
    }
  });

  if (createNewGroundTile) {
    world.create(
      new Box(furthestX + 32, 600 - 64, 32, 32),
      new Sprite(game.resources[2], -1, game.spriteData["env"], "grass_2"),
      new Scrollable(16, false, "ground")
    );
    world.create(
      new Box(furthestX + 32, 600 - 32, 32, 32),
      new Sprite(game.resources[2], -1, game.spriteData["env"], "dirt_2"),
      new Scrollable(16, false, "ground")
    );
  }
};
