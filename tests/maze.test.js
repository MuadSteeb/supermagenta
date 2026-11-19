import test from "node:test";
import assert from "node:assert/strict";
import { GRID, START, GOAL, MAX_SPEED, MAX_TILT, LEVEL, createBall, stepBall, stepTilt, tiltForPointer, canOccupy, project, unproject } from "../maze.js";

function route() {
  const queue = [[{ x: START.x, y: START.y }]];
  const visited = new Set([`${START.x},${START.y}`]);
  while (queue.length) {
    const path = queue.shift();
    const last = path.at(-1);
    if (last.x === GOAL.x && last.y === GOAL.y) return path;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: last.x + dx, y: last.y + dy };
      const key = `${next.x},${next.y}`;
      if (!canOccupy(next.x, next.y) || visited.has(key)) continue;
      visited.add(key);
      queue.push([...path, next]);
    }
  }
  throw new Error("Goal is unreachable");
}

test("maze can be completed using bounded board tilt and counter-steering", () => {
  const ball = createBall();
  const tilt = { ...LEVEL };
  const center = GRID.length / 2;
  const path = route();
  assert.ok(path.length > 20);
  for (const target of path.slice(1)) {
    for (let frame = 0; frame < 600 && !ball.won; frame++) {
      const pointer = {
        x: center - ((target.x - ball.x) * 5 - ball.vx * 4) * center / (20 * MAX_TILT),
        y: center - ((target.y - ball.y) * 5 - ball.vy * 4) * center / (20 * MAX_TILT),
      };
      stepTilt(tilt, pointer, 1 / 60);
      stepBall(ball, tilt, 1 / 60);
      assert.ok(canOccupy(ball.x, ball.y), "marble must never intersect a wall");
      assert.ok(Math.hypot(tilt.x, tilt.y) <= MAX_TILT + 1e-10);
      if (Math.hypot(ball.x - target.x, ball.y - target.y) < 0.025 && Math.hypot(ball.vx, ball.vy) < 0.05) break;
    }
    assert.ok(ball.won || Math.hypot(ball.x - target.x, ball.y - target.y) < 0.025);
  }
  assert.equal(ball.won, true);
});

test("compact maze requires extra turns and offers misleading dead ends", () => {
  assert.equal(GRID.length, 11);
  assert.ok(GRID.every(row => row.length === 11));
  const path = route();
  assert.ok(path.length >= 33 && path.length <= 37, "route should be longer, not a marathon");
  const directions = path.slice(1).map((point, index) =>
    `${point.x - path[index].x},${point.y - path[index].y}`);
  const turns = directions.slice(1).filter((direction, index) => direction !== directions[index]).length;
  assert.ok(turns >= 9, "route must require repeated counter-steering");
  let deadEnds = 0;
  for (let y = 1; y < GRID.length - 1; y++) {
    for (let x = 1; x < GRID[y].length - 1; x++) {
      if (GRID[y][x] !== "0") continue;
      if ((x + 0.5 === START.x && y + 0.5 === START.y) ||
          (x + 0.5 === GOAL.x && y + 0.5 === GOAL.y)) continue;
      const exits = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .filter(([dx, dy]) => GRID[y + dy][x + dx] === "0").length;
      if (exits === 1) deadEnds++;
    }
  }
  assert.ok(deadEnds >= 3, "maze must retain tempting wrong branches");
});

test("walls, corners and board edges remain solid under sustained input", () => {
  for (const pointer of [{ x: 1.5, y: -100 }, { x: -100, y: 1.5 }, { x: -100, y: -100 }, { x: 100, y: 100 }]) {
    const ball = createBall();
    const tilt = tiltForPointer(pointer);
    for (let i = 0; i < 600; i++) {
      stepBall(ball, tilt, i % 2 ? 1 / 60 : 1);
      assert.ok(canOccupy(ball.x, ball.y));
      assert.ok(Math.hypot(ball.vx, ball.vy) <= MAX_SPEED + 1e-10);
      assert.ok(ball.x > 0 && ball.y > 0 && ball.x < GRID.length && ball.y < GRID.length);
    }
  }
});

