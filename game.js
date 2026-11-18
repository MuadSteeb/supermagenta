import { GRID, START, GOAL, RADIUS, VIEW, LEVEL, createBall, stepBall, stepTilt, project as projectPoint, unproject } from "./maze.js";

const canvas = document.querySelector("#maze");
const status = document.querySelector("#status");
const ctx = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let ball = createBall();
let pointer = null;
const tilt = { ...LEVEL };
let wonAt = null;
let previousTime = null;
let frame = null;
let scale = 1;
const keys = new Set();
const wallHeight = 0.42;

function project(x, y, z = 0) {
  return projectPoint(x, y, z, tilt);
}

function polygon(context, points, colors) {
  const gradient = context.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y + 22);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
}

function tile(context, x, y, height, topColors) {
  const a = project(x, y, height);
  const b = project(x + 1, y, height);
  const c = project(x + 1, y + 1, height);
  const d = project(x, y + 1, height);
  polygon(context, [b, project(x + 1, y, 0), project(x + 1, y + 1, 0), c], ["#b51482", "#70084e"]);
  polygon(context, [d, c, project(x + 1, y + 1, 0), project(x, y + 1, 0)], ["#e32caa", "#9d0b72"]);
  polygon(context, [a, b, c, d], topColors);
  context.strokeStyle = "#ffb5e832";
  context.lineWidth = 0.65;
  context.beginPath();
  context.moveTo(d.x, d.y);
  context.lineTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

function drawFloor(context) {
  const n = GRID.length;
  const a = project(0, 0);
  const b = project(n, 0);
  const c = project(n, n);
  const d = project(0, n);
  context.save();
  context.translate(500, 350);
  context.scale(1, 0.55);
  const shadow = context.createRadialGradient(0, 0, 10, 0, 0, 430);
  shadow.addColorStop(0, "#e900a221");
  shadow.addColorStop(0.7, "#b5008110");
  shadow.addColorStop(1, "#b5008100");
  context.fillStyle = shadow;
  context.fillRect(-450, -450, 900, 900);
  context.restore();
  polygon(context, [d, c, project(n, n, -0.26), project(0, n, -0.26)], ["#9e0a71", "#460731"]);
  polygon(context, [b, project(n, 0, -0.26), project(n, n, -0.26), c], ["#6e074c", "#300523"]);
  polygon(context, [a, b, c, d], ["#9b146e", "#4f0a3b"]);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (GRID[y][x] === "0") {
        const tint = (x + y) % 2 === 0;
        polygon(context, [project(x, y), project(x + 1, y), project(x + 1, y + 1), project(x, y + 1)],
          tint ? ["#a61b7b", "#871362"] : ["#a11a76", "#80105d"]);
      }
    }
  }
}

function drawWall(context, x, y) {
  const light = 64 + (x + y) * 0.52;
  tile(context, x, y, wallHeight, [`hsl(319 85% ${light}%)`, `hsl(319 78% ${light - 17}%)`]);
}

function resize() {
  const bounds = canvas.getBoundingClientRect();
  scale = Math.min(window.devicePixelRatio || 1, 2) * bounds.width / VIEW.width;
  canvas.width = Math.round(VIEW.width * scale);
  canvas.height = Math.round(VIEW.height * scale);
}

