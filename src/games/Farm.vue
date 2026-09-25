<script setup>
/**
 * 像素农场 · 75 秒
 * ---------------------------------------------------------------
 * 画面里的精灵全部来自「AI 画室」那批本地生成的像素资产
 * （/images/ai-art/game/*.png，由 make_game_sprites.py 降到 64 格并抠掉底色）。
 *
 * 玩法：点田地 = 播种 / 浇水 / 抢收，浇水要花水壶里的水，
 *      水空了点鸡舍去补；鸡在场上乱跑，点它能加分；熟太久不收会枯萎。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

/* ---------------- 画布 / 场地 ---------------- */
const W = 480
const H = 320
const TILE = 64
const COLS = 5
const ROWS = 3
const FIELD_X = (W - COLS * TILE) / 2 // 80
const FIELD_Y = 92

const COOP = { x: 200, y: 2, w: 80, h: 86 }       // 点它 = 打水
const TREE = { x: 10, y: 22, s: 64 }
const CAT = { x: 408, y: 18, s: 52 }

const WATER_MAX = 6
const ROUND_TIME = 75
const GROW_TIME = 3.0
const RIPE_TIME = 8.0
const FARMER_SPEED = 128

const canvas = ref(null)
const spritesReady = ref(false)

/* ---------------- 状态 ---------------- */
const phase = ref('ready')          // ready | playing | over
const score = ref(0)
const best = ref(Number(localStorage.getItem('farm-best') || 0))
const timeLeft = ref(ROUND_TIME)
const water = ref(WATER_MAX)
const combo = ref(0)
const comboLeft = ref(0)
const muted = ref(localStorage.getItem('farm-mute') === '1')
const toast = reactive({ text: '', t: 0 })

const rating = computed(() => {
  if (score.value >= 150) return { title: '农场之神', icon: '👑', note: '这手速，星露谷该给你发聘书了。' }
  if (score.value >= 100) return { title: '熟练农夫', icon: '🌾', note: '节奏踩得很稳，再来一局冲 150？' }
  return { title: '手感还没热', icon: '🌱', note: '诀窍：先一口气把地都种上，再一起浇水。' }
})

/* ---------------- 内部变量 ---------------- */
let ctx = null
let raf = 0
let last = 0

const images = {}                   // name -> 64×64 offscreen canvas
const plots = []                    // { state, t, water, bob }
let farmer = null
let chickens = []
let particles = []
let floaters = []
const grassSeed = Math.floor(Math.random() * 997)

/* ---------------- 音效（WebAudio 合成，零素材） ---------------- */
let actx = null
function ensureAudio() {
  if (actx || muted.value) return
  try { actx = new (window.AudioContext || window.webkitAudioContext)() } catch { actx = null }
}
function tone(freq, dur, { type = 'square', gain = 0.05, to = null, delay = 0 } = {}) {
  if (muted.value || !actx) return
  const t0 = actx.currentTime + delay
  const osc = actx.createOscillator()
  const g = actx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(actx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}
const SFX = {
  plant: () => tone(210, 0.09, { type: 'triangle', to: 150 }),
  water: () => { tone(760, 0.14, { type: 'sine', to: 420, gain: 0.04 }); tone(1180, 0.08, { type: 'sine', gain: 0.02, delay: 0.04 }) },
  ripe: () => tone(1320, 0.07, { type: 'triangle', gain: 0.03 }),
  harvest: (n) => { tone(880, 0.08, { type: 'square', gain: 0.045 }); tone(1320 + Math.min(n, 5) * 60, 0.12, { type: 'square', gain: 0.04, delay: 0.06 }) },
  empty: () => tone(180, 0.16, { type: 'sawtooth', to: 110, gain: 0.035 }),
  refill: () => { tone(320, 0.12, { type: 'sine', to: 700, gain: 0.045 }); tone(900, 0.1, { type: 'sine', gain: 0.025, delay: 0.1 }) },
  catch: () => { tone(660, 0.06, { type: 'square', gain: 0.04 }); tone(990, 0.09, { type: 'square', gain: 0.035, delay: 0.05 }) },
  meow: () => { tone(700, 0.18, { type: 'sawtooth', to: 520, gain: 0.03 }) },
  over: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, { type: 'square', gain: 0.04, delay: i * 0.11 }))
}

