<script setup lang="ts">
import { createDemoOptions } from '@flipatic/flip-reel-demo-shared'

const options = createDemoOptions()
</script>

<template>
  <header class="demo-header">
    <div class="demo-header__inner">
      <a class="demo-brand" href="https://flipatic.com"
        ><img src="/brand/flipatic.svg" alt="Flipatic"
      /></a>
      <div class="demo-actions">
        <span class="demo-badge">Vue</span>
        <a class="demo-github" href="https://github.com/Flipatic/flip-reel">GitHub</a>
      </div>
    </div>
  </header>
  <main class="demo-main">
    <p class="demo-lede">
      A Vue 3 page embedding the FlipReel widget as a native custom element (options passed via the
      <code>.prop</code> modifier). Hover a card to preview, click to open the full-screen player.
    </p>
    <flip-reel :options.prop="options" />
  </main>
</template>
