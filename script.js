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

const GRAVITY = 0.32;
const MAX_PARTICLES = 700;

let particles = [];
let flashes = [];

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

function spawnDroplets(row, rowColors) {
  if (particles.length > MAX_PARTICLES) return;
  for (let c = 0; c < COLS; c++) {
    const color = rowColors[c];
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: c * BLOCK + Math.random() * BLOCK,
        y: row * BLOCK + Math.random() * BLOCK,
        vx: (Math.random() - 0.5) * 9,
        vy: -(2 + Math.random() * 5.5),
        r: 1.8 + Math.random() * 3,
        color,
        life: 1,
        decay: 0.012 + Math.random() * 0.014,
      });
    }
  }
  flashes.push({ row, life: 1 });
}

function updateParticles(delta) {
  const step = Math.min(delta / 16.67, 3);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += GRAVITY * step;
    p.x += p.vx * step;
    p.y += p.vy * step;

    if (p.x < p.r) {
      p.x = p.r;
      p.vx *= -0.5;
    } else if (p.x > board.width - p.r) {
      p.x = board.width - p.r;
      p.vx *= -0.5;
    }
    if (p.y > board.height - p.r) {
      p.y = board.height - p.r;
      p.vy *= -0.35;
      p.vx *= 0.7;
      p.decay *= 2.2; // 바닥에 닿은 물방울은 고이지 않고 빠르게 스며든다
    }

    p.life -= p.decay * step;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].life -= 0.06 * step;
    if (flashes[i].life <= 0) flashes.splice(i, 1);
  }
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  flashes.forEach(f => {
    const y = f.row * BLOCK;
    const gradient = ctx.createLinearGradient(0, y, 0, y + BLOCK);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(210, 240, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = Math.max(f.life, 0) * 0.7;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, board.width, BLOCK);
  });

  particles.forEach(p => {
    const speed = Math.hypot(p.vx, p.vy);
    const stretch = 1 + Math.min(speed / 9, 0.9);
    const alpha = Math.max(p.life, 0);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.scale(stretch, 1 / stretch);

    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-p.r * 0.25, -p.r * 0.25, p.r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every(cell => cell !== null)) {
      spawnDroplets(r, grid[r]);
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

  if (running) {
    current.cells.forEach(({ x, y }) => {
      const gy = y + current.y;
      if (gy >= 0) drawCell(ctx, x + current.x, gy, COLORS[current.key]);
    });
  }

  drawParticles();
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
  const delta = Math.min(time - lastTime, 100);
  lastTime = time;

  if (!paused) {
    if (running) {
      dropCounter += delta;
      if (dropCounter > dropInterval) {
        softDrop();
        dropCounter = 0;
      }
    }
    updateParticles(delta);
    draw();
  }

  // 게임 오버 후에도 남은 물방울이 사라질 때까지 계속 그린다
  if (running || particles.length > 0 || flashes.length > 0) {
    animationId = requestAnimationFrame(update);
  }
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
  particles = [];
  flashes = [];
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
