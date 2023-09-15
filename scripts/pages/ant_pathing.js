const gameBoard = document.getElementById("game-window");
const [ctx, screen_width, screen_height, ratio] = render(gameBoard, 500, 1);

game_spd = 20;
ant_spd = 2*ratio; 
maxFoodTime = 400;
maxWanderTime = 800;
maxAngle = Math.PI / 30;
scentFrequency = 20;
scentDuration = 100000;
scentDecay = 0.94;

class Entity extends Blank {
	color = '#000000';
	draw() {
		ctx.beginPath();
		ctx.ellipse(this.x, this.y, (this.width / 2), (this.height / 2), 0, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.closePath();
	}
}

class Home extends Entity {
	color = '#FFFFFF';
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'middle-center', 'none');
	}
}

class Food extends Entity {
	color = '#00FF007F';
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'middle-center', 'none');
	}
}

class Clear extends Entity {
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'middle-center', ['Food'], (self, detected) => {
			deleteSprite(detected.id);
		});
		this.wait = 1;
	}
	update() {
		if (this.wait-- <= 0)
			deleteSprite(this.id);
	}
}

class Sensor extends Entity {
	color = '#0000FF';
	constructor(...args) {
		var distanceOffset = args.pop();
		var angleOffset = args.pop();
		var owner = args.pop();

		super(...args);

		this.distanceOffset = distanceOffset;
		this.angleOffset = angleOffset;
		this.owner = owner;

		this.setBodyCollision('box', 'middle-center', ['Food', 'Food_Scent', 'Home', 'Home_Scent', 'Avoid_Scent'], (self, detected) => {
			switch(detected.constructor.name) {
				case 'Home_Scent':
					self.homeScents += (scentDuration - detected.duration);
				break;
				case 'Food_Scent':
					self.foodScents += (scentDuration - detected.duration);
				break;
				case 'Avoid_Scent':
					self.foodScents -= (scentDuration - detected.duration) / 2;
				break;
				case 'Home':
					self.home = true;
				break;
				default:
					self.food = true;
				break;
			}
		});

		this.init();
	}
	init() {
		moveSprite(	this, 
					this.owner.x + this.distanceOffset * Math.cos(this.owner.direction + this.angleOffset),
					this.owner.y + this.distanceOffset * Math.sin(this.owner.direction + this.angleOffset));
		this.home = false;
		this.food = false;
		this.homeScents = 1;
		this.foodScents = 1;
	}
}

class Ant extends Entity {
	color = '#7F7F00';
	direction = Math.random() * 2 * Math.PI;
	scentTime = 200; wanderTime = maxWanderTime; foodTime = 0;
	goHome = false; looking = true;
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'middle-center', ['Food', 'Food_Scent', 'Home', 'Home_Scent', 'Avoid_Scent'], (self, detected) => {
			switch(detected.constructor.name) {
				case 'Food':
					if (!self.goHome) {
						self.direction += Math.PI;
						self.goHome = true;
						self.looking = false;
						self.color = '#007F7F';
						self.foodTime = maxFoodTime;
						addSprite('Food_Scent', false, true, false, this.x, this.y, 50, 50);
						this.scentTime = scentFrequency;
					}
				break;
				case 'Home':
					if (self.goHome || !self.looking) {
						self.direction += Math.PI;
						self.goHome = false;
						self.looking = true;
						self.color = '#7F7F00';
						self.wanderTime = maxWanderTime;
						addSprite('Home_Scent', false, true, false, this.x, this.y, 50, 50);
						this.scentTime = scentFrequency;
					}
				break;
				default:
					detected.duration *= scentDecay;
				break;
			}
		});
	}
	update() {
		const decision = (LScent, CScent, RScent, LGoal, CGoal, RGoal) => {
			if (!CGoal && !LGoal && !RGoal) {
				CScent += LScent < RScent ? LScent : RScent;
				if (Math.abs(CScent - LScent) <= 2 && Math.abs(CScent - RScent) <= 2)
					return 0;
				else if (LScent > RScent)
					return 1;
				else if (RScent > LScent)
					return 3;	
			} else if (!CGoal || LGoal !== RGoal) {
				if (LGoal)
					return 1;
				else
					return 3;
			}

			return 2;
		};

		switch(
				(this.goHome || !this.looking) ?
				decision(this.LSensor.homeScents, this.CSensor.homeScents, this.RSensor.homeScents, this.LSensor.home, this.CSensor.home, this.RSensor.home) :
				decision(this.LSensor.foodScents, this.CSensor.foodScents, this.RSensor.foodScents, this.LSensor.food, this.CSensor.food, this.RSensor.food)
		) {
			case 0:
				// Wander
				this.direction += (Math.random() - 0.5) * maxAngle * 2;
			break;
			case 1:
				// Left
				this.direction -= maxAngle;
			break;
			case 2:
				// Center
				
			break;
			case 3:
				// Right
				this.direction += maxAngle;
			break;
		}

		this.LSensor.init();
		this.CSensor.init();
		this.RSensor.init();

		var X = this.x + Math.cos(this.direction) * ant_spd,
			Y = this.y + Math.sin(this.direction) * ant_spd;

		if (X >= screen_width) {
			X = screen_width;
			this.direction = Math.PI - this.direction;
		}
		if (X < 0) {
			X = 0;
			this.direction = Math.PI - this.direction;
		}
		if (Y >= screen_height) {
			Y = screen_height;
			this.direction = -this.direction;
		}
		if (Y < 0) {
			Y = 0;
			this.direction = -this.direction;
		}
		moveSprite(this, X, Y);

		if (this.scentTime-- <= 0) {
			if (this.goHome)
				addSprite('Food_Scent', false, true, false, this.x, this.y, 20, 20);
			else if (this.looking)
				addSprite('Home_Scent', false, true, false, this.x, this.y, 20, 20);
			else
				addSprite('Avoid_Scent', false, true, false, this.x, this.y, 20, 20);
			this.scentTime = scentFrequency;
		}

		if (this.looking) {
			if (this.goHome) {
				if (this.foodTime-- <= 0) {
					this.direction += Math.PI;
					this.goHome = false;
					this.looking = false;
					this.color = '#7F7F00';
				}
			} else if (this.wanderTime-- <= 0) {
				this.direction += Math.PI;
				this.looking = false;
				this.color = '#7F7F7F';
			}
		}
	}
}

