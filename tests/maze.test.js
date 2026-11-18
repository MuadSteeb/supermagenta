import test from "node:test";
import assert from "node:assert/strict";
import { GRID, START, GOAL, MAX_SPEED, createBall, stepBall, canOccupy, project, unproject } from "../maze.js";

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

test("maze has a continuous, playable route to the goal", () => {
  const ball = createBall();
  const path = route();
  assert.ok(path.length > 20);
  for (const target of path.slice(1)) {
    for (let frame = 0; frame < 180 && !ball.won; frame++) {
      stepBall(ball, target, 1 / 60);
      assert.ok(canOccupy(ball.x, ball.y), "marble must never intersect a wall");
      if (Math.hypot(ball.x - target.x, ball.y - target.y) < 0.025) break;
    }
  }
  assert.equal(ball.won, true);
});

test("walls, corners and board edges remain solid under sustained input", () => {
  for (const target of [{ x: 1.5, y: -100 }, { x: -100, y: 1.5 }, { x: -100, y: -100 }, { x: 100, y: 100 }]) {
    const ball = createBall();
    for (let i = 0; i < 600; i++) {
      stepBall(ball, target, i % 2 ? 1 / 60 : 1);
      assert.ok(canOccupy(ball.x, ball.y));
      assert.ok(Math.hypot(ball.vx, ball.vy) <= MAX_SPEED + 1e-10);
      assert.ok(ball.x > 0 && ball.y > 0 && ball.x < GRID.length && ball.y < GRID.length);
    }
  }
});

test("leaving the game brakes the marble and reset produces a clean state", () => {
  const ball = createBall();
  for (let i = 0; i < 15; i++) stepBall(ball, { x: 4.5, y: 1.5 }, 1 / 60);
  for (let i = 0; i < 120; i++) stepBall(ball, null, 1 / 60);
  assert.ok(Math.hypot(ball.vx, ball.vy) < 0.0001);
  assert.deepEqual(createBall(), { ...START, vx: 0, vy: 0, won: false });
});

test("completed marble stops until reset", () => {
  const ball = { ...createBall(), ...GOAL };
  stepBall(ball, null, 1 / 60);
  assert.equal(ball.won, true);
  const completed = { ...ball };
  stepBall(ball, START, 1);
  assert.deepEqual(ball, completed);
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
