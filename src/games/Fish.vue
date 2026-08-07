<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const W = 720
const H = 520

const canvas = ref(null)
const score = ref(0)
const size = ref(1)
const gameOver = ref(false)
const paused = ref(false)

let ctx = null
let player = null
let fishes = []
let raf = 0
let running = false
let lastSpawn = 0
let lastT = 0
let mouse = { x: W / 2, y: H / 2 }
let keys = {}

const COLORS = ['#ff8a5c', '#ffd166', '#6bc5ff', '#b18cff', '#ff6b9d', '#7ee081', '#ff9f43']

function makeFish(kind) {
  const fromEdge = Math.random() < 0.5
  let x, y
  if (fromEdge) {
    x = Math.random() < 0.5 ? -20 : W + 20
    y = Math.random() * H
  } else {
    x = Math.random() * W
    y = Math.random() < 0.5 ? -20 : H + 20
  }
  const speed = 40 + Math.random() * 90
  const dir = { x: Math.random() < 0.5 ? -1 : 1, y: Math.random() * 2 - 1 }
  return {
    x,
    y,
    vx: dir.x * speed,
    vy: dir.y * speed,
    size: kind === 'prey' ? 6 + Math.random() * 12 : 26 + Math.random() * 22,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    kind
  }
}

function reset() {
  player = { x: W / 2, y: H / 2, size: 16 }
  fishes = []
  score.value = 0
  size.value = 1
  gameOver.value = false
  paused.value = false
  lastSpawn = 0
  // seed some fish
  for (let i = 0; i < 10; i++) fishes.push(makeFish('prey'))
  for (let i = 0; i < 4; i++) fishes.push(makeFish('predator'))
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function step(dt) {
  if (gameOver.value || paused.value) return

  // move player toward mouse (smoothly), also keyboard fallback
  const spd = 260
  let tx = mouse.x
  let ty = mouse.y
  if (keys['ArrowLeft']) tx = player.x - 200
  if (keys['ArrowRight']) tx = player.x + 200
  if (keys['ArrowUp']) ty = player.y - 200
  if (keys['ArrowDown']) ty = player.y + 200
  const d = dist(player, { x: tx, y: ty })
  if (d > 2) {
    const k = Math.min(1, (spd * dt) / d)
    player.x += (tx - player.x) * k
    player.y += (ty - player.y) * k
  }
  // clamp to canvas
  player.x = Math.max(player.size, Math.min(W - player.size, player.x))
  player.y = Math.max(player.size, Math.min(H - player.size, player.y))

  // spawn more fish over time
  lastSpawn += dt
  if (lastSpawn > 0.8) {
    lastSpawn = 0
    fishes.push(makeFish(Math.random() < 0.7 ? 'prey' : 'predator'))
  }

  // move fish, bounce off edges
  for (const f of fishes) {
    f.x += f.vx * dt
    f.y += f.vy * dt
    if (f.x < 0 || f.x > W) f.vx *= -1
    if (f.y < 0 || f.y > H) f.vy *= -1
    // gentle wander
    f.vx += (Math.random() - 0.5) * 20 * dt
    f.vy += (Math.random() - 0.5) * 20 * dt
    const maxv = 160
    const v = Math.hypot(f.vx, f.vy) || 1
    if (v > maxv) {
      f.vx = (f.vx / v) * maxv
      f.vy = (f.vy / v) * maxv
    }
  }

  // collisions
  const remove = []
  for (let i = 0; i < fishes.length; i++) {
    const f = fishes[i]
    const d = dist(player, f)
    const minD = (player.size + f.size) * 0.62
    if (d < minD) {
      if (f.kind === 'prey' && f.size < player.size) {
        // eat it
        player.size = Math.min(player.size + f.size * 0.25, 60)
        score.value += 1
        size.value = Math.round(player.size / 16)
        remove.push(i)
      } else if (f.kind === 'predator' && f.size > player.size) {
        gameOver.value = true
      } else if (f.kind === 'prey' && f.size >= player.size) {
        // a bigger prey — treat as dangerous too
        gameOver.value = true
      }
    }
  }
  for (const i of remove.reverse()) fishes.splice(i, 1)
}

function drawFish(f, tail) {
  const dir = Math.atan2(f.vy, f.vx)
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.rotate(dir)
  const s = f.size
  // tail
  ctx.fillStyle = f.color
  ctx.beginPath()
  ctx.moveTo(-s * 0.7, 0)
  ctx.lineTo(-s * 1.3, -s * 0.5 + tail)
  ctx.lineTo(-s * 1.3, s * 0.5 + tail)
  ctx.closePath()
  ctx.fill()
  // body
  ctx.beginPath()
  ctx.ellipse(0, 0, s, s * 0.62, 0, 0, Math.PI * 2)
  ctx.fill()
  // eye
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(s * 0.55, -s * 0.18, s * 0.16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(s * 0.6, -s * 0.18, s * 0.08, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function draw(t) {
  ctx.clearRect(0, 0, W, H)
  // sea background
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, 'rgba(20,60,90,0.55)')
  grad.addColorStop(1, 'rgba(10,30,50,0.55)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  // bubbles
  for (let i = 0; i < 20; i++) {
    const bx = (i * 37 + t * 0.02) % W
    const by = (Math.sin(t * 0.001 + i) * 20 + H / 2 + i * 23) % H
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.arc(bx, by, 3 + (i % 4), 0, Math.PI * 2)
    ctx.fill()
  }

  const tail = Math.sin(t * 0.02) * 4
  // other fish
  for (const f of fishes) drawFish(f, tail)
  // player
  drawFish(player, tail)
}

function loop(t) {
  if (!running) return
  raf = requestAnimationFrame(loop)
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016)
  lastT = t
  step(dt)
  draw(t)
  if (gameOver.value) draw(t)
}

function onMouse(e) {
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = ((e.clientX - rect.left) / rect.width) * W
  mouse.y = ((e.clientY - rect.top) / rect.height) * H
}

function onKey(e) {
  if (e.key === 'p' || e.key === 'P') {
    paused.value = !paused.value
    return
  }
  keys[e.key] = e.type === 'keydown'
}

function restart() {
  reset()
  running = true
  lastT = performance.now()
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  reset()
  window.addEventListener('mousemove', onMouse)
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  running = true
  lastT = performance.now()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouse)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKey)
  cancelAnimationFrame(raf)
  running = false
})
</script>