/* ---------------- 精灵 ---------------- */
const SPRITE_SRC = {
  farmer: '/images/ai-art/game/farmer.png',
  chicken: '/images/ai-art/game/chicken.png',
  crop: '/images/ai-art/game/crop.png',
  coop: '/images/ai-art/game/coop.png',
  tree: '/images/ai-art/game/tree.png',
  cat: '/images/ai-art/game/cat.png'
}

function loadSprites() {
  const jobs = Object.entries(SPRITE_SRC).map(([name, src]) => new Promise((done) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')
      g.imageSmoothingEnabled = true
      g.drawImage(img, 0, 0, 64, 64)      // 512 → 64 原生像素格
      images[name] = c
      done()
    }
    img.onerror = () => done()
    img.src = src
  }))
  Promise.all(jobs).then(() => { spritesReady.value = true })
}

function drawSprite(name, cx, cy, size, { flip = false, alpha = 1, tilt = 0 } = {}) {
  const s = images[name]
  if (!s) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(Math.round(cx), Math.round(cy))
  if (flip) ctx.scale(-1, 1)
  if (tilt) ctx.rotate(tilt)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(s, -size / 2, -size / 2, size, size)
  ctx.restore()
}

/* ---------------- 局内 ---------------- */
function plotAt(x, y) {
  const c = Math.floor((x - FIELD_X) / TILE)
  const r = Math.floor((y - FIELD_Y) / TILE)
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return -1
  return r * COLS + c
}
const plotCenter = (i) => ({
  x: FIELD_X + (i % COLS) * TILE + TILE / 2,
  y: FIELD_Y + Math.floor(i / COLS) * TILE + TILE / 2
})

function say(text) {
  toast.text = text
  toast.t = 1.9
}

function pop(x, y, text, color = '#ffe06a') {
  floaters.push({ x, y, text, color, t: 0, life: 1.1 })
}

function burst(x, y, color, n = 8, spread = 46, kind = 'dot') {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random()
    const sp = spread * (0.45 + Math.random() * 0.75)
    particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 26,
      g: kind === 'drop' ? 260 : 150, t: 0, life: 0.45 + Math.random() * 0.45,
      color, size: kind === 'drop' ? 3 : 2 + Math.round(Math.random() * 2)
    })
  }
}

function reset() {
  plots.length = 0
  for (let i = 0; i < COLS * ROWS; i++) plots.push({ state: 'empty', t: 0, bob: Math.random() * 6 })
  farmer = { x: W / 2, y: H - 22, tx: 0, ty: 0, moving: false, dir: 1, bob: 0, act: null }
  chickens = [0, 1].map((i) => ({
    x: FIELD_X + 120 + i * 160,
    y: FIELD_Y + 26 + i * 40,
    tx: FIELD_X + 60 + Math.random() * 320,
    ty: 40 + Math.random() * 200,
    speed: 20 + Math.random() * 8,
    dir: 1, bob: Math.random() * 6, away: 0
  }))
  particles = []
  floaters = []
  score.value = 0
  water.value = WATER_MAX
  combo.value = 0
  comboLeft.value = 0
  timeLeft.value = ROUND_TIME
  toast.text = ''
  toast.t = 0
}

function start() {
  ensureAudio()
  reset()
  phase.value = 'playing'
  last = performance.now()
  SFX.refill()
}

function finish() {
  phase.value = 'over'
  if (score.value > best.value) {
    best.value = score.value
    localStorage.setItem('farm-best', String(score.value))
  }
  SFX.over()
}

/* ---------------- 点击 ---------------- */
function onPointer(e) {
  if (phase.value !== 'playing') return
  ensureAudio()
  const r = canvas.value.getBoundingClientRect()
  const x = (e.clientX - r.left) * (W / r.width)
  const y = (e.clientY - r.top) * (H / r.height)
  command(x, y)
}

function walkTo(x, y, act = null) {
  farmer.tx = x
  farmer.ty = y
  farmer.moving = true
  farmer.act = act
}

