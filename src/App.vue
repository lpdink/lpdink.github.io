<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
const navOpen = ref(false)

const links = [
  { to: '/', label: '首页' },
  { to: '/blog', label: '博客' },
  { to: '/docs', label: '文档' },
  { to: '/tags', label: '标签' }
]

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function closeNav() {
  navOpen.value = false
}

onMounted(() => {
  // close mobile nav on route change
  const unwatch = () => closeNav()
  window.addEventListener('hashchange', unwatch)
})
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <router-link to="/" class="brand" @click="closeNav">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3c-4 3-7 7-7 11a7 7 0 0 0 14 0c0-4-3-8-7-11z" />
              <path d="M9 13a3 3 0 0 0 6 0" />
            </svg>
          </span>
          <span class="brand-text">lpdink</span>
        </router-link>

        <nav class="nav-links" :class="{ open: navOpen }">
          <router-link
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="nav-link"
            :class="{ active: isActive(l.to) }"
            @click="closeNav"
          >
            {{ l.label }}
          </router-link>
        </nav>

        <div class="topbar-actions">
          <ThemeToggle />
          <button class="nav-toggle" aria-label="菜单" @click="navOpen = !navOpen">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path v-if="!navOpen" d="M4 7h16M4 12h16M4 17h16" />
              <path v-else d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="site-main">
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <span>© {{ new Date().getFullYear() }} lpdink · 用 Vue + Markdown 手写的小站</span>
        <span class="footer-links">
          <a href="https://github.com/lpdink" target="_blank" rel="noopener">GitHub</a>
          <span class="dot">·</span>
          <a href="/blog/wing-agent">wing-agent</a>
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  border-bottom: 1px solid var(--border);
}

.topbar-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-strong);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent);
}

.brand-text {
  font-family: var(--font-display);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.nav-link {
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--text-soft);
  text-decoration: none;
  font-size: 0.94rem;
  font-weight: 500;
  transition: color 0.2s, background 0.2s;
}

.nav-link:hover {
  color: var(--text-strong);
  background: var(--hover);
}

.nav-link.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--text-strong);
  cursor: pointer;
  padding: 6px;
}

.site-main {
  flex: 1;
}

.site-footer {
  border-top: 1px solid var(--border);
  margin-top: 64px;
}

.footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-faint);
  font-size: 0.88rem;
}

.footer-links a {
  color: var(--text-soft);
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--accent);
}

.dot {
  margin: 0 6px;
}

@media (max-width: 720px) {
  .nav-links {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: 12px;
    gap: 4px;
    display: none;
  }
  .nav-links.open {
    display: flex;
  }
  .nav-toggle {
    display: inline-flex;
  }
  .nav-link {
    padding: 12px 16px;
    border-radius: 10px;
  }
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>