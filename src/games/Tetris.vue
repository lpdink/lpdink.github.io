<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const COLS = 10
const ROWS = 20
const CELL = 30

// tetromino shapes: each is a list of rotation states (matrix of 0/1)
const SHAPES = {
  I: {
    color: '#3fb6d8',
    cells: [
      [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]]
    ]
  },
  O: {
    color: '#f2c249',
    cells: [[[1, 1], [1, 1]]]
  },
  T: {
    color: '#b06ad4',
    cells: [
      [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
    ]
  },
  S: {
    color: '#63c76a',
    cells: [
      [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 0, 1]]
    ]
  },
  Z: {
    color: '#e06a6a',
    cells: [
      [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      [[0, 0, 1], [0, 1, 1], [0, 1, 0]]
    ]
  },
  J: {
    color: '#5a7fe0',
    cells: [
      [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
      [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
    ]
  },
  L: {
    color: '#e08a3c',
    cells: [
      [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
      [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
      [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
    ]
  }
}
const TYPES = Object.keys(SHAPES)

const canvas = ref(null)
const score = ref(0)
const level = ref(1)
const lines = ref(0)
const gameOver = ref(false)
const paused = ref(false)

let ctx = null
let board = []
let current = null
let nextType = ''
let dropInterval = 520
let lastDrop = 0
let raf = 0
let running = false

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

function randomType() {
  return TYPES[Math.floor(Math.random() * TYPES.length)]
}

function spawn() {
  current = { type: nextType || randomType(), rot: 0, x: 3, y: 0 }
  nextType = randomType()
  if (collides(current, board)) {
    gameOver.value = true
    running = false
  }
}

function collides(piece, b) {
  const cells = SHAPES[piece.type].cells[piece.rot]
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (!cells[r][c]) continue
      const x = piece.x + c
      const y = piece.y + r
      if (x < 0 || x >= COLS || y >= ROWS) return true
      if (y >= 0 && b[y][x]) return true
    }
  }
  return false
}

function merge() {
  const cells = SHAPES[current.type].cells[current.rot]
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (!cells[r][c]) continue
      const y = current.y + r
      const x = current.x + c
      if (y >= 0) board[y][x] = SHAPES[current.type].color
    }
  }
}

function clearLines() {
  let cleared = 0
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((v) => v !== 0)) {
      board.splice(y, 1)
      board.unshift(Array(COLS).fill(0))
      cleared++
      y++
    }
  }
  if (cleared) {
    lines.value += cleared
    const pts = [0, 100, 300, 500, 800][cleared] || 0
    score.value += pts * level.value
    level.value = Math.floor(lines.value / 10) + 1
    dropInterval = Math.max(120, 520 - (level.value - 1) * 40)
  }
}

function move(dx) {
  const test = { ...current, x: current.x + dx }
  if (!collides(test, board)) current = test
}

function rotate() {
  const test = { ...current, rot: (current.rot + 1) % SHAPES[current.type].cells.length }
  if (!collides(test, board)) current = test
}

function softDrop() {
  const test = { ...current, y: current.y + 1 }
  if (!collides(test, board)) {
    current = test
    score.value += 1
  } else {
    lock()
  }
}

function hardDrop() {
  while (!collides({ ...current, y: current.y + 1 }, board)) current.y++
  score.value += 2
  lock()
}

function lock() {
  merge()
  clearLines()
  spawn()
}

function draw() {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  // background
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * CELL + 0.5, 0)
    ctx.lineTo(x * CELL + 0.5, ROWS * CELL)
    ctx.stroke()
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * CELL + 0.5)
    ctx.lineTo(COLS * CELL, y * CELL + 0.5)
    ctx.stroke()
  }
  // placed blocks
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawCell(c, r, board[r][c])
    }
  }
  // current piece
  if (current && !gameOver.value) {
    const cells = SHAPES[current.type].cells[current.rot]
    const color = SHAPES[current.type].color
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r].length; c++) {
        if (cells[r][c]) drawCell(current.x + c, current.y + r, color)
      }
    }
  }
}