function command(x, y) {
  // 1) 鸡舍 → 打水
  if (x >= COOP.x - 8 && x <= COOP.x + COOP.w + 8 && y >= COOP.y && y <= COOP.y + COOP.h) {
    if (water.value >= WATER_MAX) return say('水壶已经是满的')
    return walkTo(COOP.x + COOP.w / 2, COOP.y + COOP.h + 18, { type: 'refill' })
  }

  // 2) 鸡 → 抓
  for (const ch of chickens) {
    if (ch.away > 0) continue
    if (Math.hypot(x - ch.x, y - ch.y) < 26) {
      farmer.act = { type: 'catch', chicken: ch }
      return
    }
  }

  // 3) 猫 → 撸
  if (Math.hypot(x - (CAT.x + CAT.s / 2), y - (CAT.y + CAT.s / 2)) < 30) {
    SFX.meow()
    burst(CAT.x + CAT.s / 2, CAT.y + 6, '#ff8fb0', 7, 30)
    pop(CAT.x + CAT.s / 2, CAT.y, '喵~', '#ff8fb0')
    return
  }

  // 4) 田地
  const i = plotAt(x, y)
  if (i >= 0) {
    const c = plotCenter(i)
    return walkTo(c.x, c.y + 16, { type: 'plot', i })
  }

  // 5) 随便走走
  walkTo(x, y)
}

function doPlot(i) {
  const p = plots[i]
  const c = plotCenter(i)
  if (p.state === 'empty') {
    p.state = 'planted'
    p.t = 0
    SFX.plant()
    burst(c.x, c.y + 14, '#8a5f3c', 6, 30)
    pop(c.x, c.y - 6, '播种', '#cdeba0')
  } else if (p.state === 'planted') {
    if (water.value <= 0) {
      SFX.empty()
      say('水壶空了 → 点上面的鸡舍打水')
      return
    }
    water.value -= 1
    p.state = 'growing'
    p.t = GROW_TIME
    SFX.water()
    burst(c.x, c.y - 6, '#6fc6ff', 10, 40, 'drop')
    pop(c.x, c.y - 8, '浇水', '#6fc6ff')
  } else if (p.state === 'growing') {
    say('还在长…等它熟')
  } else if (p.state === 'ripe') {
    combo.value = Math.min(combo.value + 1, 9)
    comboLeft.value = 5
    const gain = 5 + Math.min(combo.value - 1, 5) * 2
    score.value += gain
    p.state = 'empty'
    p.t = 0
    SFX.harvest(combo.value)
    burst(c.x, c.y, '#ffd24a', 12, 52)
    pop(c.x, c.y - 10, `+${gain}`, '#ffd24a')
    if (combo.value >= 3) pop(c.x, c.y - 26, `连击 ×${combo.value}`, '#ff9f43')
  } else if (p.state === 'wilt') {
    say('这茬已经蔫了…')
  }
}

