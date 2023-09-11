	// Class Definitions
class Tile {
	color = "#000000";
	wait = true;

	whatAmI() {
		return "E"
	}
}
class Empty extends Tile {}
class Apple extends Tile {
	color = "#FF0000";

	whatAmI() {
		return "A"
	}
}
class Deadly extends Tile {}
class SnakeHead extends Deadly {
	color = "#00FF00";

	whatAmI() {
		return "H"
	}
}
class SnakeTail extends Deadly {
	age = 0;
	color = "#00CC00";

	whatAmI() {
		return "T"
	}
}
class Wall extends Deadly {
	color = "#7F7F7F";

	whatAmI() {
		return "W"
	}
}

const gameBoard = document.getElementById("game-window");
const [ctx, screen_width, screen_height, ratio] = render(gameBoard, 500, 1);

	// Board Variables
var boardSize = 22;
var pixelsWidth = (screen_width/boardSize);
var pixelsHeight = (screen_height/boardSize);

	// Sets up board
let board = Array.from(Array(boardSize), (_, r) => Array.from(Array(boardSize), (_, c) => new Empty(r, c)));

	// Keys
var left = 37, up = 38, right = 39, down = 40;
let space_const = 32, left_const = 37, up_const = 38, right_const = 39, down_const = 40;
blacklist_key = [left, up, right, down];

	// Other Variables
var delay = 150;
var maxTail;
var apple;
var gameState = 0;
var snake_direction;

async function pauseOverlay() {
		// Grays background
	ctx.beginPath();
	ctx.rect(0, 0, screen_width, screen_height);
	ctx.fillStyle = "#F7F7F755";
	ctx.fill();

		// The triangle Pause Symbol
	ctx.beginPath();
	ctx.lineTo(screen_width * 0.45, screen_height * 0.45);
	ctx.lineTo(screen_width * 0.45, screen_height * 0.55);
	ctx.lineTo(screen_width * 0.55, screen_height * 0.5);

		// The outline
	ctx.lineWidth = 4;
	ctx.strokeStyle = '#666666';
	ctx.stroke();

		// The fill color
	ctx.fillStyle = "#EEEEEE";
	ctx.fill();

		// Ends triangle
	ctx.closePath();
}

	// Initializes everything for the game's start
async function gameStartup() {
		// Resets/initializes basic needed variables
	maxTail = 0;
	apple = false;
	snake_direction = up;

		// Adds Walls
	const lastIdx = boardSize - 1;
	for(var idx=0; idx<boardSize; idx++) {
		board[idx][0] = new Wall();
		board[idx][lastIdx] = new Wall();
		board[0][idx] = new Wall();
		board[lastIdx][idx] = new Wall();
	}

		// Clear Board
	for(var r=1; r<boardSize-1; r++)
		for(var c=1; c<boardSize-1; c++)
			board[r][c] = new Empty();

		// Places the snake in
	other = (boardSize >> 1);
	board[other - 2][other] = new SnakeHead();
	board[other - 1][other] = new SnakeTail();
	board[other][other] = new SnakeTail();
	board[other][other].age = 1;
	board[other][other].wait = false;
}

	// GameBoard Drawing
async function drawGrid() {
		// Clears the screen
	ctx.clearRect(0, 0, screen_width, screen_height);

	for (let r = 0; r < boardSize; r++) {
		for (let c = 0; c < boardSize; c++) {
			ctx.beginPath();
			ctx.rect(c*pixelsWidth, r*pixelsHeight, pixelsWidth + 1, pixelsHeight + 1);
			ctx.fillStyle = board[r][c].color;
			ctx.fill();
			ctx.closePath();
		}
	}
}

	// GameBoard Update Helper Functions
		// Checks next position and moves head if possible
async function moveHead(y, x) {
	if (!(board[y][x] instanceof Deadly)) {
		if (board[y][x] instanceof Apple) {
			maxTail++;
			apple = false;
		}
		board[y][x] = new SnakeHead();
	}
}

	// Main GameBoard Update
async function updateGrid() {
		// Keeps tracks game state for later
	var empty_tiles = [];
	var no_tail = true;
	var head_coords = undefined;

		// Updates general (snake tails)
	for (let y = 0; y < boardSize; y++) {
		for (let x = 0; x < boardSize; x++) {
			var tile = board[y][x];
			switch(tile.whatAmI()) {
				case "T":
					if (!tile.wait && ++tile.age > maxTail) {
						board[y][x] = new Empty();
						empty_tiles.push({x: x, y: y});
					}
					no_tail = false;
				break;
				case "H":
					head_coords = {x: x, y: y};
				break;
				case "E":
					empty_tiles.push({x: x, y: y});
				break;
			}
			tile.wait = false;
		}
	}

		// If head exists, update it's position
	if (head_coords) {
		if (heldKeys[left] && snake_direction != right) 
			snake_direction = left;
		else if (heldKeys[up] && snake_direction != down) 
			snake_direction = up;
		else if (heldKeys[right] && snake_direction != left) 
			snake_direction = right;
		else if (heldKeys[down] && snake_direction != up) 
			snake_direction = down;
		switch (snake_direction) {
			case left:
				await moveHead(head_coords.y, head_coords.x - 1);
				board[head_coords.y][head_coords.x - 1].wait = false;
			break;
			case up:
				await moveHead(head_coords.y - 1, head_coords.x);
				board[head_coords.y - 1][head_coords.x].wait = false;
			break;
			case right:
				await moveHead(head_coords.y, head_coords.x + 1);
				board[head_coords.y][head_coords.x + 1].wait = false;
			break;
			case down:
				await moveHead(head_coords.y + 1, head_coords.x);
				board[head_coords.y + 1][head_coords.x].wait = false;
			break;
		}
		board[head_coords.y][head_coords.x] = new SnakeTail();

			// Adds an apple if requested and head exists
		if (!apple) {
			const cords = empty_tiles[Math.floor(Math.random() * empty_tiles.length)];
			if (cords)
				board[cords.y][cords.x] = new Apple();
			apple = true;
		}
	}
	
	return (head_coords === undefined) + no_tail;
}

async function gameMainLoop() {
	await drawGrid();
	switch(gameState) {
		case 0:
			await gameStartup();
			gameState = 1;
		break;
		case 1:
			await pauseOverlay();
			gameBoard.addEventListener('click', function handleClick() {
				if (gameState == 1)
					gameState = 2;
			});
		break;
		case 2:
			if (await updateGrid() > 0) {
				await clearAllAsyncIntervals();
				await sleep(1000);
				setAsyncInterval(gameMainLoop, delay/10);
				gameState = 3;
			}
		break;
		case 3:
			if (await updateGrid() > 1) {
				await clearAllAsyncIntervals();
				setAsyncInterval(gameMainLoop, delay);
				gameState = 0;
			}
		break;
	}
}

setAsyncInterval(gameMainLoop, delay);