<template>
  <div class="games-page">
    <router-link to="/games" class="back">← 返回小游戏</router-link>
    <header class="game-head">
      <h1>大鱼吃小鱼</h1>
      <p class="sub">移动鼠标控制你的鱼 · P 暂停 · 吃小的，躲大的</p>
    </header>

    <div class="game-area">
      <div class="side-panel">
        <div class="stat">
          <span class="stat-label">得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">体型 ×</span>
          <span class="stat-value">{{ size }}</span>
        </div>
      </div>

      <div class="board-wrap">
        <canvas ref="canvas" :width="W" :height="H"></canvas>
        <div v-if="gameOver" class="overlay">
          <h2>被吃掉了！</h2>
          <p>得分 {{ score }} · 体型 ×{{ size }}</p>
          <button class="btn" @click="restart">再来一局</button>
        </div>
        <div v-if="paused && !gameOver" class="overlay">
          <h2>已暂停</h2>
          <p>按 P 继续</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.games-page {
  max-width: 820px;
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
  min-width: 90px;
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
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow);
  max-width: 100%;
}

.board-wrap canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(8, 20, 30, 0.82);
  color: #fff;
  text-align: center;
}

.overlay h2 {
  color: #fff;
  margin: 0 0 8px;
}

.overlay p {
  margin: 0 0 16px;
  color: #cde;
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