function update(dt) {
  /* 时间 */
  if (phase.value === 'playing') {
    timeLeft.value -= dt
    if (timeLeft.value <= 0) {
      timeLeft.value = 0
      return finish()
    }
    if (toast.t > 0) toast.t -= dt
    if (comboLeft.value > 0) {
      comboLeft.value -= dt
      if (comboLeft.value <= 0) combo.value = 0
    }
  }

  /* 田地 */
  for (let i = 0; i < plots.length; i++) {
    const p = plots[i]
    p.bob += dt * 4
    if (p.state === 'growing') {
      p.t -= dt
      if (p.t <= 0) {
        p.state = 'ripe'
        p.t = RIPE_TIME
        SFX.ripe()
      }
    } else if (p.state === 'ripe') {
      p.t -= dt
      if (p.t <= 0) {
        p.state = 'wilt'
        p.t = 1.2
        const c = plotCenter(i)
        burst(c.x, c.y, '#7d8b6a', 8, 26)
        if (combo.value > 0) { combo.value = 0; comboLeft.value = 0 }
        say('作物枯萎了，快一点！')
      }
    } else if (p.state === 'wilt') {
      p.t -= dt
      if (p.t <= 0) { p.state = 'empty'; p.t = 0 }
    }
  }

  /* 鸡 */
  const fleeRadius = 118
  for (const ch of chickens) {
    if (ch.away > 0) {
      ch.away -= dt
      if (ch.away <= 0) {
        ch.x = COOP.x + COOP.w / 2
        ch.y = COOP.y + COOP.h + 10
        ch.tx = FIELD_X + Math.random() * COLS * TILE
        ch.ty = 46 + Math.random() * (H - 96)
        burst(ch.x, ch.y, '#fff2c4', 8, 34)
      }
      continue
    }
    const dToFarmer = Math.hypot(farmer.x - ch.x, farmer.y - ch.y)
    if (dToFarmer < fleeRadius) {
      const a = Math.atan2(ch.y - farmer.y, ch.x - farmer.x) + (Math.random() - 0.5) * 0.4
      ch.tx = ch.x + Math.cos(a) * 90
      ch.ty = ch.y + Math.sin(a) * 90
      ch.speed = 48
    } else if (Math.hypot(ch.tx - ch.x, ch.ty - ch.y) < 6) {
      ch.speed = 20 + Math.random() * 8
      if (Math.random() < 0.02) {                       // 偶尔换个目标
        ch.tx = FIELD_X + Math.random() * COLS * TILE
        ch.ty = 46 + Math.random() * (H - 96)
      }
    }
    const dx = ch.tx - ch.x
    const dy = ch.ty - ch.y
    const d = Math.hypot(dx, dy) || 1
    const step = Math.min(d, ch.speed * dt)
    ch.x += (dx / d) * step
    ch.y += (dy / d) * step
    ch.dir = dx < 0 ? -1 : 1
    ch.bob += dt * 9
    ch.x = Math.max(20, Math.min(W - 20, ch.x))
    ch.y = Math.max(36, Math.min(H - 26, ch.y))
  }

  /* 农夫 */
  if (farmer.act && farmer.act.type === 'catch' && farmer.act.chicken.away <= 0) {
    farmer.tx = farmer.act.chicken.x
    farmer.ty = farmer.act.chicken.y
    farmer.moving = true
  }
  if (farmer.moving) {
    const dx = farmer.tx - farmer.x
    const dy = farmer.ty - farmer.y
    const d = Math.hypot(dx, dy)
    const stopAt = farmer.act ? 16 : 3        // 带任务时在目标附近就停下动手
    if (d > stopAt) {
      const step = Math.min(d - stopAt * 0.5, FARMER_SPEED * dt)
      farmer.x += (dx / d) * step
      farmer.y += (dy / d) * step
      farmer.dir = dx < 0 ? -1 : 1
      farmer.bob += dt * 11
    } else {
      farmer.moving = false
      const act = farmer.act
      farmer.act = null
      if (act) {
        if (act.type === 'plot') doPlot(act.i)
        else if (act.type === 'refill') {
          water.value = WATER_MAX
          SFX.refill()
          burst(COOP.x + COOP.w / 2, COOP.y + COOP.h - 6, '#6fc6ff', 12, 42, 'drop')
          pop(COOP.x + COOP.w / 2, COOP.y + COOP.h + 4, '水满了', '#6fc6ff')
        } else if (act.type === 'catch') {
          const ch = act.chicken
          if (ch.away <= 0 && Math.hypot(farmer.x - ch.x, farmer.y - ch.y) < 46) {
            ch.away = 4
            score.value += 3
            SFX.catch()
            burst(ch.x, ch.y, '#fff2c4', 12, 46)
            pop(ch.x, ch.y - 8, '+3', '#fff2c4')
          }
        }
      }
    }
  } else {
    farmer.bob += dt * 2.5
  }

  /* 粒子 / 飘字 */
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.t += dt
    p.vy += p.g * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.t >= p.life) particles.splice(i, 1)
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]
    f.t += dt
    f.y -= 22 * dt
    if (f.t >= f.life) floaters.splice(i, 1)
  }
}

/* ---------------- 绘制 ---------------- */
function drawGrass() {
  ctx.fillStyle = '#3f7a45'
  ctx.fillRect(0, 0, W, H)
  // 8px 棋盘草地 + 几丛草，用固定种子免得每帧乱闪
  for (let y = 0; y < H; y += 8) {
    for (let x = 0; x < W; x += 8) {
      if (((x / 8) + (y / 8)) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.035)'
        ctx.fillRect(x, y, 8, 8)
      }
    }
  }
  ctx.fillStyle = 'rgba(20,50,25,0.5)'
  for (let i = 0; i < 90; i++) {
    const x = (i * 97 + grassSeed * 13) % W
    const y = (i * 61 + grassSeed * 29) % H
    if (y > FIELD_Y - 6 && y < FIELD_Y + ROWS * TILE + 6 && x > FIELD_X && x < FIELD_X + COLS * TILE) continue
    ctx.fillRect(x, y, 1, 3)
  }
}

