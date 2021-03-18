import intBox from "intersects/box";

import { Animator, Box, Scrollable, Sprite } from "@app/components";

import Vector from "@app/util/Vector";
import { lerp, clamp } from "@app/util/Interp";
import Game from "@app/stuff";
import gameEvents from "@app/util/events";
import { Tag } from "uecs";
import * as qECS from "@app/util/EQuery";

/**
 *
 * @param {Game} game
 * @param {CanvasRenderingContext2D} ctx
 */
export const render = (game) => {
  const { world, ctx } = game;
  let playerEnt = -1;
  world.view(Box, Sprite).each((_ent, box, sprite) => {
    // render player last so they are always in the foreground
    if (world.has(_ent, Tag.for("player"))) {
      playerEnt = _ent;
      return;
    }
    const { x: dx, y: dy, w: dw, h: dh } = box;
    const frame = sprite.currentFrame;
    const { x: sx, y: sy, w: sw, h: sh } = sprite.getCurrentAnimation()[frame];

    ctx.drawImage(sprite.ref, sx, sy, sw, sh, dx, dy, dw, dh);

    // debug
    // ctx.strokeRect(dx-2, dy-2, dw+4, dh+4);
  });

  // render player separately
  if (playerEnt != -1) {
    const box = world.get(playerEnt, Box);
    const sprite = world.get(playerEnt, Sprite);
    const current = sprite.getCurrentAnimation()[sprite.currentFrame];
    ctx.drawImage(
      sprite.ref,
      current.x,
      current.y, 
      current.w,
      current.h,
      box.x,
      box.y,
      box.w,
      box.h
    );
  }
};

/**
 *
 * @param {Game} game
 * @param {number} dt
 */
export const animate = (game, dt) => {
  const world = game.world;

  world.view(Sprite).each((_ent, sprite) => {
    // not animated
    if (sprite.framerate < 0) {
      return;
    }

    // player attacking
    const isPlayer = world.has(_ent, Tag.for("player"));
    if (isPlayer && sprite.currentAnimation === "attack") {
      attackTrees(game);
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
        if (isPlayer) {
          if (sprite.currentAnimation === "attack" ) {
            sprite.currentAnimation = "run";
            sprite.framerate = 1/6;
          }
        }
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
    game.spawnCounter += 0.1;
    world.create(
      new Box(furthestX + 32, 600 - 64, 32, 32),
      new Sprite(game.resources[2], -1, game.spriteData["env"], "grass_2"),
      new Scrollable(game.scrollSpeed, false, "ground")
    );
    world.create(
      new Box(furthestX + 32, 600 - 32, 32, 32),
      new Sprite(game.resources[2], -1, game.spriteData["env"], "dirt_2"),
      new Scrollable(game.scrollSpeed, false, "ground")
    );

    // increasing chance to spawn a tree
    if (Math.random() > 1 / game.spawnCounter) {
      game.spawnCounter = 1;
      world.create(
        new Box(furthestX+32, 600 - 64 - 48, 48, 48),
        new Sprite(game.resources[3], -1, game.spriteData["trees"], `tree_${Math.floor(Math.random() * 4)+1}`),
        new Scrollable(game.scrollSpeed, false, "tree"),
        Tag.for("tree")
      );
    }
  }

  game.updateStat("Spawn Chance", `${((1 - (1/game.spawnCounter)) * 100).toFixed(2)}%`);
};

/**
 * I like the proof of concept, so it's wrapping up early with this. Attackable trees. 
 * 
 * @param {Game} game
 */
export const attackTrees = (game) => {
  const {world} = game;
  const [player] = qECS.query(world, Sprite, Box, Tag.for("player"));
  const pbox = player[2];
  // hit zone
  const zoneMin = pbox.x + 10;
  const zoneMax = pbox.x + pbox.w - 10;

  world.view(Box, Tag.for("tree")).each((_ent, box, _tag) => {
    
    const before = box.x > zoneMax;
    const after = box.x + box.w < zoneMin;

    if (!(before || after)) {
      world.destroy(_ent);
    }
  });
};
