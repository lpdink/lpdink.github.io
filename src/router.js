import { createRouter, createWebHistory } from 'vue-router'
import { pages, posts } from './content.js'
import PostView from './views/PostView.vue'
import BlogIndex from './views/BlogIndex.vue'
import DocsIndex from './views/DocsIndex.vue'
import TagsIndex from './views/TagsIndex.vue'
import GamesIndex from './views/GamesIndex.vue'
import Tetris from './games/Tetris.vue'
import Snake from './games/Snake.vue'
import Fish from './games/Fish.vue'

// Home landing comes from content/index.vue (the brand showcase)
const home = pages.find((p) => p.url === '/')
const otherPages = pages.filter((p) => p.url !== '/')

export const routes = [
  {
    path: '/',
    name: 'home',
    component: home ? home.component : () => import('./views/HomeFallback.vue')
  },
  { path: '/blog', name: 'blog', component: BlogIndex },
  { path: '/blog/:slug', name: 'post', component: PostView },
  { path: '/docs', name: 'docs', component: DocsIndex },
  { path: '/docs/:pathMatch(.*)*', name: 'doc', component: PostView },
  { path: '/tags', name: 'tags', component: TagsIndex },
  { path: '/games', name: 'games', component: GamesIndex },
  { path: '/games/tetris', name: 'tetris', component: Tetris },
  { path: '/games/snake', name: 'snake', component: Snake },
  { path: '/games/fish', name: 'fish', component: Fish },
  ...otherPages.map((p) => ({ path: p.url, component: p.component })),
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export function createAppRouter(history) {
  return createRouter({
    history,
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth' }
      return { top: 0 }
    }
  })
}

const router = typeof window !== 'undefined' ? createAppRouter(createWebHistory()) : null

// Update document title on navigation
if (router) {
  router.afterEach((to) => {
    const post = posts.find((p) => to.path === p.url)
    document.title = post ? `${post.title} · lpdink` : 'lpdink · 独立开发者的后院'
  })
}

export default router