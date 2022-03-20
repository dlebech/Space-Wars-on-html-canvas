import SpaceShip from './Ship.mjs';
import SpaceAsteroid from './Asteroid.mjs';

// Width and height of canvas
let cwidth = 500;
let cheight = 500;

let animationId = null;

let ctx = null; // The drawing context
let spaceship = null;
let asteroids = null;
let lasers = null;
let lastTime = 0;
let shotsFired = 0;
let asteroidsShotDown = 0;
let difficulty = 1;

class SpaceWarsGame {
  init(elemId) {
    const canvas = document.getElementById(elemId);
    if (canvas.getContext) {
      canvas.width = cwidth;
      canvas.height = cheight;

      ctx = canvas.getContext('2d');
      lastTime = new Date();

      // Create spaceship
      spaceship = new SpaceShip(cwidth, cheight, difficulty);

      // Create asteroids
      asteroids = createAsteroids(10);

      // Initialize empty laser array
      lasers = [];

      // Render the canvas every 50 milliseconds. 
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      animationId = requestAnimationFrame(render);
    }
  }

  /**
   * * Resets stat counters.
   * */
  resetCounters() {
    shotsFired = 0;
    asteroidsShotDown = 0;
  }

  setDifficulty(val) {
    difficulty = Number(val);
  }
}

/**
 * Main animation rendering.
 * Updates physics of all objects.
 * Draws the object in the canvas.
 */
function render() {
  updatePhysics();
  draw();
  cleanUp();
  checkGameState();
  animationId = requestAnimationFrame(render);
}

/**
 * Draws all objects on the canvas.
 */
function draw() {
  // Clear the drawing area
  ctx.clearRect(0, 0, cwidth, cheight);

  // Fill with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cwidth, cheight);

  // Draw asteroids
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].draw(ctx);
  }

  // Draw lasers 
  for (let i = 0; i < lasers.length; i++) {
    lasers[i].draw(ctx);
  }

  // Draw the spaceship
  spaceship.draw(ctx);
}

/**
 * Updates the physics of all objects.
 */
function updatePhysics() {
  const now = new Date();
  let elapsed = now.getTime() - lastTime.getTime();
  lastTime = now;

  // If somehow the last time is in the future
  // don't execute the update
  if (elapsed < 0)
    return;

  // Get the elapsed time in seconds.
  // Makes things more like school physics :-)
  elapsed = elapsed / 1000.0;

  // Update the physics of the various objects. First, the spaceship
  spaceship.updatePhysics(elapsed);

  // Check to see if the asteroid has exploded enough :-)
  if (spaceship.exploded
    && (now.getTime() - spaceship.explosionTime.getTime() >= 700))
    spaceship.markForRemoval();

  // Lasers
  for (let i = 0; i < lasers.length; i++) {
    lasers[i].updatePhysics(elapsed);
  }

  // Asteroids
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].updatePhysics(elapsed);

    // Check to see if the asteroid has exploded enough :-)
    if (asteroids[i].exploded
      && (now.getTime() - asteroids[i].explosionTime.getTime() >= 700))
      asteroids[i].markForRemoval();

    // Check for collisions with laser
    for (let j = 0; j < lasers.length; j++) {
      if (asteroids[i].isTouching(lasers[j])) {
        if (asteroids[i].explode()) {
          asteroidsShotDown++;
          lasers[j].markForRemoval();
        }
      }
    }

    // Check for collisions with spaceship
    if (asteroids[i].isTouching(spaceship))
      spaceship.explode();
  }
}

/**
 * Removes unnecessary objects (e.g. lasers out of sight).
 */
function cleanUp() {
  for (let i = 0; i < lasers.length; i++) {
    if (!lasers[i].inPlay) {
      lasers.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < asteroids.length; i++) {
    if (!asteroids[i].inPlay) {
      asteroids.splice(i, 1);
      i--;
    }
  }
}

/**
 * Determines if the games has been won.
 */
function checkGameState() {
  if (asteroids.length == 0 && spaceship.inPlay) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.fillText('Yay, you won', 100, 50);
    ctx.fillText('Shots fired: ' + shotsFired, 100, 70);
    ctx.fillText('Asteroids shot down: ' + asteroidsShotDown, 100, 90);
  }
  else if (!spaceship.inPlay) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.fillText('Oh no, you lost', 100, 50);
    ctx.fillText('Shots fired: ' + shotsFired, 100, 70);
    ctx.fillText('Asteroids shot down: ' + asteroidsShotDown, 100, 90);
    cancelAnimationFrame(animationId);
  }
}

/**
 * Creates a number of asteroids and returns an array containing them.
 * Makes sure to not create asteroids on top of the spaceship.
 */
function createAsteroids(num) {
  const arr = [];

  while (num > 0) {
    const size = (Math.random() * 20.0 + 10.0);
    const vx = Math.random() * 10.0 - 5.0;
    const vy = Math.random() * 10.0 - 5.0;
    const a = new SpaceAsteroid(cwidth, cheight, 0, vx * difficulty, vy * difficulty, Math.random() * cwidth, Math.random() * cheight, size);

    // If the asteroid is created on top of or close to the spaceship,
    // it should not be added to the game.
    if (!a.isCloseTo(spaceship)) {
      arr.push(a);
      num--;
    }
  }

  return arr;
}

function keyDown(e) {
  // Looks strange but makes sure that it works in firefox.
  switch ((e || window.event).keyCode) {
    case 37: // Arrow left
      spaceship.rotating = 1;
      break;
    case 38: // Arrow up
      spaceship.thrusting = true;
      break;
    case 39: // Arrow right
      spaceship.rotating = -1;
      break;
    case 32:
      const laser = spaceship.fireLaser();
      if (laser) {
        lasers.push(laser);

        // Increase stats
        shotsFired++;
      }
      break;
  }
}

function keyUp(e) {
  // Looks strange but makes sure that it works in firefox.
  switch ((e || window.event).keyCode) {
    case 37: // Arrow left
      spaceship.rotating = 0;
      break;
    case 38: // Arrow up
      spaceship.thrusting = false;
      break;
    case 39: // Arrow right
      spaceship.rotating = 0;
      break;
  }
}

document.onkeydown = keyDown;
document.onkeyup = keyUp;

export default SpaceWarsGame;
