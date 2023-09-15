const gameBoard = document.getElementById("game-window");
const [ctx, screen_width, screen_height, ratio] = render(gameBoard, 600, 1);

//
//		REMOVE THIS WHEN DONE
//
function createBinaryString (nMask) {
  // nMask must be between -2147483648 and 2147483647
  for (var nFlag = 0, nShifted = nMask, sMask = ""; nFlag < 32;
       nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1);
  return sMask;
}

var game_spd = 20;
var mainBoard, next_board = -1, boardWon = 0;
var currentTurn = false, AIWin;
	// X = << 0; O = << 1; T = << 0 && << 1
const WinMasks		= new Uint32Array([84,5376,344064,16644,66576,266304,17472,263172]);
const StateMasks	= new Uint32Array([12,48,192,768,3072,12288,49152,196608,786432]);
const pastBoard = [];

gameBoard.addEventListener("mousedown", function(e) {
	e.preventDefault();

	if (e.which === 1) {
		const	{x, y}	= getMousePosition(gameBoard, e);
		const	temp_c	= ((x * 3) / screen_width),
				temp_r	= ((y * 3) / screen_height);

		boardWon = move((Math.trunc(temp_r * 3) % 3) * 3 + Math.trunc(temp_c * 3) % 3, Math.trunc(temp_r)*3 + Math.trunc(temp_c));
	} else if (e.which === 3)
		undo();
});

function drawMark(x, y, height, width, mark) {
	var lineWidth = ((width + height) / 50) || 1;
	var coverage = 0.8;
	switch(mark) {
		case 1:
			ctx.beginPath();
			ctx.lineTo(x + (width*coverage), y + (height*coverage));
			ctx.lineTo(x + (width*(1-coverage)), y + (height*(1-coverage)));

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = '#666666';
			ctx.stroke();

			ctx.beginPath();
			ctx.lineTo(x + (width*(1-coverage)), y + (height*coverage));
			ctx.lineTo(x + (width*coverage), y + (height*(1-coverage)));

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = '#666666';
			ctx.stroke();
		break;
		case 2:
			ctx.beginPath();
			ctx.ellipse(x + (width/2), y + (height/2), ((width*coverage)/2), ((height*coverage)/2), 0, 0, Math.PI * 2);

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = '#666666';
			ctx.stroke();

			ctx.beginPath();
		break;
		case 3:
			ctx.beginPath();
			ctx.lineTo(x + (width / 2), y + (height*coverage));
			ctx.lineTo(x + (width / 2), y + (height*(1-coverage)));

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = '#666666';
			ctx.stroke();

			ctx.beginPath();
			ctx.lineTo(x + (width*coverage), y + (height*(1-coverage)));
			ctx.lineTo(x + (width*(1-coverage)), y + (height*(1-coverage)));

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = '#666666';
			ctx.stroke();
		break;
	}
}

function drawBoard(x, y, height, width, board) {
	var lineWidth = ((width + height) / 200) || 1;

	ctx.beginPath();
	ctx.rect(x, y + (height / 3), width, lineWidth);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.rect(x, y + ((height * 2) / 3), width, lineWidth);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.rect(x + (width / 3), y, lineWidth, height);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.rect(x + ((width * 2) / 3), y, lineWidth, height);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();
	ctx.closePath();

	for(let idx = 0; idx < 9; idx++){
		r = Math.trunc(idx / 3);
		c = idx % 3;
		board >>= 2;
		drawMark(x + c*(width/3), y + r*(height/3), (width/3), (height/3), board & 3);
	}
}

function draw() {
	if (boardWon === 0) {
		drawBoard(0, 0, screen_width, screen_height);

		for(let idx in mainBoard) {
			const	r		= Math.trunc(idx / 3),
					c		= idx % 3,
					board	= mainBoard[idx],
					mark	= board & 3;

			if (mark)
				drawMark(c*(screen_width/3), r*(screen_height/3), (screen_width/3), (screen_height/3), mark);
			else {
				const	x		= c*(screen_width/3),
						y		= r*(screen_height/3),
						width	= (screen_width/3),
						height	= (screen_height/3);
				drawBoard(x, y, width, height, board);
				if (next_board != -1 && next_board != idx) {
					ctx.beginPath();
					ctx.rect(x, y, width, height);
					ctx.fillStyle = "#FFFFFF7F";
					ctx.fill();
					ctx.closePath();
				}
			}
		}
		return;
	}

	drawMark(0, 0, screen_width, screen_height, boardWon);
}