class Scent extends Entity {
	duration = scentDuration;
	constructor(...args) {
		super(...args);
		this.setBodyCollision('box', 'middle-center', 'none');
	}
	update() {
		if (this.duration <= 0.000001)
			deleteSprite(this.id);
		this.duration *= scentDecay;
	}
}

class Avoid_Scent extends Scent {
	color = '#7F000044';
}

class Food_Scent extends Scent {
	color = '#007F0044';
}

class Home_Scent extends Scent {
	color = '#00007F44';
}

setBuild({
	'Home':  (...args) =>
	{
		return new Home(...args);
	},
	'Food': (...args) =>
	{
		return new Food(...args);
	},
	'Clear': (...args) =>
	{
		return new Clear(...args);
	},
	'Sensor': (...args) =>
	{
		return new Sensor(...args);
	},
	'Ant': (...args) =>
	{
		var ant = new Ant(...args);
		ant.LSensor = spriteSheet[addSprite('Sensor', true, false, false, ant.x, ant.y, 20, 20, ant, -(Math.PI)/1.5, 20)];
		ant.CSensor = spriteSheet[addSprite('Sensor', true, false, false, ant.x, ant.y, 20, 20, ant, 0, 20)];
		ant.RSensor = spriteSheet[addSprite('Sensor', true, false, false, ant.x, ant.y, 20, 20, ant, (Math.PI)/1.5, 20)];
		return ant
	},
	'Home_Scent': (...args) =>
	{
		return new Home_Scent(...args);
	},
	'Food_Scent': (...args) =>
	{
		return new Food_Scent(...args);
	},
	'Avoid_Scent': (...args) =>
	{
		return new Avoid_Scent(...args);
	}
});

gameBoard.addEventListener("mousedown", function(e) {
	const {x, y} = getMousePosition(gameBoard, e);
	e.preventDefault();
	switch (e.which) {
		case 1:
			addSprite('Food', false, false, true, x, y, 20, 20);
		break;
		case 3:
			addSprite('Clear', true, true, false, x, y, 20, 20);
		break;
	}
});

function gameMainLoop() {
	updateSprites();
	spriteCollisions();

	ctx.clearRect(0, 0, screen_width, screen_height);
	drawSprites();
}

function gameSetUp() {
	addSprite('Home', false, false, true, screen_width / 2, screen_height / 2, 55, 55);
	for(var i=0; i<50; i++)
		addSprite('Ant', true, true, true, screen_width / 2, screen_height / 2, 10, 10);
	setAsyncInterval(gameMainLoop, game_spd);
}

createChunks(25, 25);
gameSetUp();