class Blank {
	collisionMap = {type: undefined, center: undefined, objs: 'none'};
	chunksPos = [-1,-1,-1,-1];
	constructor(id, collisional, updatable, visible, x, y, width, height, ratio = 1) {
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
		this.collisionMap = {type: type, center: center, objs: objs, func: func};
		addToChunks(this);
	}
};

const spriteSheet = [];
const collisionalSprites = [];
const chunks = [];
const updatableSprites = [];
const visibleSprites = [];
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

function createChunks(numH, numV) {
	const	HChunk	= (screen_width/numH),
			VChunk	= (screen_height/numV),
			HInc	= (HChunk / 2),
			VInc	= (VChunk / 2);
	numH = HInc*(numH << 1);
	numV = VInc*(numV << 1);

	for (var posV = -VInc; posV < numV; posV += VInc) {
		const temp = [];
		for (var posH = -HInc; posH < numH; posH += HInc)
			temp.push([posH, posH + HChunk, posV, posV + VChunk, new Map()]);
		chunks.push(temp)
	}
}

function addToChunks(obj) {
	const [x1, x2, y1, y2] = getCollision(obj);
	var stH = 0, endH = chunks[0].length - 1, stV = 0, endV = chunks.length - 1;

	var len = chunks[0].length - 1;
	while(stH < len && chunks[0][stH][1] < x1) stH++;
	while(endH > 0 && chunks[0][endH][0] > x2) endH--;

	len = chunks.length - 1;
	while(stV < len && chunks[stV][0][3] < y1) stV++;
	while(endV > 0 && chunks[endV][0][2] > y2) endV--;

	obj.chunksPos = [stH, endH, stV, endV];
	for (var idxV = stV; idxV <= endV; idxV++)
		for (var idxH = stH; idxH <= endH; idxH++) {
			const objSet = chunks[idxV][idxH][4];
			if (objSet.has(obj.constructor.name))
				objSet.get(obj.constructor.name).push(obj.id);
			else
				objSet.set(obj.constructor.name, [obj.id]);
		}
}

function setBuild(build) {
	spritesBuild = build;
}

function addSprite(id, collision, update, visible, ...args) {
	const spriteId = unused_Indexes.length ? unused_Indexes.pop() : spriteSheet.length;
	const obj = spritesBuild[id](spriteId, collision, update, visible, ...args);

	spriteSheet[spriteId] = obj;
	if (collision)
		collisionalSprites.push(obj);
	if (update)
		updatableSprites.push(obj);
	if (visible)
		visibleSprites.push(obj);

	return spriteId;
}

function replaceSprite(id, ...args) {
	deleteSprite(id);
	return addSprite(...args);
}

function getSprite(id) {
	return spriteSheet[id];
}

