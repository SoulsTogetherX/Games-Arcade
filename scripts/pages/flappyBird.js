const gameBoard = document.getElementById("game-window");
const [ctx, screen_width, screen_height, ratio] = render(gameBoard, 250, 0.8);

	// Keys
var up = 32;
blacklist_key = [up];

const grav = 0.1, max_spd = 2 + grav;
const pipe_spd = 1; 

class Entity extends Blank {}

class Bird extends Entity {
	spd = 0;
	color = '#FFFFFF';
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'top-left', ['Pipes'], async (obj, collider) => {
			if ((obj.y - obj.height < collider.gapTop) ||
				(collider.height - collider.gapBottom < obj.y))
			{
				await clearAllAsyncIntervals();
				setAsyncInterval(startGame, 2000, true, 0);
			}
		});
	}
	update() {
		this.spd -= grav;
		var oY = this.y - this.spd;
		if (oY > screen_height) {
			oY = screen_height;
			this.spd = 0;
		} else if (oY < this.height) {
			oY = this.height;
			this.spd = 0;
		}

		moveSprite(this, this.x, oY);
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
		moveSprite(this, this.x - pipe_spd, this.y);
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
			ctx.rect(this.x, this.y + this.height - this.gapBottom, this.width, this.gapBottom);
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

var temp = false;

function addPipes() {
	var gapLength = 50 * ratio;
	var gapTop = (Math.random() * (screen_height - (1.1 * gapLength)));
	var gapBottom = screen_height - gapTop - gapLength;

	addSprite('Pipes', true, true, true, screen_width, 0, 20 * ratio, screen_height, gapBottom, gapTop);
}

function startGame() {
	clearSprites();
	addSprite('Bird', true, true, true, 50, screen_height / 2, 20 * ratio, 20 * ratio);
	setAsyncInterval(gameMainLoop, 10);
	setAsyncInterval(addPipes, 2500);
}

createChunks(1, 1);
startGame();