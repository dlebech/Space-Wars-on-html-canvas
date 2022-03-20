import SpaceObject from './SpaceObject.mjs';

/**
 * The basic enemy object: An asteroid floating around as an obstacle.
 */
export default class SpaceAsteroid extends SpaceObject {
  constructor(cwidth, cheight, direction, vx, vy, x, y, radius) {
    super(cwidth, cheight);
    this.color = '#CCCCCC';
    this.explodedColor = '#00FFFF';
    this.direction = direction;
    this.vx = vx;
    this.vy = vy;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.exploded = false;
    this.explosionTime = 0;
  }

  /**
   * Draws the asteroids. It's just a circle.
   * But if it exploded, it lights up in nice colors.
   */
  draw(ctx) {
    let multiplier = 1.0;
    if (this.exploded) {
      multiplier = 1.5;
      ctx.fillStyle = this.explodedColor;
    } else {
      ctx.fillStyle = this.color;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * multiplier, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Updates the physics of the asteroid.
   * The asteroids only move in one direction.
   */
  updatePhysics(elapsed) {

    // Horisontal movement (x)
    this.x += elapsed * this.vx;

    // Vertical movement (y)
    // Subtracted because coordinate system starts in upper right
    // and has positive y going downwards.
    this.y -= elapsed * this.vy;

    this.handleBorderMovement();
  }

  /**
   * Determines if the asteroid is touching another object.
   */
  isTouching(obj) {
    if (obj.x > this.x - this.radius
      && obj.x < this.x + this.radius
      && obj.y > this.y - this.radius
      && obj.y < this.y + this.radius)
      return true;

    else
      return false;
  }


  /**
   * Called when the asteroid is about to explode and disappear.
   * If the asteroid removes itself after a short interval,
   * strange behavior occurs.
   */
  explode() {
    // Don't double explode :-)
    if (!this.exploded) {
      this.exploded = true;
      this.explosionTime = new Date();
      return true;
    }
    return false;
  }

  /**
   * Similar to isTouching.
   * Also returns true if another object is just close by.
   */
  isCloseTo(obj) {
    if (obj.x > this.x - 2 * this.radius
      && obj.x < this.x + 2 * this.radius
      && obj.y > this.y - 2 * this.radius
      && obj.y < this.y + 2 * this.radius)
      return true;

    else
      return false;
  }
}
