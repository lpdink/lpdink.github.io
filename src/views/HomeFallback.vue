<script setup>
import { posts } from '../content.js'
</script>

<template>
  <div class="fallback">
    <h1>欢迎来到 lpdink 的小站</h1>
    <p>还没有配置首页落地页。把 <code>content/index.vue</code> 放进来即可。</p>
    <p>共有 {{ posts.length }} 篇文章。</p>
  </div>
</template>

<style scoped>
.fallback {
  text-align: center;
  padding: 140px 24px;
}
</style>