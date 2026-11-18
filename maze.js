export const GRID = [
  "11111111111",
  "10000010001",
  "11111010101",
  "10001000101",
  "10101111101",
  "10100000101",
  "10111110101",
  "10000010101",
  "10111010101",
  "10001000001",
  "11111111111",
];

export const START = Object.freeze({ x: 1.5, y: 1.5 });
export const GOAL = Object.freeze({ x: 9.5, y: 9.5 });
export const RADIUS = 0.21;
export const MAX_SPEED = 3.2;

export function createBall() {
  return { ...START, vx: 0, vy: 0, won: false };
}

export function isWall(x, y) {
  return GRID[y]?.[x] !== "0";
}

export function canOccupy(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  for (let row = Math.floor(y - RADIUS); row <= Math.floor(y + RADIUS); row++) {
    for (let col = Math.floor(x - RADIUS); col <= Math.floor(x + RADIUS); col++) {
      if (!isWall(col, row)) continue;
      const nearestX = Math.max(col, Math.min(x, col + 1));
      const nearestY = Math.max(row, Math.min(y, row + 1));
      if (Math.hypot(x - nearestX, y - nearestY) < RADIUS) return false;
    }
  }
  return true;
}

export function stepBall(ball, target, elapsed) {
  if (ball.won) return;
  // Substeps keep collisions solid, even after a slow frame.
  let remaining = Math.min(Math.max(elapsed, 0), 0.05);
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 240);
    remaining -= dt;
    const dx = target ? target.x - ball.x : 0;
    const dy = target ? target.y - ball.y : 0;
    ball.vx += (dx * 22 - ball.vx * 9) * dt;
    ball.vy += (dy * 22 - ball.vy * 9) * dt;
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > MAX_SPEED) {
      ball.vx *= MAX_SPEED / speed;
      ball.vy *= MAX_SPEED / speed;
    }
    if (canOccupy(ball.x + ball.vx * dt, ball.y)) ball.x += ball.vx * dt;
    else ball.vx = 0;
    if (canOccupy(ball.x, ball.y + ball.vy * dt)) ball.y += ball.vy * dt;
    else ball.vy = 0;
    if (Math.hypot(ball.x - GOAL.x, ball.y - GOAL.y) < 0.28) {
      ball.won = true;
      ball.vx = 0;
      ball.vy = 0;
      break;
    }
  }
}

export const VIEW = Object.freeze({ width: 1000, height: 640, x: 500, y: 86, sx: 38, sy: 21 });

export function project(x, y, z = 0) {
  return { x: VIEW.x + (x - y) * VIEW.sx, y: VIEW.y + (x + y) * VIEW.sy - z * 48 };
}

export function unproject(x, y) {
  const horizontal = (x - VIEW.x) / VIEW.sx;
  const vertical = (y - VIEW.y) / VIEW.sy;
  return { x: (horizontal + vertical) / 2, y: (vertical - horizontal) / 2 };
}