function checkMainBoard() {
	var state = 0;
	for (var idx = mainBoard.length - 1; idx >= 0; idx--) {
		state |= (mainBoard[idx] & 3);
		state <<= 2;
	}

	if (WinMasks.some((mask) => {
		return ((mask & (state >> currentTurn)) === mask) && ((mask & (state >> !currentTurn)) === 0);
	})) {
		return (1 << currentTurn);
	} else if (findAvailable(state).length === 0) {
		return 3;
	}
	return 0;
}

function move(idx_Mark, idx_Board) {
	if (!boardWon) {
		const	offSet = ((idx_Mark + 1) << 1);

		console.log("1", next_board, idx_Board, idx_Mark, createBinaryString(mainBoard[idx_Board]));
		if ((next_board === -1 || next_board === idx_Board) && !(mainBoard[idx_Board] & (3 << offSet))) {
			pastBoard.push([idx_Board, mainBoard[idx_Board], next_board]);

			mainBoard[idx_Board] |= (1 << (offSet + currentTurn));
			if (WinMasks.some((mask) => {
				return ((mask & (mainBoard[idx_Board] >> currentTurn)) === mask) && ((mask & (mainBoard[idx_Board] >> !currentTurn)) === 0);
			})) {
				mainBoard[idx_Board] |= (1 << currentTurn);
			} else if (findAvailable(mainBoard[idx_Board]).length === 0)
				mainBoard[idx_Board] |= 3;
			boardWon = checkMainBoard();	
			currentTurn = !currentTurn;

			next_board = idx_Mark;
			if (mainBoard[next_board] & 3)
				next_board = -1;
		}
	}

	return boardWon;
}

function undo() {
	if (pastBoard.length) {
		const past = pastBoard.pop();
		mainBoard[past[0]] = past[1];
		next_board = past[2];
		currentTurn = !currentTurn;
		boardWon = 0;
	}
}

function gameMainLoop() {
	ctx.clearRect(0, 0, screen_width, screen_height);
	draw();
}

function gameSetUp() {
	mainBoard = new Uint32Array([0,0,0,0,0,0,0,0,0]);

	setAsyncInterval(gameMainLoop, game_spd);
}

gameSetUp();



// Unfinished AI
function findAvailable(board, idx) {
	if (board & 3)
		return [];

	const available = [];
	StateMasks.forEach((mask, mov) => {
		if (!(board & mask)) {
			available.push([mov, idx]);
		}
	});
	return available;
}

function findAllAvailable() {
	if (next_board === -1) {
		const available = [];
		for(let idx = 0; idx < 9; idx++) {
			const board = mainBoard[idx];
			if (board & 3)
				continue;

			StateMasks.forEach((mask, mov) => {
				if (!(board & mask)) {
					available.push([mov, idx]);
				}
			});
		}
		return available;
	} else
		return findAvailable(mainBoard[next_board], next_board);
}

function findCritical(board, idx) {
	criticals = [];
	board >>= currentTurn;

	WinMasks.forEach((mask) => {
		const	check	= ((board & mask) ^ mask),
				check2	= !((currentTurn ? (board << 1) : (board >> 1)) & mask);
		if (check && check2 && !(check & check - 1)) {
			StateMasks.some((mask, mov) => {
				if (check & mask)
					criticals.push([mov, idx]);
			});
		}
	});
	return criticals;
}

function findAllCritical() {
	if (next_board === -1) {
		criticals = [];
		for(let idx = 0; idx < 9; idx++) {
			const board = mainBoard[idx] >> currentTurn;

			WinMasks.forEach((mask) => {
				const	check	= ((board & mask) ^ mask),
						check2	= !((currentTurn ? (board << 1) : (board >> 1)) & mask);
				if (check && check2 && !(check & check - 1)) {
					StateMasks.some((mask, mov) => {
						if (check & mask)
							criticals.push([mov, idx]);
					});
				}
			});
		}
		return criticals;
	} else
		return checkForCritical(mainBoard[next_board], next_board);
}


function AIChild(depth) {
	if (depth <= 0)
		return [0, 0];

	//			[Wins,	LosesOrDraws]
	let BW	=	[0,		0			];

	const available = findAllAvailable();
	for (mov of available) {
		const state = move(mov[0], mov[1]);
		if (!state)
			BW = Array.from(AIChild(depth - 1), (num, idx) => {return num + BW[idx];});
		else {
			if (state === AIWin)
				BW[0]++;
			else
				BW[1]++;
		}
		undo();
	}

	return BW;
}

function runAI() {
	if (boardWon)
		return;

	console.log(AIChild(1));
	const available = findAllAvailable();
	move(available[0][0], available[0][1])
}