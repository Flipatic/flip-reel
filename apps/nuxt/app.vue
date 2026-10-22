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
        <span class="demo-badge">Nuxt</span>
        <a class="demo-github" href="https://github.com/Flipatic/flip-reel">GitHub</a>
      </div>
    </div>
  </header>
  <main class="demo-main">
    <p class="demo-lede">
      A Nuxt 3 page embedding the FlipReel widget. It's a browser-only Web Component, so it renders
      inside <code>&lt;ClientOnly&gt;</code> and is registered by a <code>.client</code>
      plugin. Hover a card to preview, click to open the full-screen player.
    </p>
    <ClientOnly>
      <flip-reel :options.prop="options" />
    </ClientOnly>
  </main>
</template>
