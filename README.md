# SUPERMAGENTA

[Visit the site](https://muadsteeb.github.io/supermagenta/).

A quiet, GitHub-dark-inspired coming-soon page with an original isometric marble
maze. Static HTML, CSS and JavaScript; no runtime dependencies or external assets.
Every maze surface is a magenta gradient.

Move the mouse over the maze to guide the marble toward the glowing ring. Walls
are solid, leaving the canvas slows the marble, and reaching the ring starts a
short celebration before resetting. Touch dragging and focused arrow-key input
are also supported. R or Escape resets the maze. No controls are displayed.
Screen-reader instructions and completion announcements are included; reduced
motion disables the decorative pulse and celebration particles.

## Local development

Run `npm start` (Python 3 required) and open `http://localhost:4173`.
Run `npm test` with Node.js 22 or newer to check route traversal, wall collisions,
speed limits, braking, completion and coordinate mapping.

## Publishing

The `Publish GitHub Pages` workflow tests and deploys the static assets on pushes
to `main`, or through a manual workflow run. Set the repository's Pages source to
**GitHub Actions**. All asset URLs are relative, including the JavaScript modules,
so the site works under the `/supermagenta/` project path without a custom domain.