function drawPlot(i) {
  const p = plots[i]
  const c = plotCenter(i)
  const x = FIELD_X + (i % COLS) * TILE
  const y = FIELD_Y + Math.floor(i / COLS) * TILE

  // 土块
  ctx.fillStyle = '#5e4028'
  ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2)
  ctx.fillStyle = '#6f4c2f'
  ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 6)
  ctx.fillStyle = 'rgba(30,18,10,0.35)'
  for (let k = 0; k < 3; k++) ctx.fillRect(x + 6, y + 12 + k * 14, TILE - 12, 2)
  if (p.state === 'planted') {
    ctx.fillStyle = 'rgba(90,60,35,0.55)'   // 干土的斑驳
    ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16)
  }

  const cy = c.y + 6
  if (p.state === 'planted') {
    drawSprite('crop', c.x, cy, 26, { alpha: 0.75 })
  } else if (p.state === 'growing') {
    const grown = 1 - Math.max(0, p.t) / GROW_TIME
    drawSprite('crop', c.x, cy, 26 + grown * 12)
  } else if (p.state === 'ripe') {
    const flash = 0.5 + 0.5 * Math.sin(p.bob * 2)
    const glow = ctx.createRadialGradient(c.x, cy, 2, c.x, cy, 30)
    glow.addColorStop(0, `rgba(255,226,120,${0.34 + flash * 0.22})`)
    glow.addColorStop(1, 'rgba(255,226,120,0)')
    ctx.fillStyle = glow
    ctx.fillRect(c.x - 32, cy - 32, 64, 64)
    drawSprite('crop', c.x, cy - 2, 40 + flash * 2)
    // 闪一下的小星星
    if (Math.floor(p.bob) % 4 === 0) {
      ctx.fillStyle = '#fff6c0'
      ctx.fillRect(c.x + 16, cy - 18, 2, 2)
      ctx.fillRect(c.x - 20, cy - 6, 2, 2)
    }
  } else if (p.state === 'wilt') {
    drawSprite('crop', c.x, cy + 4, 36, { alpha: 0.6, tilt: 0.22 })
    ctx.fillStyle = 'rgba(60,70,50,0.35)'
    ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12)
  }

  // 缺水提示
  if (p.state === 'planted') {
    const bob = Math.sin(p.bob * 1.6) * 2
    ctx.fillStyle = '#5fb8ff'
    ctx.fillRect(c.x - 2, cy - 30 + bob, 4, 5)
    ctx.fillRect(c.x - 3, cy - 26 + bob, 6, 4)
    ctx.fillRect(c.x - 1, cy - 22 + bob, 2, 2)
  }
  // 成熟倒计时条
  if (p.state === 'ripe') {
    const w = Math.max(0, (p.t / RIPE_TIME)) * (TILE - 16)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(x + 8, y + TILE - 8, TILE - 16, 3)
    ctx.fillStyle = p.t < 3 ? '#ff7a5c' : '#ffd24a'
    ctx.fillRect(x + 8, y + TILE - 8, w, 3)
  }
}

