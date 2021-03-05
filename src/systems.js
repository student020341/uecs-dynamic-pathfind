import intBox from "intersects/box";
import { World } from "uecs";

import { EntBox, MoveSteps } from "@app/components";

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

  world.view(EntBox, MoveSteps).each((_, ebox, moveSteps) => {
    const { steps } = moveSteps;
    if (steps.length > 0) {
      ctx.beginPath();
      const initial = ebox;
      ctx.moveTo(initial.x, initial.y);
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        ctx.lineTo(step.x, step.y);
      }
      ctx.stroke();
    }
  });
};

/**
 * For entities with 'MoveSteps' component, calculate a path from their position
 * to the given position
 *
 * @param {World} world
 * @param {Vector} mouse
 */
export const setSteps = (world, mouse) => {
  const entities = world.view(EntBox);

  world.view(EntBox, MoveSteps).each((ent, ebox, moveSteps) => {
    let start = new Vector(ebox.x, ebox.y);
    let end = new Vector(mouse.x, mouse.y);
    moveSteps.steps = [];
    let obstacles = [];
    let needToFindPath = false;

    // see if we can get directly to our destination
    entities.each((testEnt, testBox) => {
      if (ent !== testEnt) {
        // get entities that aren't the one doing pathfinding as obstacles in case we have to move around them
        obstacles.push(testBox);
        if (
          intBox.line(
            testBox.x,
            testBox.y,
            testBox.w,
            testBox.h,
            start.x,
            start.y,
            end.x,
            end.y
          )
        ) {
          // we will need to navigate around the obstacles...
          needToFindPath = true;
        }
      }
    });

    if (needToFindPath) {
      // path around obstacles
      let tempGrid = establishPaths(ebox, obstacles, end);
      let path = findPath(start, end, tempGrid);
      moveSteps.steps = path;
    } else {
      // go directly to target
      moveSteps.steps = [start, end];
    }
  });
};

/**
 * move entities with 'MoveSteps' along any path they have
 *
 * @param {World} world
 */
export const traverseSteps = (world, dt) => {
  world.view(EntBox, MoveSteps).each((_, ebox, moveSteps) => {
    if (moveSteps.steps && moveSteps.steps.length > 0) {
      const currentStep = moveSteps.steps[0];
      const boxVector = new Vector(ebox.x, ebox.y);
      const dist = boxVector.distanceTo(currentStep);

      const speed = 50;
      const sub = boxVector.fromSub(currentStep);
      const dir = sub.normalized();
      const xMove = dir.x * dt * speed;
      const yMove = dir.y * dt * speed;

      const onPoint = sub.x === 0 && sub.y === 0;
      const moveDeltaGreaterThanDistance = Math.abs(xMove) > dist || Math.abs(yMove) > dist;

      if (onPoint || moveDeltaGreaterThanDistance) {
        ebox.x = currentStep.x;
        ebox.y = currentStep.y;
        moveSteps.steps.splice(0, 1);
      } else {
        ebox.x += xMove;
        ebox.y += yMove;
      }
    }
  });
};

/**
 * Use the box's bounds to find possible points to navigate around the obstacle
 *
 * @param {EntBox} box the entity that needs a path
 * @param {EntBox} obstacle the entity in the way
 *
 * @returns {Object.<string, Vector>} possible navigation points
 */
const navPoints = (box, obstacle) => {
  const top = obstacle.y - box.h;
  const bottom = obstacle.y + obstacle.h + box.h;
  const left = obstacle.x - box.w;
  const right = obstacle.x + obstacle.w + box.w;

  return {
    topLeft: new Vector(left, top),
    topRight: new Vector(right, top),
    bottomRight: new Vector(right, bottom),
    bottomLeft: new Vector(left, bottom),
  };
};

/**
 * Determine which nodes can 'see' other nodes / are traversable paths
 *
 * @param {EntBox} ebox
 * @param {Array<EntBox>} obstacles
 * @param {Vector} target
 */
const establishPaths = (ebox, obstacles, target) => {
  // create navigation nodes around obstacles as a map to remove duplicates
  /** @type {Object.<string, EntBox>} */
  const navigationPointsMap = {};
  obstacles.forEach((obs) => {
    Object.values(navPoints(ebox, obs)).forEach((vec) => {
      const key = `${vec.x}+${vec.y}`;
      navigationPointsMap[key] = vec;
    });
  });

  // add start and end points to map in case it overlaps one of the obstacle points
  navigationPointsMap[`${ebox.x}+${ebox.y}`] = new Vector(ebox.x, ebox.y);
  navigationPointsMap[`${target.x}+${target.y}`] = target;

  // establish which nodes can see each other / are valid paths
  const np = Object.values(navigationPointsMap);
  /** @type {Array<PathNode>} */
  let nodes = [];
  for (let i = 0; i < np.length; i++) {
    let node = new PathNode(new Vector(np[i].x, np[i].y), null);
    // h is distance to goal
    node.h = node.position.distanceTo(target);
    for (let j = 0; j < np.length; j++) {
      if (i == j) {
        continue;
      }

      // build line between points
      let line = [np[i].x, np[i].y, np[j].x, np[j].y];
      // check for intersection with obstacles
      const blocked = obstacles.some((obs) =>
        intBox.line(obs.x, obs.y, obs.w, obs.h, ...line)
      );
      if (!blocked) {
        node.nodes.push(j);
      }
    }
    nodes.push(node);
  }

  return nodes;
};

export class PathNode {
  /**
   *
   * @param {Vector} position
   * @param {*} parent
   */
  constructor(position, parent) {
    this.position = position;
    this.parent = parent;

    this.g = 0;
    this.h = 0;
    this.f = 0;
    // nodes reachable from this node
    this.nodes = [];
  }
}

/**
 *
 * @param {Vector} start starting point
 * @param {Vector} end target point
 * @param {Array<PathNode>} nodes temporary grid points
 */
const findPath = (start, end, nodes) => {
  const startNodeIndex = nodes.findIndex(
    (n) => n.position.x === start.x && n.position.y === start.y
  );
  const endNodeIndex = nodes.findIndex(
    (n) => n.position.x === end.x && n.position.y === end.y
  );

  const openList = [startNodeIndex];
  const closedList = [];

  let maxSteps = 20;
  while (openList.length > 0 && maxSteps > 0) {
    maxSteps--;
    let currentIndex = openList[0];
    let currentNode = nodes[currentIndex];
    // find lowest cost node for path find step
    for (let i = 0; i < openList.length; i++) {
      const item = nodes[openList[i]];
      if (item.f < currentNode.f) {
        currentNode = item;
        currentIndex = openList[i];
      }
    }

    const indexForOLC = openList.findIndex((_i) => _i === currentIndex);
    openList.splice(indexForOLC, 1);
    closedList.push(currentIndex);

    // at goal
    if (currentIndex === endNodeIndex) {
      const path = [];
      let current = currentNode;
      while (current) {
        path.unshift(current.position);
        current = current.parent;
      }

      return path;
    }

    // add child nodes to open list
    let children = currentNode.nodes;
    for (let i = 0; i < children.length; i++) {
      const childIndex = children[i];
      if (closedList.includes(childIndex)) {
        continue;
      }

      const child = nodes[childIndex];
      child.g = currentNode.g + 1;
      child.f = child.g + child.h;
      if (!openList.includes(childIndex)) {
        child.parent = currentNode;
        openList.push(childIndex);
      }
    }
  }

  // no path?
  return [];
};
