function createPiece() {
	const type = Math.floor(Math.random() * SHAPES.length);
	const shape = SHAPES[type].map(row => row.slice()); // deep copy
	return {
			shape,
			color: COLORS[type],
			x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
			y: 0
	};
}

function drawBlock(ctx, x, y, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
	ctx.strokeStyle = '#000';
	ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
	const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
	gradient.addColorStop(0, '#4a1f6b');
	gradient.addColorStop(0.5, '#8b4f8f');
	gradient.addColorStop(1, '#d084b8');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
	stars.forEach(s => ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, s.size, s.size));

	for (let y = 0; y < ROWS; y++) {
			for (let x = 0; x < COLS; x++) {
					if (board[y][x]) {
							drawBlock(ctx, x, y, board[y][x]);
					}
			}
	}
}

function drawPiece(piece, context = ctx) {
	const size = (context === ctx) ? BLOCK_SIZE : Math.floor(BLOCK_SIZE * 0.8);
	const padding = (context === ctx) ? 0 : 10;

	piece.shape.forEach((row, y) => {
			row.forEach((value, x) => {
					if (value) {
							if (context === ctx) {
									drawBlock(ctx, piece.x + x, piece.y + y, piece.color);
							} else {
									context.fillStyle = piece.color;
									context.fillRect(x * size + padding, y * size + padding, size, size);
									context.strokeStyle = '#000';
									context.strokeRect(x * size + padding, y * size + padding, size, size);
							}
					}
			});
	});
}

function collision(piece, offsetX = 0, offsetY = 0) {
	for (let y = 0; y < piece.shape.length; y++) {
			for (let x = 0; x < piece.shape[y].length; x++) {
					if (piece.shape[y][x]) {
							const newX = piece.x + x + offsetX;
							const newY = piece.y + y + offsetY;

							if (newX < 0 || newX >= COLS || newY >= ROWS) {
									return true;
							}
							if (newY >= 0 && board[newY][newX]) {
									return true;
							}
					}
			}
	}
	return false;
}

function merge() {
	currentPiece.shape.forEach((row, y) => {
			row.forEach((value, x) => {
					if (value) {
							const by = currentPiece.y + y;
							const bx = currentPiece.x + x;
							if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
									board[by][bx] = currentPiece.color;
							}
					}
			});
	});
}

function rotate() {
	const rotated = currentPiece.shape[0].map((_, i) =>
			currentPiece.shape.map(row => row[i]).reverse()
	);
	const prevShape = currentPiece.shape;
	const prevX = currentPiece.x;

	currentPiece.shape = rotated;
	const kicks = [0, -1, 1, -2, 2];
	let ok = false;
	for (let k of kicks) {
			if (!collision(currentPiece, k, 0)) {
					currentPiece.x += k;
					ok = true;
					break;
			}
	}
	if (!ok) {
			currentPiece.shape = prevShape;
			currentPiece.x = prevX;
	}
}

function clearLines() {
	let linesCleared = 0;
	for (let y = ROWS - 1; y >= 0; y--) {
			if (board[y].every(cell => cell !== 0)) {
					board.splice(y, 1);
					board.unshift(Array(COLS).fill(0));
					linesCleared++;
					y++;
			}
	}
	if (linesCleared > 0) {
			lines += linesCleared;
			score += [0, 100, 300, 500, 800][linesCleared] * level;
			level = Math.floor(lines / 10) + 1;
			dropInterval = Math.max(100, 1000 - (level - 1) * 100);
			updateScore();
	}
}

function updateScore() {
	document.getElementById('score').textContent = score;
	document.getElementById('level').textContent = level;
	document.getElementById('lines').textContent = lines;
	if (score > highScore) {
			highScore = score;
			document.getElementById('highScore').textContent = highScore;
	}
}

function drawNextPiece() {
	const gradient = nextCtx.createLinearGradient(0, 0, 0, nextCanvas.height);
	gradient.addColorStop(0, '#4a1f6b');
	gradient.addColorStop(0.5, '#8b4f8f');
	gradient.addColorStop(1, '#d084b8');
	nextCtx.fillStyle = gradient;
	nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
	if (nextPiece) {
			drawPiece({...nextPiece, x: 0, y: 0}, nextCtx);
	}
}

function endGame() {
	gameRunning = false;
	document.getElementById('finalScore').textContent = score;
	document.getElementById('gameOver').classList.add('show');
}

function update(time = 0) {
	if (!gameRunning || gamePaused) return;
	const deltaTime = time - lastTime;
	lastTime = time;
	dropCounter += deltaTime;

	if (dropCounter > dropInterval) {
			if (!collision(currentPiece, 0, 1)) {
					currentPiece.y++;
			} else {
					merge();
					clearLines();
					currentPiece = nextPiece;
					nextPiece = createPiece();
					drawNextPiece();
					if (collision(currentPiece)) {
							endGame();
							return;
					}
			}
			dropCounter = 0;
	}
	drawBoard();
	drawPiece(currentPiece);
	requestAnimationFrame(update);
}

function startGame() {
	board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
	score = 0;
	level = 1;
	lines = 0;
	dropInterval = 1000;
	gameRunning = true;
	gamePaused = false;
	currentPiece = createPiece();
	nextPiece = createPiece();
	updateScore();
	drawNextPiece();
	document.getElementById('gameOver').classList.remove('show');
	document.getElementById('homeScreen').style.display = 'none';
	document.getElementById('gameContainer').style.display = 'flex';
	lastTime = performance.now();
	dropCounter = 0;
	requestAnimationFrame(update);
}

function returnHome() {
	gameRunning = false;
	gamePaused = false;
	document.getElementById('homeScreen').style.display = 'flex';
	document.getElementById('gameContainer').style.display = 'none';
	document.getElementById('gameOver').classList.remove('show');
	document.getElementById('pauseBtn').textContent = 'Pause';
}

// ---------- Controls ----------
document.addEventListener('keydown', e => {
	if (!gameRunning || gamePaused) return;
	switch(e.key) {
			case 'ArrowLeft':
					if (!collision(currentPiece, -1, 0)) currentPiece.x--;
					break;
			case 'ArrowRight':
					if (!collision(currentPiece, 1, 0)) currentPiece.x++;
					break;
			case 'ArrowDown':
					if (!collision(currentPiece, 0, 1)) {
							currentPiece.y++;
							score += 1;
							updateScore();
					}
					break;
			case 'ArrowUp':
					rotate();
					break;
			case ' ':
			case 'Spacebar':
			case 'Space':
					e.preventDefault();
					while (!collision(currentPiece, 0, 1)) {
							currentPiece.y++;
							score += 2;
					}
					merge();
					clearLines();
					currentPiece = nextPiece;
					nextPiece = createPiece();
					drawNextPiece();
					if (collision(currentPiece)) {
							endGame();
							return;
					}
					updateScore();
					dropCounter = 0;
					break;
	}
});

document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', () => {
	if (gameRunning) {
			gamePaused = !gamePaused;
			document.getElementById('pauseBtn').textContent = gamePaused ? 'Resume' : 'Pause';
			if (!gamePaused) {
					lastTime = performance.now();
					requestAnimationFrame(update);
			}
	}
});
document.getElementById('homeBtn').addEventListener('click', returnHome);
document.getElementById('restartBtn').addEventListener('click', startGame);

initHomeAnimation();
</script>