function drawCell(c, r, color) {
  const x = c * CELL
  const y = r * CELL
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(x + 1, y + 1, CELL - 2, 5)
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(x + 1, y + CELL - 6, CELL - 2, 5)
}

function loop(t) {
  if (!running) return
  raf = requestAnimationFrame(loop)
  if (paused.value || gameOver.value) {
    draw()
    return
  }
  if (t - lastDrop > dropInterval) {
    lastDrop = t
    softDrop()
  }
  draw()
}

function onKey(e) {
  if (gameOver.value) return
  const map = {
    ArrowLeft: () => move(-1),
    ArrowRight: () => move(1),
    ArrowDown: () => softDrop(),
    ArrowUp: () => rotate(),
    ' ': () => hardDrop(),
    p: () => (paused.value = !paused.value),
    P: () => (paused.value = !paused.value)
  }
  if (map[e.key]) {
    e.preventDefault()
    map[e.key]()
  }
}

function restart() {
  board = emptyBoard()
  score.value = 0
  level.value = 1
  lines.value = 0
  gameOver.value = false
  paused.value = false
  dropInterval = 520
  nextType = randomType()
  spawn()
  lastDrop = performance.now()
  running = true
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  window.addEventListener('keydown', onKey)
  restart()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(raf)
  running = false
})
</script>

<template>
  <div class="games-page">
    <router-link to="/games" class="back">← 返回小游戏</router-link>
    <header class="game-head">
      <h1>俄罗斯方块</h1>
      <p class="sub">方向键移动 · ↑ 旋转 · 空格落底 · P 暂停</p>
    </header>

    <div class="game-area">
      <div class="side-panel">
        <div class="stat">
          <span class="stat-label">分数</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">等级</span>
          <span class="stat-value">{{ level }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">行数</span>
          <span class="stat-value">{{ lines }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">下一个</span>
          <div class="next-preview">{{ nextType }}</div>
        </div>
      </div>

      <div class="board-wrap" @click="$refs.board.focus()">
        <canvas ref="canvas" :width="COLS * CELL" :height="ROWS * CELL"></canvas>
        <div v-if="gameOver" class="overlay">
          <h2>游戏结束</h2>
          <p>得分 {{ score }}</p>
          <button class="btn" @click="restart">再来一局</button>
        </div>
        <div v-if="paused && !gameOver" class="overlay">
          <h2>已暂停</h2>
          <p>按 P 继续</p>
        </div>
      </div>
    </div>

    <div class="controls-hint">
      <button class="hint-btn" @click="move(-1)">←</button>
      <button class="hint-btn" @click="rotate()">↻</button>
      <button class="hint-btn" @click="move(1)">→</button>
      <button class="hint-btn" @click="softDrop()">↓</button>
      <button class="hint-btn accent" @click="hardDrop()">落底</button>
    </div>
  </div>
</template>

<style scoped>
.games-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

.back {
  color: var(--text-faint);
  text-decoration: none;
  font-size: 0.9rem;
}

.back:hover {
  color: var(--accent);
}

.game-head h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-strong);
  margin: 16px 0 6px;
}

.sub {
  color: var(--text-faint);
  margin: 0 0 24px;
}

.game-area {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 110px;
}

.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-faint);
  display: block;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--text-strong);
}

.next-preview {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--accent);
}

.board-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  outline: none;
}

.board-wrap canvas {
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 16, 12, 0.82);
  color: #fff;
  text-align: center;
}

.overlay h2 {
  color: #fff;
  margin: 0 0 8px;
}

.overlay p {
  margin: 0 0 16px;
  color: #cfd;
}

.btn {
  padding: 10px 22px;
  border-radius: 999px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.controls-hint {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 24px;
}

.hint-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
}

.hint-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.hint-btn.accent {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

@media (max-width: 720px) {
  .game-area {
    flex-direction: column;
    align-items: center;
  }
  .side-panel {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    min-width: 0;
  }
}
</style>