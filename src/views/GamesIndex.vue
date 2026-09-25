<script setup>
const games = [
  {
    to: '/games/tetris',
    name: '俄罗斯方块',
    en: 'Tetris',
    desc: '经典下落拼块。用方向键移动和旋转，空格直接落底。',
    icon: '🧱',
    color: '#2f8f5f'
  },
  {
    to: '/games/snake',
    name: '贪吃蛇',
    en: 'Snake',
    desc: '吃豆子变长，别撞墙也别咬到自己。方向键或 WASD 控制。',
    icon: '🐍',
    color: '#3a7bd5'
  },
  {
    to: '/games/farm',
    name: '像素农场 · 75 秒',
    en: 'Pixel Harvest',
    desc: '一局 75 秒：播种、浇水、抢收，连击加分；还得跑去鸡舍打水、顺手抓鸡。精灵来自站内 AI 画室。',
    icon: '🌾',
    color: '#3f8f4f'
  }
]
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">小游戏</h1>
      <p class="page-sub">写代码写累了，来这里摸一会儿鱼。🎮</p>
    </header>

    <div class="game-grid">
      <router-link v-for="g in games" :key="g.to" :to="g.to" class="game-card">
        <div class="game-icon" :style="{ background: g.color }">{{ g.icon }}</div>
        <h2 class="game-name">{{ g.name }}</h2>
        <p class="game-en">{{ g.en }}</p>
        <p class="game-desc">{{ g.desc }}</p>
        <span class="game-cta">开始游戏 →</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 56px 24px 0;
}

.page-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: var(--text-strong);
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.page-sub {
  color: var(--text-soft);
  font-size: 1.05rem;
  margin: 0 0 40px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.game-card {
  display: flex;
  flex-direction: column;
  padding: 28px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  text-decoration: none;
  color: var(--text);
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  box-shadow: var(--shadow);
}

.game-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.8rem;
  margin-bottom: 18px;
}

.game-name {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--text-strong);
  margin: 0 0 4px;
}

.game-en {
  font-size: 0.8rem;
  color: var(--text-faint);
  margin: 0 0 12px;
  letter-spacing: 0.02em;
}

.game-desc {
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0 0 20px;
  flex: 1;
}

.game-cta {
  color: var(--accent);
  font-weight: 600;
  font-size: 0.92rem;
}

@media (max-width: 720px) {
  .page {
    padding: 40px 18px 0;
  }
}
</style>