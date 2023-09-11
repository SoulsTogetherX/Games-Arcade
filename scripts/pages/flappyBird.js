const gameBoard = document.getElementById("game-window");
const [ctx, screen_width, screen_height, ratio] = render(gameBoard, 250, 0.8);

	// Keys
var up = 32;
blacklist_key = [up];

const grav = 0.1, max_spd = 2 + grav;
const pipe_spd = 2;

class Entity extends Blank {}

class Bird extends Entity {
	spd = 0;
	color = '#FFFFFF';
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'bottom-left', ['Pipes'], (obj, collider) => {
			if ((obj.y - obj.height < collider.gapTop) ||
				(collider.height - collider.gapBottom < obj.y))
			{
				clearAllAsyncIntervals();
				setTimeout(() => startGame(), 2000);
			}
		});
	}
	update() {
		this.spd -= grav;
		this.y -= this.spd;
		if (this.y >= screen_height) {
			this.y = screen_height;
			this.spd = 0;
		} else if (this.height >= this.y) {
			this.y = this.height;
			this.spd = 0;
		}
	};
	draw() {
		ctx.beginPath();
		ctx.rect(this.x, this.y - this.height, this.width, this.height);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.closePath();
	}
}

class Pipes extends Entity {
	color = '#007F00';
	gapBottom; gapTop;

	constructor(...args) {
		var gapTop = args.pop();
		var gapBottom = args.pop();
		super(...args);
		this.gapTop = gapTop;
		this.gapBottom = gapBottom;
		this.setBodyCollision('box', 'bottom-left', 'none');
	}
	update() {
		this.x -= pipe_spd;
		if (this.x < -this.width)
			deleteSprite(this.id);
	};
	draw() {
		if (this.gapTop > 0) {
			ctx.beginPath();
			ctx.rect(this.x, this.y, this.width, this.gapTop);
			ctx.fillStyle = this.color;
			ctx.fill();
			ctx.closePath();
		}
		if (this.gapBottom < this.height) {
			ctx.beginPath();
			ctx.rect(this.x, this.height - this.gapBottom, this.width, this.gapBottom);
			ctx.fillStyle = this.color;
			ctx.fill();
			ctx.closePath();
		}
	}
}

setBuild({
	'Bird':  (...args) =>
	{
		return new Bird(...args);
	},
	'Pipes': (...args) =>
	{
		return new Pipes(...args);
	}
});

function birdJump() {
	for (let id in spriteSheet)
		if (spriteSheet[id] instanceof Bird)
			spriteSheet[id].spd = max_spd;
}

function gameMainLoop() {
	if (pressedKey(up))
		birdJump();

	updateSprites();
	spriteCollisions();

	ctx.clearRect(0, 0, screen_width, screen_height);
	drawSprites();
}

function addPipes() {
	var width = 20;
	var height = screen_height / ratio;
	var gapLength = 40;
	var gapTop = (Math.random() * (height - gapLength - 10)) + 5;
	var gapBottom = height - gapTop - gapLength;
	gapTop *= ratio;

	addSprite('Pipes', true, true, true, screen_width, 0, width, height, gapTop, gapBottom);
}

function startGame() {
	clearSprites();
	addSprite('Bird', true, true, true, 50, screen_height / 2, 20, 20);
	setAsyncInterval(gameMainLoop, 20);
	setAsyncInterval(addPipes, 2500);
}

startGame();