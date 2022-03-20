import SpaceObject from './SpaceObject.mjs';
import SpaceLaser from './Laser.mjs';

/**
 * Our little spaceship.
 */
export default class SpaceShip extends SpaceObject {
  constructor(cwidth, cheight, speedFactor) {
    super(cwidth, cheight);
    this.l = 20; // length
    this.w = 10; // width
    this.lastFired = 0;
    this.physRotation = 120 * speedFactor; // Pixels/second
    this.physAccel = 40 * speedFactor; // Pixels/second
    this.maxSpeed = 150 * speedFactor; // Pixels/second
    this.reloadTime = 300; // Milliseconds
    this.laserSpeed = 300; // Pixels/second
    this.thrusting = false;
    this.thrustColor = '#999900';
    this.color = '#00FF00';
    this.exploded = false;
    this.explosionTime = 0;
  }

  /**
   * Draws the spaceship.
   */
  draw(ctx) {
    const radians = this.direction * (Math.PI / 180.0);

    // Saves the canvas so everything else can be restored
    ctx.save();

    // Translates and rotates the canvas so ship can be drawn
    ctx.translate(this.x, this.y);
    ctx.rotate(-radians);
    ctx.fillStyle = this.color;

    // Draw explosion indicator, if applicable
    if (this.exploded) {
      ctx.fillStyle = this.thrustColor;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(4, 12);
      ctx.lineTo(4, 6);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(6, -12);
      ctx.lineTo(0, -8);
      ctx.lineTo(-4, -12);
      ctx.lineTo(-2, -6);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-6, 2);
      ctx.lineTo(-4, 12);
      ctx.closePath();
      ctx.fill();
    }
    else {
      // Draw the spaceship as a simple path
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-(this.l / 4), this.w / 2);
      ctx.lineTo(this.l / 4 * 3, 0);
      ctx.lineTo(-this.l / 4, -this.w / 2);
      ctx.closePath();
      ctx.fill();

      // Draw thrust, if applicable
      if (this.thrusting) {
        ctx.strokeStyle = this.thrustColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Restore the canvas
    ctx.restore();
  }

  /**
   * Updates the physics of the spaceship.
   * This includes rotation and position.
   */
  updatePhysics(elapsed) {
    // Update rotation if there is some rotating going on.
    if (this.rotating != 0) {
      this.direction += this.rotating * (this.physRotation * elapsed);

      // Set value to be between 0 and 360.
      if (this.direction < 0)
        this.direction += 360;
      else if (this.direction >= 360)
        this.direction -= 360;
    }

    // Base accelerations for x and y are 0.
    let accX = 0.0;
    let accY = 0.0;

    // If the engine is on.
    if (this.thrusting) {

      // Calculate radians of currently facing direction.
      const radians = this.direction * (Math.PI / 180.0);
      let accel = 0.0;

      // Find acceleration in pixels
      accel = this.physAccel * elapsed;

      // Calculate acceleration vector.
      accX = Math.cos(radians) * accel;
      accY = Math.sin(radians) * accel;
    }

    const vxOld = this.vx;
    const vyOld = this.vy;

    this.vx += accX;
    this.vy += accY;

    // If spaceship is at max speed then don't increase its speed.
    if (this.vx > this.maxSpeed)
      this.vx = this.maxSpeed;
    else if (this.vx < -this.maxSpeed)
      this.vx = -this.maxSpeed;

    if (this.vy > this.maxSpeed)
      this.vy = this.maxSpeed;
    else if (this.vy < -this.maxSpeed)
      this.vy = -this.maxSpeed;

    // Update the horisontal position (x)
    this.x += elapsed * (this.vx + vxOld) / 2;

    // Update the vertical position (y)
    // Subtracted because coordinate system starts in upper right
    // and has positive y going downwards.
    this.y -= elapsed * (this.vy + vyOld) / 2;

    this.handleBorderMovement();
  }

  fireLaser() {
    const now = new Date();

    // There should be a small delay between lasers fired.
    if (now.getTime() - this.lastFired >= this.reloadTime) {
      // Calculate radians of currently facing direction.
      const radians = this.direction * (Math.PI / 180.0);

      // Calculate velocity vector.
      const velLaserX = Math.cos(radians) * this.laserSpeed;
      const velLaserY = Math.sin(radians) * this.laserSpeed;

      this.lastFired = now.getTime();
      return new SpaceLaser(this.cwidth, this.cheight, this.color, this.direction, velLaserX, velLaserY, this.x, this.y);
    }

    return null;
  }

  /**
   * Called when the spaceship is about to explode and disappear.
   */
  explode() {
    // Don't double explode :-)
    if (!this.exploded) {
      this.exploded = true;
      this.explosionTime = new Date();
    }
  }
}