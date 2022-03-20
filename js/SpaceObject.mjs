/*
 * Base class (can I call it a class in Javascript?) for all objects in the game
 */
export default class SpaceObject {
  constructor(cwidth, cheight) {
    this.cwidth = cwidth;
    this.cheight = cheight;
    this.x = cwidth / 2;
    this.y = cheight / 2;
    this.vx = 0;
    this.vy = 0;
    this.direction = 0;
    this.rotating = 0;
    this.inPlay = true;
  }

  markForRemoval() {
    this.inPlay = false;
  }

  /**
   * Determines what happens when an object hits the border.
   * Reusable code, yay.
   * Returns true if the object crossed a border.
   */
  handleBorderMovement() {
    let crossed = false;
    if (this.x < 0) {
      this.x = this.cwidth;
      crossed = true;
    }
    else if (this.x >= this.cwidth) {
      this.x = 0;
      crossed = true;
    }
    if (this.y < 0) {
      this.y = this.cheight;
      crossed = true;
    }
    else if (this.y >= this.cheight) {
      this.y = 0;
      crossed = true;
    }
    return crossed;
  }
}
