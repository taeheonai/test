const COLS = 12;
const ROWS = 20;
const BLOCK = 20;

const board = document.getElementById('board');
const ctx = board.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');
const gameOverEl = document.getElementById('gameOver');

const COLORS = {
  I: '#00c3ff',
  J: '#3b5bfa',
  L: '#ff9f1a',
  O: '#ffe14d',
  S: '#4dff88',
  T: '#c94dff',
  Z: '#ff4d4d',
};

const SHAPES = {
  I: [[0,1],[1,1],[2,1],[3,1]],
  J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]],
  O: [[1,0],[2,0],[1,1],[2,1]],
  S: [[1,0],[2,0],[0,1],[1,1]],
  T: [[1,0],[0,1],[1,1],[2,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]],
};

const PIECE_KEYS = Object.keys(SHAPES);

let grid;
let current;
let next;
let score;
let level;
let lines;
let dropInterval;
let dropCounter;
let lastTime;
let running;
let paused;
let animationId;

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const cells = SHAPES[key].map(([x, y]) => ({ x, y }));
  return { key, cells, x: Math.floor(COLS / 2) - 2, y: -1 };
}

function rotateCells(cells) {
  const cx = 1, cy = 1;
  return cells.map(({ x, y }) => ({
    x: cx - (y - cy),
    y: cy + (x - cx),
  }));
}

function collides(cells, offX, offY) {
  return cells.some(({ x, y }) => {
    const nx = x + offX;
    const ny = y + offY;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
    if (ny < 0) return false;
    return grid[ny][nx] !== null;
  });
}

function merge() {
  current.cells.forEach(({ x, y }) => {
    const gx = x + current.x;
    const gy = y + current.y;
    if (gy >= 0) grid[gy][gx] = COLORS[current.key];
  });
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every(cell => cell !== null)) {
      grid.splice(r, 1);
      grid.unshift(Array(COLS).fill(null));
      cleared++;
      r++;
    }
  }
  if (cleared > 0) {
    const points = [0, 100, 300, 500, 800][cleared] || 800;
    score += points * level;
    lines += cleared;
    level = 1 + Math.floor(lines / 10);
    dropInterval = Math.max(100, 1000 - (level - 1) * 80);
    updateStats();
  }
}

function updateStats() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

function spawn() {
  current = next;
  next = randomPiece();
  current.x = Math.floor(COLS / 2) - 2;
  current.y = -1;
  drawNext();
  if (collides(current.cells, current.x, current.y)) {
    gameOver();
  }
}

function gameOver() {
  running = false;
  gameOverEl.classList.remove('hidden');
  cancelAnimationFrame(animationId);
}

function move(dx) {
  if (!collides(current.cells, current.x + dx, current.y)) {
    current.x += dx;
  }
}

function softDrop() {
  if (!collides(current.cells, current.x, current.y + 1)) {
    current.y += 1;
    return true;
  }
  lockPiece();
  return false;
}

function hardDrop() {
  while (!collides(current.cells, current.x, current.y + 1)) {
    current.y += 1;
  }
  lockPiece();
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function rotate() {
  if (current.key === 'O') return;
  const rotated = rotateCells(current.cells);
  if (!collides(rotated, current.x, current.y)) {
    current.cells = rotated;
  } else if (!collides(rotated, current.x - 1, current.y)) {
    current.x -= 1;
    current.cells = rotated;
  } else if (!collides(rotated, current.x + 1, current.y)) {
    current.x += 1;
    current.cells = rotated;
  }
}

function drawCell(context, x, y, color) {
  context.fillStyle = color;
  context.fillRect(x * BLOCK, y * BLOCK, BLOCK - 1, BLOCK - 1);
}

function draw() {
  ctx.fillStyle = '#10101a';
  ctx.fillRect(0, 0, board.width, board.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) drawCell(ctx, c, r, grid[r][c]);
    }
  }

  current.cells.forEach(({ x, y }) => {
    const gy = y + current.y;
    if (gy >= 0) drawCell(ctx, x + current.x, gy, COLORS[current.key]);
  });
}

function drawNext() {
  nextCtx.fillStyle = '#10101a';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const size = 18;
  next.cells.forEach(({ x, y }) => {
    nextCtx.fillStyle = COLORS[next.key];
    nextCtx.fillRect(x * size, y * size, size - 1, size - 1);
  });
}

function update(time = 0) {
  if (!running) return;
  if (!paused) {
    const delta = time - lastTime;
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      softDrop();
      dropCounter = 0;
    }
    draw();
  }
  lastTime = time;
  animationId = requestAnimationFrame(update);
}

function resetGame() {
  grid = createGrid();
  score = 0;
  level = 1;
  lines = 0;
  dropInterval = 1000;
  dropCounter = 0;
  lastTime = 0;
  paused = false;
  gameOverEl.classList.add('hidden');
  next = randomPiece();
  spawn();
  updateStats();
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();
  running = true;
  animationId = requestAnimationFrame(update);
}

document.addEventListener('keydown', (e) => {
  if (!running) return;
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      if (!paused) move(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!paused) move(1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!paused) softDrop();
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!paused) rotate();
      break;
    case ' ':
      e.preventDefault();
      if (!paused) hardDrop();
      break;
    case 'p':
    case 'P':
      paused = !paused;
      break;
  }
});

startBtn.addEventListener('click', startGame);

grid = createGrid();
next = randomPiece();
current = randomPiece();
draw();
drawNext();
