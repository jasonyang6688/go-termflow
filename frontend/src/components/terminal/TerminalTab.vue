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
  border-right: 1.2px solid var(--faint);
  border-bottom: 1.2px solid var(--faint);
  background: transparent;
  color: var(--pencil);
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Caveat', cursive;
  font-size: 15px;
  transition: background 0.1s;
  margin-bottom: -1px;
  border-radius: 6px 6px 0 0;
}
.tab:hover { background: rgba(43,42,40,0.05); color: var(--ink); }
.tab.active {
  background: var(--paper);
  color: var(--ink);
  border: 1.2px solid var(--ink);
  border-bottom: 2px solid var(--paper);
  font-weight: 600;
}
.tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tab-close {
  margin-left: 4px;
  opacity: 0.35;
  font-size: 16px;
  line-height: 1;
  font-family: 'JetBrains Mono', monospace;
}
.tab-close:hover { opacity: 1; }
</style>
