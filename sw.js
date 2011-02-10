/**
 * The MIT License.
 *
 * Copyright (c) 2011 David Volquartz Lebech
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Width and height of canvas
var cwidth = 400;
var cheight = 400;

var intval = null;

function init() {
	var canvas = document.getElementById('sw-canvas');
	if (canvas.getContext) {
		ctx = canvas.getContext('2d');
		lastTime = new Date();

		// Create spaceship
		spaceship = new SpaceShip();

		// Create asteroids
		asteroids = createAsteroids(10);

		// Initialize empty laser array
		lasers = [];

		// Render the canvas every 50 milliseconds. 
		if (intval)
			clearInterval(intval);
		intval = setInterval(render,50);
	}
}

/**
 * Resets stat counters.
 */
function resetCounters() {
	shotsFired = 0;
	asteroidsShotDown = 0;
}

var ctx = null; // The drawing context
var spaceship = null;
var asteroids = null;
var lasers = null;
var lastTime = 0;
var shotsFired = 0;
var asteroidsShotDown = 0;

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
}

/**
 * Draws all objects on the canvas.
 */
function draw() {
	// Clear the drawing area
	ctx.clearRect(0,0,400,400);

	// Fill with black background
	ctx.fillStyle = '#000000';
	ctx.fillRect(0,0,400,400);

	// Draw asteroids
	for (i = 0; i < asteroids.length; i++) {
		asteroids[i].draw();
	}

	// Draw lasers 
	for (i = 0; i < lasers.length; i++) {
		lasers[i].draw();
	}

	// Draw the spaceship
	spaceship.draw(ctx);
}

/**
 * Updates the physics of all objects.
 */
