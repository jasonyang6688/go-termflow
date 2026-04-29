<script setup lang="ts">
import { ref } from 'vue'

type Panel = 'connections' | 'files' | 'monitor' | 'commands' | 'settings'

const active = ref<Panel>('connections')
const props = defineProps<{ activePanel?: string }>()

const items: { id: Panel; icon: string; title: string }[] = [
  { id: 'connections', icon: 'C', title: 'Connections' },
  { id: 'files',       icon: 'F', title: 'Files' },
  { id: 'monitor',     icon: 'M', title: 'Monitor' },
  { id: 'commands',    icon: '>', title: 'Commands' },
  { id: 'settings',    icon: '*', title: 'Settings' },
]

const emit = defineEmits<{ (e: 'change', panel: Panel): void }>()

function select(panel: Panel) {
  active.value = panel
  emit('change', panel)
}
</script>

<template>
  <nav class="rail">
    <div class="rail-top">
      <div class="app-logo">T</div>
    </div>
    <button
      v-for="item in items"
      :key="item.id"
      :class="['rail-btn', { active: (props.activePanel || active) === item.id }]"
      :title="item.title"
      @click="select(item.id)"
    >
      {{ item.icon }}
    </button>
  </nav>
</template>

<style scoped>
.rail {
  width: var(--rail-w);
  background: var(--paper-rail);
  border-right: 1.2px solid var(--faint);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 8px;
  gap: 2px;
  flex-shrink: 0;
}
.rail-top {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--faint);
  margin-bottom: 8px;
  -webkit-app-region: drag;
}
.app-logo {
  width: 28px;
  height: 28px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
  font-family: 'Caveat', cursive;
  -webkit-app-region: no-drag;
}
.rail-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius);
  font-size: 18px;
  color: var(--pencil);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s, color 0.1s;
}
.rail-btn:hover { background: var(--highlight); color: var(--ink); }
.rail-btn.active { background: var(--paper); color: var(--ink); border: 1.3px solid var(--ink); }
</style>