function draw() {
  ctx.imageSmoothingEnabled = false
  drawGrass()

  drawSprite('tree', TREE.x + TREE.s / 2, TREE.y + TREE.s / 2, TREE.s)
  drawSprite('coop', COOP.x + COOP.w / 2, COOP.y + COOP.h / 2, COOP.h)
  const catBob = Math.sin(performance.now() / 520) * 1.6
  drawSprite('cat', CAT.x + CAT.s / 2, CAT.y + CAT.s / 2 + catBob, CAT.s)

  for (let i = 0; i < plots.length; i++) drawPlot(i)

  for (const ch of chickens) {
    if (ch.away > 0) continue
    const bob = Math.sin(ch.bob) * 1.6
    drawSprite('chicken', ch.x, ch.y + bob, 42, { flip: ch.dir < 0 })
  }

  const fb = farmer.moving ? Math.abs(Math.sin(farmer.bob)) * 2 : 0
  drawSprite('farmer', farmer.x, farmer.y - fb, 58, { flip: farmer.dir < 0 })

  // 水壶空的时候在农夫头顶提醒
  if (phase.value === 'playing' && water.value === 0) {
    const blink = Math.sin(performance.now() / 260) > 0
    if (blink) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(farmer.x - 1, farmer.y - 44, 3, 8)
      ctx.fillRect(farmer.x - 1, farmer.y - 33, 3, 3)
    }
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life)
    ctx.fillStyle = p.color
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
  }
  ctx.globalAlpha = 1

  ctx.font = 'bold 11px ui-monospace, monospace'
  ctx.textAlign = 'center'
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / f.life)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillText(f.text, f.x + 1, f.y + 1)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, f.x, f.y)
  }
  ctx.globalAlpha = 1

  if (phase.value === 'playing' && timeLeft.value <= 10) {
    ctx.fillStyle = `rgba(255,90,70,${0.06 + Math.abs(Math.sin(performance.now() / 220)) * 0.1})`
    ctx.fillRect(0, 0, W, H)
  }
}

function loop(t) {
  raf = requestAnimationFrame(loop)
  const dt = Math.min(0.05, (t - last) / 1000 || 0)
  last = t
  if (phase.value === 'playing') update(dt)
  draw()
}

/* ---------------- 生命周期 ---------------- */
function onKey(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    if (phase.value !== 'playing') { e.preventDefault(); start() }
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  loadSprites()
  reset()
  window.addEventListener('keydown', onKey)
  last = performance.now()
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey)
  if (actx) actx.close()
})

function toggleMute() {
  muted.value = !muted.value
  localStorage.setItem('farm-mute', muted.value ? '1' : '0')
  if (!muted.value) ensureAudio()
}
</script>

<template>
  <div class="games-page">
    <router-link to="/games" class="back">← 返回小游戏</router-link>
    <header class="game-head">
      <h1>像素农场 · 75 秒</h1>
      <p class="sub">
        点田地：空地开种 · 干了浇水 · 熟了抢收 · 熟太久会蔫。水壶空了点鸡舍打水，顺手抓跑出来的鸡加分。
      </p>
    </header>

    <div class="hud">
      <div class="hud-item">
        <span class="k">分数</span>
        <span class="v">{{ score }}</span>
      </div>
      <div class="hud-item grow">
        <span class="k">时间</span>
        <div class="bar">
          <i :style="{ width: (timeLeft / ROUND_TIME) * 100 + '%', background: timeLeft <= 10 ? '#ff7a5c' : 'var(--accent)' }"></i>
        </div>
        <span class="v mono">{{ timeLeft.toFixed(0) }}s</span>
      </div>
      <div class="hud-item">
        <span class="k">水</span>
        <span class="drops">
          <i v-for="n in WATER_MAX" :key="n" :class="{ off: n > water }"></i>
        </span>
      </div>
      <div class="hud-item" :class="{ hot: combo >= 3 }">
        <span class="k">连击</span>
        <span class="v">×{{ Math.max(combo, 1) }}</span>
      </div>
      <div class="hud-item">
        <span class="k">最高</span>
        <span class="v">{{ best }}</span>
      </div>
      <button class="mute" :title="muted ? '打开音效' : '静音'" @click="toggleMute">
        {{ muted ? '🔇' : '🔊' }}
      </button>
    </div>

    <div class="board-wrap">
      <canvas ref="canvas" :width="W" :height="H" @pointerdown="onPointer"></canvas>

      <transition name="fade">
        <div v-if="toast.t > 0" class="toast">{{ toast.text }}</div>
      </transition>

      <div v-if="phase === 'ready'" class="overlay">
        <h2>🌾 像素农场</h2>
        <p class="lead">
          75 秒，把这几垄地伺候好。<br />
          这批精灵来自站内「AI 画室」里本地生成的像素资产。
        </p>
        <ul class="rules">
          <li><b>点空地</b> 播种 → <b>再点一次</b> 浇水（要花水壶的水）</li>
          <li>熟了会发光，<b>趁热收</b>：连击越高分越多，熟过头会蔫</li>
          <li>水空了去点 <b>鸡舍</b> 打水；场上乱跑的 <b>鸡</b> 点一下 +3</li>
        </ul>
        <p class="goal">目标 <b>150</b> 分 · 最高分 {{ best }}</p>
        <button class="btn" @click="start">开始（或按空格）</button>
      </div>

      <div v-if="phase === 'over'" class="overlay">
        <div class="rating">{{ rating.icon }}</div>
        <h2>{{ rating.title }}</h2>
        <p class="score-big">{{ score }} 分</p>
        <p class="lead">{{ rating.note }}</p>
        <p class="goal">最高分 {{ best }}</p>
        <button class="btn" @click="start">再来一局（空格）</button>
      </div>

      <div v-if="!spritesReady && phase !== 'ready'" class="overlay">
        <p class="lead">正在把像素精灵搬进农场…</p>
      </div>
    </div>

    <p class="foot">
      提示：整个画布都是 480×320 的真像素，精灵是 64 格网格放大来的 —— 和老主机一个做法。
    </p>
  </div>
