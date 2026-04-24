<script setup lang="ts">
import { ref } from 'vue'
import ActivityRail from './ActivityRail.vue'

const activePanel = ref('connections')
</script>

<template>
  <div class="shell">
    <ActivityRail @change="activePanel = $event" />
    <aside class="sidebar">
      <slot name="sidebar" :panel="activePanel" />
    </aside>
    <main class="main-area">
      <slot name="main" />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.sidebar {
  width: var(--sidebar-w);
  background: var(--paper);
  border-right: 1.5px solid var(--faint);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--terminal-bg);
}
</style>
