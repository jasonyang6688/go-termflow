<script setup lang="ts">
import type { Session } from '../../stores/sessions'

const props = defineProps<{ session: Session; active: boolean }>()
const emit = defineEmits<{
  (e: 'activate'): void
  (e: 'close'): void
}>()

const envColors: Record<string, string> = {
  prod: 'var(--env-prod)',
  stg:  'var(--env-stg)',
  dev:  'var(--env-dev)',
}
</script>

<template>
  <button :class="['tab', { active }]" @click="emit('activate')">
    <span class="tab-dot" :style="{ background: envColors[session.env] ?? 'var(--pencil)' }" />
    <span class="tab-name">{{ session.connectionName }}</span>
    <span class="tab-close" @click.stop="emit('close')">×</span>
  </button>
</template>

<style scoped>
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: var(--tab-h);
  border: none;
  border-right: 1px solid rgba(250,248,244,0.08);
  background: rgba(250,248,244,0.04);
  color: var(--pencil);
  cursor: pointer;
  white-space: nowrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  transition: background 0.1s;
}
.tab:hover { background: rgba(250,248,244,0.08); }
.tab.active {
  background: var(--terminal-bg);
  color: var(--paper);
  border-bottom: 2px solid var(--accent);
}
.tab-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tab-close {
  margin-left: 6px;
  opacity: 0.4;
  font-size: 15px;
  line-height: 1;
}
.tab-close:hover { opacity: 1; }
</style>