</template>

<style scoped>
.games-page {
  max-width: 860px;
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
  margin: 0 0 20px;
  font-size: 0.94rem;
  line-height: 1.6;
}

/* ---------- HUD ---------- */
.hud {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.hud-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 12px;
  transition: border-color 0.2s, background 0.2s;
}
.hud-item.grow {
  flex: 1;
  min-width: 180px;
}
.hud-item.hot {
  border-color: #ff9f43;
  background: color-mix(in srgb, #ff9f43 12%, var(--surface));
}
.hud-item .k {
  font-size: 0.72rem;
  color: var(--text-faint);
}
.hud-item .v {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-strong);
  font-weight: 600;
}
.hud-item .v.mono {
  font-size: 0.9rem;
}
.bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--surface-3);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.1s linear, background 0.3s;
}
.drops {
  display: inline-flex;
  gap: 3px;
}
.drops i {
  width: 7px;
  height: 10px;
  border-radius: 3px 3px 4px 4px;
  background: #5fb8ff;
  display: inline-block;
}
.drops i.off {
  background: var(--surface-3);
}
.mute {
  margin-left: auto;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.mute:hover {
  border-color: var(--accent);
}

/* ---------- 画布 ---------- */
.board-wrap {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  background: #3f7a45;
  user-select: none;
}
.board-wrap canvas {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
  cursor: crosshair;
  touch-action: manipulation;
}

/* ---------- 覆盖层 ---------- */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 22px 26px;
  text-align: center;
  background: color-mix(in srgb, #0a1410 88%, transparent);
  color: #eef5ef;
  backdrop-filter: blur(3px);
}
.overlay h2 {
  color: #fff;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
}
.overlay .lead {
  margin: 0;
  color: #c7d8cc;
  font-size: 0.9rem;
  line-height: 1.6;
}
.overlay .rules {
  text-align: left;
  margin: 6px 0;
  padding-left: 18px;
  color: #d7e6db;
  font-size: 0.86rem;
  line-height: 1.8;
}
.overlay .rules b {
  color: #ffd24a;
}
.overlay .goal {
  margin: 2px 0 10px;
  color: #a9bfb1;
  font-size: 0.84rem;
}
.overlay .goal b {
  color: #ffd24a;
}
.overlay .rating {
  font-size: 2.2rem;
  line-height: 1;
}
.score-big {
  font-family: var(--font-display);
  font-size: 2.4rem;
  color: #ffd24a;
  margin: 0;
}
.btn {
  padding: 11px 26px;
  border-radius: 999px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.16s, filter 0.16s;
}
.btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

/* ---------- 提示 ---------- */
.toast {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  background: rgba(12, 22, 16, 0.86);
  color: #eef5ef;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 0.85rem;
  white-space: nowrap;
  pointer-events: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.foot {
  margin: 14px 0 0;
  color: var(--text-faint);
  font-size: 0.82rem;
  text-align: center;
}

@media (max-width: 720px) {
  .games-page {
    padding: 28px 14px 48px;
  }
  .hud-item .v {
    font-size: 1rem;
  }
  .overlay .rules {
    font-size: 0.8rem;
  }
}
</style>
