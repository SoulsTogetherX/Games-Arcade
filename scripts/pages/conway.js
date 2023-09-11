const gameBoard = document.getElementById("game-window");
const [ctx, screen_width, screen_height, ratio] = render(gameBoard, 500, 1);

	// Board Variables
var boardSize = 40;
var pixelsWidth = (screen_width/boardSize);
var pixelsHeight = (screen_height/boardSize);

	// Sets up board
let board = Array.from(Array(boardSize), (_, r) => Array.from(Array(boardSize), (_, c) => 0b00));

	// Other Variables
paused = true;
cursor_x = (boardSize >> 1); cursor_y = cursor_x;

	// Keys
var left = 37, up = 38, right = 39, down = 40, pause = 32, select = 90, clear = 67;
blacklist_key = [left, up, right, down, pause, select, clear];

const mod = (n, m) => {return (((n % m) + m) % m);}

	// GameBoard Drawing
function drawGrid() {
		// Clears the screen
	ctx.clearRect(0, 0, screen_width, screen_height);

	for (let r = 0; r < boardSize; r++) {
		for (let c = 0; c < boardSize; c++) {
			ctx.beginPath();
			ctx.rect(c*pixelsWidth, r*pixelsHeight, pixelsWidth + 1, pixelsHeight + 1);
			ctx.fillStyle = (board[r][c] & 1) ? "#FFFFFF" : "#000000";
			ctx.fill();
			ctx.closePath();
		}
	}
}

function updateGrid() {
	for (let r = 0; r < boardSize; r++) {
		for (let c = 0; c < boardSize; c++) {
			var count =  ((board[mod(r-1, boardSize)][mod(c+1, boardSize)] & 0b01)
						+ (board[mod(r-1, boardSize)][mod(c,   boardSize)] & 0b01)
						+ (board[mod(r-1, boardSize)][mod(c-1, boardSize)] & 0b01)
						+ (board[mod(r,   boardSize)][mod(c+1, boardSize)] & 0b01)
						+ (board[mod(r,   boardSize)][mod(c-1, boardSize)] & 0b01)
						+ (board[mod(r+1, boardSize)][mod(c+1, boardSize)] & 0b01)
						+ (board[mod(r+1, boardSize)][mod(c,   boardSize)] & 0b01)
						+ (board[mod(r+1, boardSize)][mod(c-1, boardSize)] & 0b01));
			if (count == 3 || (count == 2 && (board[r][c] & 0b01)))
				board[r][c] |= 0b10;
			else
				board[r][c] &= 0b01;
		}
	}

	for (let r = 0; r < boardSize; r++)
		for (let c = 0; c < boardSize; c++)
			board[r][c] >>= 1;
}

function drawCursor() {
	ctx.beginPath();
	ctx.rect(cursor_x*pixelsWidth, cursor_y*pixelsHeight, pixelsWidth, pixelsHeight);
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#FF0000';
	ctx.stroke();
	ctx.closePath();
}

function gameMainLoop() {
	if (pressedKey(pause))
		paused ^= 1;
	else if (paused) {
		if (pressedKey(select))
			board[cursor_y][cursor_x] ^= 0b11;
		else if (pressedKey(clear))
			clearGrid();
		else if (heldKeys[left])
			cursor_x = mod(cursor_x - 1, boardSize);
		else if (heldKeys[up])
			cursor_y = mod(cursor_y - 1, boardSize);
		else if (heldKeys[right])
			cursor_x = mod(cursor_x + 1, boardSize);
		else if (heldKeys[down])
			cursor_y = mod(cursor_y + 1, boardSize);
	}

	drawGrid();
	if (paused)
		drawCursor();
	else
		updateGrid();
}

function clearGrid() {
	for (let r = 0; r < boardSize; r++)
		for (let c = 0; c < boardSize; c++)
			board[r][c] = 0b00;
}

gameIntervalId = setAsyncInterval(gameMainLoop, 100);