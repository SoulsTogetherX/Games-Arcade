class Blank {
	collisionMaps = [{type: undefined, center: undefined, objs: 'none'}];
	constructor(id, collisional, updatable, visible, x, y, width, height) {
		this.width = width * ratio;
		this.height = height * ratio;
		this.id = id;
		this.x = x;
		this.y = y;
		this.collisional = collisional;
		this.updatable = updatable;
		this.visible = visible;
	}
	update() {};
	draw() {};
	setBodyCollision(type, center, objs, func) {
		this.collisionMaps[0] = {type: type, center: center, objs: objs, func: func};
	}
	addCollision(type, center, objs, func) {
		this.collisionMaps.push({type: type, center: center, objs: objs, func: func});
	}
};

const spriteSheet = [];
const collisionalSprites = [];
const updatableSprites = [];
const visibleSprites = [];
const spriteClassification = new Map();
const unused_Indexes = [];
var spritesBuild = {};

function render(gameBoard, side = 500, aspectRatio = 1) {
	const ratio = window.devicePixelRatio || 1;

	if (typeof side === 'string')
		side = (parseInt(side) * gameBoard.parent.width)/100

	gameBoard.width  = (side * ratio);
	gameBoard.height = (side * ratio) * aspectRatio;

	let ctx = gameBoard.getContext('2d');
	const screen_width = gameBoard.width;
	const screen_height = gameBoard.height;
	return [ctx, screen_width, screen_height, ratio];
}

function setBuild(build) {
	spritesBuild = build;
}

function addSprite(id, collision, update, visible, ...args) {
	const spriteId = unused_Indexes.length ? unused_Indexes.pop() : spriteSheet.length;
	const sprite = spritesBuild[id](spriteId, collision, update, visible, ...args);

	spriteSheet[spriteId] = sprite;
	if (spriteClassification.has(sprite.constructor.name))
		spriteClassification.get(sprite.constructor.name).push(sprite);
	else
		spriteClassification.set(sprite.constructor.name, [sprite]);

	if (collision)
		collisionalSprites.push(sprite);
	if (update)
		updatableSprites.push(sprite);
	if (visible)
		visibleSprites.push(sprite);

	return spriteId;
}

function deleteSprite(id) {
	const sprite = spriteSheet[id];
	const array = spriteClassification.get(sprite.constructor.name);
	for (let idx in array) {
		if (id === array[idx].id) {
			array.splice(idx, 1);
			break;
		}
	}
	if (sprite.collisional)
		for (let idx in collisionalSprites) {
			if (id === collisionalSprites[idx].id) {
				collisionalSprites.splice(idx, 1);
				break;
			}
		}
	if (sprite.updatable)
		for (let idx in updatableSprites) {
			if (id === updatableSprites[idx].id) {
				updatableSprites.splice(idx, 1);
				break;
			}
		}
	if (sprite.visible) {
		for (let idx in visibleSprites) {
			if (id === visibleSprites[idx].id) {
				visibleSprites.splice(idx, 1);
				break;
			}
		}
	}
	spriteSheet[id] = new Blank();
	unused_Indexes.push(id);
}

function updateSprites() {
	for (let spr of updatableSprites)
		spr.update();
}

function drawSprites() {
	for (let spr of visibleSprites)
		spr.draw();
}

function clearSprites() {
	spriteSheet.length = 0;
	unused_Indexes.length = 0;
	collisionalSprites.length = 0;
	updatableSprites.length = 0;
	visibleSprites.length = 0;
	spriteClassification.clear();
}

function getCollision(obj, map) {
	var x1 = obj.x, x2 = obj.x, y1 = obj.y, y2 = obj.y;
	switch(map.center) {
		case 'bottom-left':
			x2 += obj.width;
			y2 += obj.height;
		break;
		case 'bottom-center':
			x1 -= obj.width / 2;
			x2 += obj.width / 2;
			y2 += obj.height;
		break;
		case 'bottom-right':
			x1 -= obj.width;
			y2 += obj.height;
		break;
		case 'middle-left':
			x2 += obj.width;
			y1 -= obj.height / 2;
			y2 += obj.height / 2;
		break;
		case 'middle-center':
			x1 -= obj.width / 2;
			x2 += obj.width / 2;
			y1 -= obj.height / 2;
			y2 += obj.height / 2;
		break;
		case 'middle-right':
			x1 -= obj.width;
			y1 -= obj.height / 2;
			y2 += obj.height / 2;
		break;
		case 'top-left':
			x2 += obj.width;
			y1 -= obj.height;
		break;
		case 'top-center':
			x1 -= obj.width / 2;
			x2 += obj.width / 2;
			y1 -= obj.height;
		break;
		case 'top-right':
			x1 -= obj.width;
			y1 -= obj.height;
		break;
	}
	return [x1, x2, y1, y2];
}

function checkCollision(obj, collider, map) {
	const [x1,  x2,  y1,  y2] = getCollision(obj, map);
	const [x1_, x2_, y1_, y2_] = getCollision(collider, collider.collisionMaps[0]);

	if ((x1 <= x2_) && (x1_ <= x2) && (y1 <= y2_) && (y1_ <= y2)) {
		return true;
	}
	return false;
}

function spriteCollisions() {
	for (let self of collisionalSprites) {
		for (let map of self.collisionMaps) {
			if (map.objs === 'all') {
				for (let id2 in spriteSheet) {
					if (id !== id2 && 'Blank' !== spriteSheet[id2].constructor.name && checkCollision(self, spriteSheet[id2], map)) {
						map.func(self, spriteSheet[id2]);
					}
				}
			} else if (map.objs !== 'none') {
				for (let name of map.objs) {
					if (spriteClassification.has(name)) {
						for (let collider of spriteClassification.get(name)) {
							if (self.id !== collider.id && checkCollision(self, collider, map)) {
								map.func(self, collider);
							}
						}
					}
				}
			}
		}
	}
}