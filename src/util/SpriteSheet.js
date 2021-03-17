import {Box} from "@app/components";

/**
 * 
 * @param {number} tile_width width of 1 tile in the sprite sheet
 * @param {number} tile_height height of 1 tile in the sprite sheet
 * @param {number} horizontal_tiles colummn count
 * @param {number} vertical_tiles row count
 * @param {...*} frames start and end frame (inclusive) or array of desired frames
 */
const _getFrames = (...args) => {
  let [tile_width, tile_height, resource_width, resource_height] = args;
  resource_width *= tile_width;
  resource_height *= tile_height;
  let frames = [];
  // tile width, tile height, resource width, resource height, specific frames
  if (args.length === 5) {
    frames = args[4];
  } else if (args.length === 6) {
    // tile width, tile height, resource width, resource height, range start, range end
    frames = Array.from(new Array(args[5]+1 - args[4])).map((_, i) => i + args[4]);
  } else {
    throw new Error(`Expected 5 or 6 arguments but got ${args.length}`);
  }

  return frames.reduce((arr, frameIndex) => {
    const _w = frameIndex * tile_width;
    const x = _w % resource_width;
    const y = Math.floor(_w / resource_width) * tile_height;

    return arr.concat(new Box(x, y, tile_width, tile_height));
  }, []);
};

export default class SpriteSheetData {
  constructor(sprite_width, sprite_height, sprites_x, sprites_y) {
    this.sprite_width = sprite_width;
    this.sprite_height = sprite_height;
    this.sprites_x = sprites_x;
    this.sprites_y = sprites_y;

    /** @type {Object.<string, Array<Box>>} */
    this.animations = {};
  }

  /**
   * 
   * @param  {...*} frames start and end frame or array of specific frames
   * @returns {Array<Box>}
   */
  getFrames (...frames) {
    return _getFrames(this.sprite_width, this.sprite_height, this.sprites_x, this.sprites_y, ...frames);
  }

  registerAnimation(key, ...frames) {
    if (!key) {
      return;
    }
    this.animations[key] = this.getFrames(...frames);
  }

  // single frame "animation"
  regsiterSprite(key, frame) {
    if (!key) {
      return;
    }
    this.animations[key] = this.getFrames([frame]);
  }
}