function updatePhysics() {
	var now = new Date();
	var elapsed = now.getTime() - lastTime.getTime();
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
		&& (now.getTime()-spaceship.explosionTime.getTime() >= 700))
		spaceship.markForRemoval();

	// Lasers
	for (i = 0; i < lasers.length; i++) {
		lasers[i].updatePhysics(elapsed);
	}

	// Asteroids
	for (i = 0; i < asteroids.length; i++) {
		asteroids[i].updatePhysics(elapsed);

		// Check to see if the asteroid has exploded enough :-)
		if (asteroids[i].exploded
			&& (now.getTime()-asteroids[i].explosionTime.getTime() >= 700))
			asteroids[i].markForRemoval();

		// Check for collisions with laser
		for (j = 0; j < lasers.length; j++) {
			if (asteroids[i].isTouching(lasers[j])) {
				asteroids[i].explode();
				lasers[j].markForRemoval();
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
	for (i = 0; i < lasers.length; i++) {
		if (!lasers[i].inPlay) {
			lasers.splice(i,1);
			i--;
		}
	}

	for (i = 0; i < asteroids.length; i++) {
		if (!asteroids[i].inPlay) {
			asteroids.splice(i,1);
			i--;
		}
	}
}

/**
 * Determines if the games has been won.
 */
function checkGameState() {
	if (asteroids.length == 0 && spaceship.inPlay) {
		ctx.fillStyle= '#FFFFFF';
		ctx.font = '18px sans-serif';
		ctx.fillText('Yay, you won', 100, 50);
		ctx.fillText('Shots fired: ' + shotsFired, 100, 70);
		ctx.fillText('Asteroids shot down: ' + asteroidsShotDown, 100, 90);
	}
	else if (!spaceship.inPlay) {
		ctx.fillStyle= '#FFFFFF';
		ctx.font = '18px sans-serif';
		ctx.fillText('Oh no, you lost', 100, 50);
		ctx.fillText('Shots fired: ' + shotsFired, 100, 70);
		ctx.fillText('Asteroids shot down: ' + asteroidsShotDown, 100, 90);
		clearInterval(intval);
	}
}

/**
 * Our little spaceship.
 */
function SpaceShip() {
	this.inheritFrom = SpaceObject;
	this.inheritFrom();
	this.l = 20; // length
	this.w = 10; // width
	this.lastFired = 0;
	this.physRotation = 120; // Pixels/second
	this.physAccel = 40; // Pixels/second
	this.maxSpeed = 150; // Pixels/second
	this.reloadTime = 300; // Milliseconds
	this.laserSpeed = 300; // Pixels/second
	this.thrusting = false;
	this.thrustColor = '#999900';
	this.color = '#00FF00';
	this.exploded = false;
	this.explosionTime = 0;

	/**
	 * Draws the spaceship.
	 */
	this.draw = function() {
		// Saves the canvas so everything else can be restored
		ctx.save();

		// Translates and rotates the canvas so ship can be drawn
		ctx.translate(this.x, this.y);
       	var radians = this.direction * (Math.PI / 180.0);
    	ctx.rotate(-radians);
		ctx.fillStyle = this.color;

		// Draw explosion indicator, if applicable
		if (this.exploded) {
			ctx.fillStyle = this.thrustColor;
			ctx.beginPath();
			ctx.moveTo(0,8);
			ctx.lineTo(4,12);
			ctx.lineTo(4,6);
			ctx.lineTo(10,0);
			ctx.lineTo(4,-4);
			ctx.lineTo(6,-12);
			ctx.lineTo(0,-8);
			ctx.lineTo(-4,-12);
			ctx.lineTo(-2,-6);
			ctx.lineTo(-10,0);
			ctx.lineTo(-6,2);
			ctx.lineTo(-4,12);
			ctx.closePath();
			ctx.fill();
		}
		else {
			// Draw the spaceship as a simple path
			ctx.beginPath();
	    	ctx.moveTo(0, 0);
	    	ctx.lineTo(-(this.l/4), this.w/2);
	    	ctx.lineTo(this.l/4*3, 0);
	    	ctx.lineTo(-this.l/4, -this.w/2);
			ctx.closePath();
			ctx.fill();
	
			// Draw thrust, if applicable
			if (this.thrusting) {
				ctx.strokeStyle = this.thrustColor;
				ctx.beginPath();
				ctx.moveTo(0,0);
				ctx.lineTo(-7,0);
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
	this.updatePhysics = function(elapsed) {
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
	   	var accX = 0.0;
	   	var accY = 0.0;
	    	
	   	// If the engine is on.
	   	if (this.thrusting) {
	    		
	       	// Calculate radians of currently facing direction.
	       	var radians = this.direction * (Math.PI / 180.0);
	       	var accel = 0.0;
	        	
			// Find acceleration in pixels
	       	accel = this.physAccel * elapsed;

	        // Calculate acceleration vector.
	       	var accX = Math.cos(radians) * accel;
	       	var accY = Math.sin(radians) * accel;
	   	}
	    	
	    var vxOld = this.vx;
	    var vyOld = this.vy;
	    	
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
	    	
	    handleBorderMovement(this);
	}

	this.fireLaser = function() {
		var now = new Date();
		
		// There should be a small delay between lasers fired.
		if (now.getTime() - this.lastFired >= this.reloadTime) {
	    	// Calculate radians of currently facing direction.
	    	var radians = this.direction * (Math.PI / 180.0);
	    	
	    	// Calculate velocity vector.
	    	var velLaserX = Math.cos(radians) * this.laserSpeed;
	    	var velLaserY = Math.sin(radians) * this.laserSpeed;
	   
	    	this.lastFired = now.getTime();
			var laser = new SpaceLaser(this.color, this.direction, velLaserX, velLaserY, this.x, this.y);
			lasers.push(laser);

			// Increase stats
			shotsFired++;
		}
	}

	/**
	 * Called when the spaceship is about to explode and disappear.
	 */
	this.explode = function() {
		this.exploded = true;
		this.explosionTime = new Date();
	}
}

/**
 * The basic enemy object: An asteroid floating around as an obstacle.
 */
function SpaceAsteroid(direction, vx, vy, x, y, radius) {
	this.inheritFrom = SpaceObject;
	this.inheritFrom();
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

	/**
	 * Draws the asteroids. It's just a circle.
	 * But if it exploded, it lights up in nice colors.
	 */
	this.draw = function() {
		var multiplier = 1.0;
		if (this.exploded) {
			multiplier = 1.5;
			ctx.fillStyle = this.explodedColor;
		}
		else
			ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x,this.y,this.radius*multiplier,0,Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
	}

	/**
	 * Updates the physics of the asteroid.
	 * The asteroids only move in one direction.
	 */
	this.updatePhysics = function(elapsed) {

		// Horisontal movement (x)
	   	this.x += elapsed * this.vx;
	   	
		// Vertical movement (y)
	   	// Subtracted because coordinate system starts in upper right
	   	// and has positive y going downwards.
	   	this.y -= elapsed * this.vy;
	   	
		handleBorderMovement(this);
	}

	/**
	 * Determines if the asteroid is touching another object.
	 */
	this.isTouching = function(obj) {
		if (obj.x > this.x-this.radius
			&& obj.x < this.x+this.radius
			&& obj.y > this.y-this.radius
			&& obj.y < this.y+this.radius)
			return true;
		else
			return false;
	}

	/**
	 * Similar to isTouching.
	 * Also returns true if another object is just close by.
	 */
	this.isCloseTo = function(obj) {
		if (obj.x > this.x-2*this.radius
			&& obj.x < this.x+2*this.radius
			&& obj.y > this.y-2*this.radius
			&& obj.y < this.y+2*this.radius)
			return true;
		else
			return false;
	}

	/**
	 * Called when the asteroid is about to explode and disappear.
	 * If the asteroid removes itself after a short interval,
	 * strange behavior occurs.
	 */
	this.explode = function() {
		this.exploded = true;
		this.explosionTime = new Date();
		asteroidsShotDown++;
	}
}

/**
 * A laser that can be fired by the spaceship
 */
function SpaceLaser(color, direction, vx, vy, x, y) {
	this.inheritFrom = SpaceObject;
	this.inheritFrom();
	this.color = color;
	this.direction = direction;
	this.vx = vx;
	this.vy = vy;
	this.x = x;
	this.y = y;

	/**
	 * Draws the laser which is basically just a little line.
	 */
	this.draw = function() {
		ctx.save();

		// Translates and rotates the canvas so laser can be drawn correctly
		ctx.translate(this.x, this.y);
       	var radians = this.direction * (Math.PI / 180.0);
    	ctx.rotate(-radians);

		// Draw a little line, indicating the laser
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(10,0);
		ctx.closePath();
		ctx.stroke();

		// Restore the canvas
		ctx.restore();
	}

	/**
	 * The laser only moves in one direction so the physics are fairly straightforward.
	 */
	this.updatePhysics = function(elapsed) {
	    this.x += elapsed * this.vx;
	    	
	    // Subtracted because coordinate system starts in upper right
	    // and has positive y going downwards.
	    this.y -= elapsed * this.vy;

		if (handleBorderMovement(this))
			this.markForRemoval();
	}
}

/**
 * Determines what happens when an object hits the border.
 * Reusable code, yay.
 * Returns true if the object crossed a border.
 */
function handleBorderMovement(spaceobject) {
	var crossed = false;
	if (spaceobject.x < 0) {
		spaceobject.x = cwidth;
		crossed = true;
	}
	else if (spaceobject.x >= cwidth) {
		spaceobject.x = 0;
		crossed = true;
	}
	if (spaceobject.y < 0) {
		spaceobject.y = cheight;
		crossed = true;
	}
	else if (spaceobject.y >= cheight) {
		spaceobject.y = 0;
		crossed = true;
	}
	return crossed;
}

/**
 * Creates a number of asteroids and returns an array containing them.
 * Makes sure to not create asteroids on top of the spaceship.
 */
function createAsteroids(num) {
	var arr = [];

	while (num > 0) {
		var size = (Math.random()*20.0+10.0);
		var a = new SpaceAsteroid(0, Math.random()*10.0-5.0, Math.random()*10.0-5.0, Math.random()*cwidth, Math.random()*cheight, size);
			
		// If the asteroid is created on top of or close to the spaceship,
		// it should not be added to the game.
		if (!a.isCloseTo(spaceship)) {
			arr.push(a);
			num--;
		}
	}

	return arr;
}

/*
 * Base class (can I call it a class in Javascript?) for all objects in the game
 */
function SpaceObject() {
	this.x = cwidth/2;
	this.y = cheight/2;
	this.vx = 0;
	this.vy = 0;
	this.direction = 0;
	this.rotating = 0;
	this.inPlay = true;

	this.markForRemoval = function() {
		this.inPlay = false;
	}
}

function keyDown(e) {
	// Looks strange but makes sure that it works in firefox.
	var key = (e||window.event).keyCode;
	switch (key) {
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
			spaceship.fireLaser();
			break;
	}
}

function keyUp(e) {
	// Looks strange but makes sure that it works in firefox.
	var key = (e||window.event).keyCode;
	switch (key) {
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