test("leveling preserves momentum; counter-tilting brakes more quickly", () => {
  const ball = createBall();
  for (let i = 0; i < 15; i++) stepBall(ball, { x: -MAX_TILT, y: 0 }, 1 / 60);
  const moving = { ...ball };
  const braking = { ...ball };
  for (let i = 0; i < 10; i++) {
    stepBall(ball, LEVEL, 1 / 60);
    stepBall(braking, { x: MAX_TILT, y: 0 }, 1 / 60);
  }
  assert.ok(ball.x > moving.x);
  assert.ok(ball.vx > moving.vx * 0.8, "leveling must not stop motion instantly");
  assert.ok(Math.abs(braking.vx) < ball.vx * 0.5);
  for (let i = 0; i < 1200; i++) stepBall(ball, LEVEL, 1 / 60);
  assert.ok(Math.hypot(ball.vx, ball.vy) < 0.0001);
  assert.deepEqual(createBall(), { ...START, vx: 0, vy: 0, won: false });
});

test("completed marble stops until reset", () => {
  const ball = { ...createBall(), ...GOAL };
  stepBall(ball, LEVEL, 1 / 60);
  assert.equal(ball.won, true);
  const completed = { ...ball };
  stepBall(ball, { x: MAX_TILT, y: 0 }, 1);
  assert.deepEqual(ball, completed);
});

test("edges and corners lift toward the pointer with a bounded slope", () => {
  const center = GRID.length / 2;
  assert.deepEqual(tiltForPointer({ x: center, y: center }), LEVEL);
  assert.deepEqual(tiltForPointer(null), LEVEL);
  assert.deepEqual(tiltForPointer({ x: GRID.length, y: center }), { x: MAX_TILT, y: 0 });
  const corner = tiltForPointer({ x: -100, y: -100 });
  assert.ok(corner.x < 0 && corner.y < 0);
  assert.ok(Math.abs(Math.hypot(corner.x, corner.y) - MAX_TILT) < 1e-10);
  const tilt = { ...LEVEL };
  stepTilt(tilt, { x: GRID.length, y: center }, 1 / 60);
  assert.ok(tilt.x > 0 && tilt.x < MAX_TILT, "tilt must ease rather than jump");
  for (let i = 0; i < 120; i++) stepTilt(tilt, null, 1 / 60);
  assert.ok(Math.hypot(tilt.x, tilt.y) < 1e-6);
});

test("gravity moves away from the raised side, independent of marble position", () => {
  const tilt = { x: -MAX_TILT, y: 0 };
  const first = createBall();
  const second = { ...createBall(), x: 3.5 };
  stepBall(first, tilt, 1 / 60);
  stepBall(second, tilt, 1 / 60);
  assert.ok(first.vx > 0);
  assert.equal(first.vx, second.vx, "force must not depend on cursor-to-marble distance");
  const raised = project(0, 5.5, 0, tilt);
  const level = project(0, 5.5);
  assert.ok(raised.y < level.y, "the rendered uphill side must lift");
  assert.deepEqual(project(5.5, 5.5, 0, tilt), project(5.5, 5.5), "board pivots around its center");
  const stationary = createBall();
  stepBall(stationary, LEVEL, 1);
  assert.deepEqual(stationary, createBall());
});

test("screen and maze coordinates round-trip at all corridor centers", () => {
  for (let y = 0; y < GRID.length; y++) {
    for (let x = 0; x < GRID.length; x++) {
      const screen = project(x + 0.5, y + 0.5);
      assert.deepEqual(unproject(screen.x, screen.y), { x: x + 0.5, y: y + 0.5 });
    }
  }
  assert.equal(canOccupy(NaN, 1), false);
  assert.equal(canOccupy(1, Infinity), false);
});
