import SpaceObject from './SpaceObject.mjs';

/**
 * A laser that can be fired by the spaceship
 */
export default class SpaceLaser extends SpaceObject {
  constructor(cwidth, cheight, color, direction, vx, vy, x, y) {
    super(cwidth, cheight);
    this.color = color;
    this.direction = direction;
    this.vx = vx;
    this.vy = vy;
    this.x = x;
    this.y = y;
  }

  /**
   * Draws the laser which is basically just a little line.
   */
  draw(ctx) {
    const radians = this.direction * (Math.PI / 180.0);

    ctx.save();

    // Translates and rotates the canvas so laser can be drawn correctly
    ctx.translate(this.x, this.y);
    ctx.rotate(-radians);

    // Draw a little line, indicating the laser
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.stroke();

    // Restore the canvas
    ctx.restore();
  }

  /**
   * The laser only moves in one direction so the physics are fairly straightforward.
   */
  updatePhysics(elapsed) {
    this.x += elapsed * this.vx;

    // Subtracted because coordinate system starts in upper right
    // and has positive y going downwards.
    this.y -= elapsed * this.vy;

    if (this.handleBorderMovement())
      this.markForRemoval();
  }
}
