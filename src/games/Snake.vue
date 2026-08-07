<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const COLS = 21
const ROWS = 21
const CELL = 24

const canvas = ref(null)
const score = ref(0)
const gameOver = ref(false)
const paused = ref(false)

let ctx = null
let snake = []
let dir = { x: 1, y: 0 }
let nextDir = { x: 1, y: 0 }
let food = null
let interval = 0
let running = false

function randCell() {
  return { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
}

function placeFood() {
  let c = randCell()
  while (snake.some((s) => s.x === c.x && s.y === c.y)) c = randCell()
  food = c
}

function reset() {
  snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 }
  ]
  dir = { x: 1, y: 0 }
  nextDir = { x: 1, y: 0 }
  score.value = 0
  gameOver.value = false
  paused.value = false
  placeFood()
}

function step() {
  if (gameOver.value || paused.value) return
  dir = nextDir
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
  // wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return end()
  }
  // self collision
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    return end()
  }
  snake.unshift(head)
  if (head.x === food.x && head.y === food.y) {
    score.value += 10
    placeFood()
  } else {
    snake.pop()
  }
  draw()
}

function end() {
  gameOver.value = true
  draw()
}

function onKey(e) {
  const map = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 }
  }
  if (e.key === 'p' || e.key === 'P') {
    paused.value = !paused.value
    return
  }
  const d = map[e.key]
  if (!d) return
  e.preventDefault()
  // prevent reversing into itself
  if (d.x === -dir.x && d.y === -dir.y) return
  nextDir = d
}

function draw() {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  // subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL + 0.5, 0)
    ctx.lineTo(i * CELL + 0.5, ROWS * CELL)
    ctx.stroke()
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath()
    ctx.moveTo(0, i * CELL + 0.5)
    ctx.lineTo(COLS * CELL, i * CELL + 0.5)
    ctx.stroke()
  }
  // food
  if (food) {
    ctx.fillStyle = '#ff6b6b'
    const fx = food.x * CELL + CELL / 2
    const fy = food.y * CELL + CELL / 2
    ctx.beginPath()
    ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
  }
  // snake
  snake.forEach((seg, i) => {
    const x = seg.x * CELL
    const y = seg.y * CELL
    ctx.fillStyle = i === 0 ? '#5fd0a0' : '#2f8f5f'
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
    if (i === 0) {
      ctx.fillStyle = '#0b1410'
      // eyes toward direction
      const ex = x + CELL / 2 + dir.x * 6
      const ey = y + CELL / 2 + dir.y * 6
      ctx.beginPath()
      ctx.arc(ex + dir.y * 3, ey + dir.x * 3, 2.4, 0, Math.PI * 2)
      ctx.arc(ex - dir.y * 3, ey - dir.x * 3, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

function loop() {
  if (!running) return
  step()
  interval = setTimeout(loop, 110)
}

function restart() {
  clearTimeout(interval)
  reset()
  draw()
  running = true
  interval = setTimeout(loop, 110)
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  window.addEventListener('keydown', onKey)
  restart()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(interval)
  running = false
})
</script>

<template>
  <div class="games-page">
    <router-link to="/games" class="back">← 返回小游戏</router-link>
    <header class="game-head">
      <h1>贪吃蛇</h1>
      <p class="sub">方向键 / WASD 控制 · P 暂停</p>
    </header>

    <div class="game-area">
      <div class="side-panel">
        <div class="stat">
          <span class="stat-label">分数</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">长度</span>
          <span class="stat-value">{{ snake.length }}</span>
        </div>
      </div>

      <div class="board-wrap">
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
      <div class="dpad">
        <button class="dbtn" @click="nextDir = { x: -1, y: 0 }">←</button>
        <button class="dbtn" @click="nextDir = { x: 0, y: -1 }">↑</button>
        <button class="dbtn" @click="nextDir = { x: 0, y: 1 }">↓</button>
        <button class="dbtn" @click="nextDir = { x: 1, y: 0 }">→</button>
      </div>
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
  min-width: 100px;
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

.board-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
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
  justify-content: center;
  margin-top: 24px;
}

.dpad {
  display: grid;
  grid-template-columns: repeat(2, 52px);
  gap: 8px;
}

.dbtn {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 1.1rem;
  cursor: pointer;
}

.dbtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 720px) {
  .game-area {
    flex-direction: column;
    align-items: center;
  }
  .side-panel {
    flex-direction: row;
    min-width: 0;
  }
}
</style>