function deleteSprite(id) {
	const obj = spriteSheet[id];
	if (obj.collisional) {
		const [stH, endH, stV, endV] = obj.chunksPos;
		for(var idxV = stV; idxV <= endV; idxV++) {
			for(var idxH = stH; idxH <= endH; idxH++) {
				const sprites = chunks[idxV][idxH][4].get(obj.constructor.name);

				for (let idx in sprites) {
					if (id === sprites[idx]) {
						sprites.splice(idx, 1);
						break;
					}
				}
			}
		}

		for (let idx in collisionalSprites) {
			if (id === collisionalSprites[idx].id) {
				collisionalSprites.splice(idx, 1);
				break;
			}
		}
	}
	if (obj.updatable)
		for (let idx in updatableSprites) {
			if (id === updatableSprites[idx].id) {
				updatableSprites.splice(idx, 1);
				break;
			}
		}
	if (obj.visible) {
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
	for(chunkRow of chunks)
		for(chunk of chunkRow)
			chunk[4].clear();
}

function getCollision(obj) {
	var x1 = obj.x, x2 = obj.x, y1 = obj.y, y2 = obj.y;
	switch(obj.collisionMap.center) {
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

function moveSprite(obj, newX, newY) {
		// Needed variables
	const [oX, oY] = [obj.x, obj.y];
	obj.x = newX; obj.y = newY;

	if (!obj.collisional)
		return;

	const [x1, x2, y1, y2] = getCollision(obj, obj.collisionMap);
	var [newStH, newEndH, newStV, newEndV] = obj.chunksPos;
	changed = false;

		// New chunk bounds
			// Horizontal
	if (newX > oX) {
		const len = chunks[0].length - 1, row = chunks[0];
		if (newStH < len) {
			changed = true;
			while(true)
				if (row[newStH][1] >= x1 || (++newStH >= len))
					break;
		}
		if (newEndH < len) {
			changed = true;
			while(true)
				if (row[newEndH][1] >= x2 || (++newEndH >= len))
					break;
		}
	} else if (newX < oX) {
		const row = chunks[0];
		if (newStH > 0) {
			changed = true;
			while(true)
				if ((row[newStH][0] <= x1) || (--newStH <= 0))
					break;
		}
		if (newEndH > 0) {
			changed = true;
			while(true)
				if ((row[newEndH][0] <= x2) || (--newEndH <= 0))
					break;
		}
	}
			// Vertical
	if (newY > oY) {
		const len = chunks.length - 1;
		if (newStV < len) {
			changed = true;
			while(true) {
				if (chunks[newStV][0][3] >= y1 || (++newStV >= len))
					break;
			}
		}
		if (newEndV < len) {
			changed = true;
			while(true)
				if (chunks[newEndV][0][3] >= y2 || (++newEndV >= len))
					break;
		}
	} else if (newY < oY) {
		if (newStV > 0) {
			changed = true;
			while(true)
				if ((chunks[newStV][0][2] <= y1) || (--newStV <= 0))
					break;
		}
		if (newEndV > 0) {
			changed = true;
			while(true)
				if ((chunks[newEndV][0][2] <= y2) || (--newEndV <= 0))
					break;
		}
	}

		// Updates relevant chunks
	if (changed) {
			// Removing
		const [stH, endH, stV, endV] = obj.chunksPos;
		for(var idxV = stV; idxV <= endV; idxV++) {
			for(var idxH = stH; idxH <= endH; idxH++) {
				const sprites = chunks[idxV][idxH][4].get(obj.constructor.name);
				for (let idx in sprites) {
					if (obj.id === sprites[idx]) {
						sprites.splice(idx, 1);
						break;
					}
				}
			}
		}
			// Adding
		for(var idxV = newStV; idxV <= newEndV; idxV++) {
			for(var idxH = newStH; idxH <= newEndH; idxH++) {
				const sprites = chunks[idxV][idxH][4];
				if (sprites.has(obj.constructor.name))
					sprites.get(obj.constructor.name).push(obj.id);
				else
					sprites.set(obj.constructor.name, [obj.id]);
			}
		}
			// Updates chunk index for object
		obj.chunksPos = [newStH, newEndH, newStV, newEndV];
	}
}

function checkCollision(obj, collider) {
	const [x1,  x2,  y1,  y2] = getCollision(obj, obj.collisionMap);
	const [x1_, x2_, y1_, y2_] = getCollision(collider, collider.collisionMap);

	if ((x1 <= x2_) && (x1_ <= x2) && (y1 <= y2_) && (y1_ <= y2)) {
		return true;
	}
	return false;
}

function spriteCollisions() {
	for (let self of collisionalSprites) {
		const [stH, endH, stV, endV] = self.chunksPos;
		const map = self.collisionMap;

		if (map.objs === 'all') {
			const spriteIdxs = new Set();
			for(var idxV = stV; idxV <= endV; idxV++)
				for(var idxH = stH; idxH <= endH; idxH++)
					(chunks[idxV][idxH][4].keys()).forEach(id => spriteIdxs.add(id))

			for (let id of spriteIdxs)
				if (self.id !== id && checkCollision(self, spriteSheet[id]))
					map.func(self, spriteSheet[id]);
		} else if (map.objs !== 'none') {
			const spriteIdxs = new Set();
			for(var idxV = stV; idxV <= endV; idxV++) {
				for(var idxH = stH; idxH <= endH; idxH++) {
					for(const name of map.objs) {
						const sprites = chunks[idxV][idxH][4].get(name);
						if (sprites !== undefined)
							sprites.forEach(id => spriteIdxs.add(id))
					}
				}
			}

			for (let id of spriteIdxs)
				if (self.id !== id && checkCollision(self, spriteSheet[id]))
					map.func(self, spriteSheet[id]);
		}
	}
}

function getMousePosition(canvas, e) {
	let rect = canvas.getBoundingClientRect();
	let x = e.clientX - rect.left;
	let y = e.clientY - rect.top;
	return {x, y};
}