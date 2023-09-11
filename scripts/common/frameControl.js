const asyncIntervals = [];
const emptyIntervals = [];
const runningIntervals = [];
const heldKeys = {};
var blacklist_key = [];

/*
	-1 = not pressed	(when using updateKeys(key))
	0  = released
	1  = pressed down
	2  = held			(when using updateKeys(key))
*/
window.onkeydown = function(e) {
	if (!heldKeys[e.keyCode])
		heldKeys[e.keyCode] = 1; 
	if(blacklist_key.indexOf(e.keyCode) > -1)
		e.preventDefault();
}
window.onkeyup = function(e) {
	if (heldKeys[e.keyCode])
		heldKeys[e.keyCode] = 0; 
}

function setAsyncInterval(foo, wait, hold = false) {
	if (foo && typeof foo === "function") {
		const intervalId = emptyIntervals.length ? emptyIntervals.pop() : asyncIntervals.length;

		asyncIntervals[intervalId] = {running: true, func: foo, id: 0, ms: wait, st: (new Date()).getTime(), remain: 0};
		if (hold)
			asyncIntervals[intervalId].id = setTimeout(() => runAsyncInterval(intervalId), ms);
		else
			runAsyncInterval(intervalId);
		return intervalId;
	} else {
		throw new Error('Callback must be a function');
	}
};

async function runAsyncInterval(intervalId) {
	await asyncIntervals[intervalId].func();
	if (asyncIntervals[intervalId].running) {
		asyncIntervals[intervalId].st = (new Date()).getTime();
		asyncIntervals[intervalId].id = setTimeout(() => runAsyncInterval(intervalId), asyncIntervals[intervalId].ms);
	}
};

async function toggleAsyncInterval(intervalId) {
	asyncIntervals[intervalId].running ^= 1;
	if (asyncIntervals[intervalId].running) {
		asyncIntervals[intervalId].st = (new Date()).getTime() - asyncIntervals[intervalId].remain;
		asyncIntervals[intervalId].id = setTimeout(() => runAsyncInterval(intervalId), asyncIntervals[intervalId].remain);
	} else {
		asyncIntervals[intervalId].remain = asyncIntervals[intervalId].ms - ((new Date()).getTime() - asyncIntervals[intervalId].st);
		clearTimeout(asyncIntervals[intervalId].id);
	}
};

async function clearAsyncInterval(intervalId) {
	if (asyncIntervals[intervalId]) {
		emptyIntervals.push(intervalId);
		clearTimeout(asyncIntervals[intervalId].id);
		asyncIntervals[intervalId].running = false;
	}
};

async function clearAllAsyncIntervals() {
	for(let intervalId in asyncIntervals)
		await clearAsyncInterval(intervalId);
};

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

function pressedKey(key) {
	if (heldKeys[key] == 1) {
		heldKeys[key] = 2;
		return true;
	} else
		return false;
};

function releaseKey(key) {
	if (heldKeys[key] == 0) {
		heldKeys[key] = -1;
		return true;
	} else
		return false;
};

	// Pauses all activity if tab is hidden
document.addEventListener("visibilitychange", () => checkDocument(), true);
async function checkDocument() {
	if (document.hidden) {
		console.log("paused");
		for(const id in asyncIntervals)
			if (asyncIntervals[id].running) {
				await toggleAsyncInterval(id);
				runningIntervals.push(id);
			}
	} else {
		console.log("unpaused");
		for(const id of runningIntervals)
			await toggleAsyncInterval(id);
		runningIntervals.length = 0;
	}
}