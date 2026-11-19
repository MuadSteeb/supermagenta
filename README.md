# SUPERMAGENTA

[Visit the site](https://muadsteeb.github.io/supermagenta/).

A quiet, GitHub-dark-inspired coming-soon page with an original isometric marble
maze. Static HTML, CSS and JavaScript; no runtime dependencies or external assets.
Every maze surface is a magenta gradient.
The compact layout has a winding route and misleading dead ends, adding challenge
without narrower corridors or faster physics.

Move the mouse toward an edge or corner to lift that part of the maze. The board
visibly tilts, and gravity rolls the marble downhill, away from the raised side.
Distance from the center controls the slope; the cursor never pulls the marble.
Move back to the center to level the board, or counter-tilt to brake its momentum.
Walls are solid and slightly bouncy. Leaving the canvas gently levels the board;
the marble keeps coasting and gradually slows. Reaching the glowing ring starts
a short celebration before resetting. Touch dragging and focused arrow keys
also lift the corresponding side. R or Escape resets the maze and levels the
board. No controls are displayed.
Screen-reader instructions and completion announcements are included; reduced
motion disables the decorative pulse and celebration particles.

## Local development

Run `npm start` (Python 3 required) and open `http://localhost:4173`.
Run `npm test` with Node.js 22 or newer to check route traversal, wall collisions,
layout difficulty, speed limits, tilt direction, inertia, leveling, completion
and coordinate mapping.

## Publishing

The `Publish GitHub Pages` workflow tests and deploys the static assets on pushes
to `main`, or through a manual workflow run. Set the repository's Pages source to
**GitHub Actions**. All asset URLs are relative, including the JavaScript modules,
so the site works under the `/supermagenta/` project path without a custom domain.
