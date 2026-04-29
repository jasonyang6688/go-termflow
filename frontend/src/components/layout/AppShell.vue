<script setup lang="ts">
import { ref, watch } from 'vue'
import ActivityRail from './ActivityRail.vue'
import { activePanelRequest } from '../../stores/workspace'

const activePanel = ref('connections')

watch(activePanelRequest, request => {
  if (request?.panel) {
    activePanel.value = request.panel
  }
})
</script>

<template>
  <div class="shell">
    <ActivityRail :active-panel="activePanel" @change="activePanel = $event" />
    <aside class="sidebar">
      <slot name="sidebar" :panel="activePanel" />
    </aside>
    <main class="main-area">
      <slot name="main" :panel="activePanel" />
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
  background: var(--paper-sidebar);
  border-right: 1.2px solid var(--faint);
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