function ring(position, time, goal = false) {
  const p = project(position.x, position.y, goal ? 0.55 : 0.015);
  const pulse = reducedMotion.matches ? 0 : Math.sin(time * 2.6) * 0.9;
  ctx.save();
  ctx.transform(1, -(tilt.x - tilt.y) * 24 / VIEW.sx, 0,
    (VIEW.sy - (tilt.x + tilt.y) * 24) / VIEW.sx, p.x, p.y);
  ctx.shadowColor = goal ? "#ffb6ec" : "#ff72d3";
  ctx.shadowBlur = goal ? 15 : 0;
  ctx.strokeStyle = goal ? "#ffc2ef" : "#e857b5";
  ctx.lineWidth = goal ? 2 : 1;
  ctx.beginPath();
  ctx.arc(0, 0, goal ? 12 + pulse : 10, 0, Math.PI * 2);
  ctx.stroke();
  if (goal) {
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, 17 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBall(time) {
  const lift = wonAt === null || reducedMotion.matches ? 0 : Math.min((time - wonAt) * 0.22, 0.3);
  const foot = project(ball.x, ball.y);
  const center = project(ball.x, ball.y, RADIUS + lift);
  const radius = 10.2;
  ctx.save();
  ctx.fillStyle = "#2d042b70";
  ctx.beginPath();
  ctx.ellipse(foot.x + 2, foot.y + 2, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const shine = ctx.createRadialGradient(center.x - 3.5, center.y - 4.5, 0.4, center.x, center.y, radius);
  shine.addColorStop(0, "#ffffff");
  shine.addColorStop(0.28, "#fff5fd");
  shine.addColorStop(0.62, "#efbde1");
  shine.addColorStop(0.86, "#b35b9e");
  shine.addColorStop(1, "#67245e");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffe4fa99";
  ctx.lineWidth = 0.65;
  ctx.stroke();
  ctx.restore();
}

function celebrate(time) {
  if (wonAt === null || reducedMotion.matches) return;
  const age = time - wonAt;
  const origin = project(GOAL.x, GOAL.y, 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age / 2);
  for (let i = 0; i < 24; i++) {
    const angle = i * Math.PI * 2 / 24;
    const distance = age * (32 + (i % 4) * 12);
    ctx.fillStyle = i % 2 ? "#ffb0e8" : "#f832bd";
    ctx.beginPath();
    ctx.arc(origin.x + Math.cos(angle) * distance, origin.y + Math.sin(angle) * distance * 0.55 - 35 * age + 22 * age * age, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function reset() {
  ball = createBall();
  pointer = null;
  Object.assign(tilt, LEVEL);
  keys.clear();
  wonAt = null;
  status.textContent = "The marble is back at the start.";
}

function render(timestamp) {
  const time = timestamp / 1000;
  const dt = previousTime === null ? 0 : Math.min(time - previousTime, 0.05);
  previousTime = time;
  let destination = pointer;
  if (keys.size) {
    const dx = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
    const dy = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
    const center = GRID.length / 2;
    destination = { x: center + (dx + dy) * center, y: center + (-dx + dy) * center };
  }
  stepTilt(tilt, ball.won ? null : destination, dt);
  stepBall(ball, tilt, dt);
  if (ball.won && wonAt === null) {
    wonAt = time;
    pointer = null;
    keys.clear();
    status.textContent = "Maze complete. A new journey begins in a moment.";
  }
  if (wonAt !== null && time - wonAt > 2.4) reset();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawFloor(ctx);
  ring(START, time);
  // Painter's order lets nearby walls occlude the marble naturally.
  const objects = [];
  for (let y = 0; y < GRID.length; y++) {
    for (let x = 0; x < GRID[y].length; x++) {
      if (GRID[y][x] === "1") objects.push({ depth: x + y + 1, x, y });
    }
  }
  objects.push({ depth: GOAL.x + GOAL.y, beacon: true });
  objects.push({ depth: ball.x + ball.y, marble: true });
  objects.sort((a, b) => a.depth - b.depth);
  for (const object of objects) {
    if (object.beacon) ring(GOAL, time, true);
    else if (object.marble) drawBall(time);
    else drawWall(ctx, object.x, object.y);
  }
  celebrate(time);
  frame = requestAnimationFrame(render);
}

function point(event) {
  if (event.pointerType === "touch" && event.type === "pointermove" && !canvas.hasPointerCapture(event.pointerId)) return;
  const bounds = canvas.getBoundingClientRect();
  // Use the level board's coordinates so lifting it cannot move the input target.
  pointer = unproject((event.clientX - bounds.left) * VIEW.width / bounds.width,
    (event.clientY - bounds.top) * VIEW.height / bounds.height);
}

canvas.addEventListener("pointermove", point);
canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  canvas.focus({ preventScroll: true });
  point(event);
});
canvas.addEventListener("pointerleave", () => { pointer = null; });
canvas.addEventListener("pointerup", (event) => {
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (event.pointerType !== "mouse") pointer = null;
});
canvas.addEventListener("pointercancel", () => { pointer = null; });
canvas.addEventListener("lostpointercapture", () => { pointer = null; });
canvas.addEventListener("keydown", (event) => {
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
    keys.add(event.key);
  } else if (event.key.toLowerCase() === "r" || event.key === "Escape") reset();
});
canvas.addEventListener("keyup", (event) => { keys.delete(event.key); });
canvas.addEventListener("blur", () => { keys.clear(); pointer = null; });
window.addEventListener("blur", () => { keys.clear(); pointer = null; });
document.addEventListener("visibilitychange", () => {
  keys.clear();
  pointer = null;
  previousTime = null;
  if (document.hidden) cancelAnimationFrame(frame);
  else frame = requestAnimationFrame(render);
});
new ResizeObserver(resize).observe(canvas);
resize();
frame = requestAnimationFrame(render);
