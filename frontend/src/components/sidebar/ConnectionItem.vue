<script setup lang="ts">
import type { Connection } from '../../stores/connections'

const props = defineProps<{ connection: Connection }>()
const emit = defineEmits<{ (e: 'connect', c: Connection): void }>()

const envColors: Record<string, string> = {
  prod: 'var(--env-prod)',
  stg:  'var(--env-stg)',
  dev:  'var(--env-dev)',
}
</script>

<template>
  <button class="conn-item" @dblclick="emit('connect', connection)" :title="`${connection.user}@${connection.host}:${connection.port}`">
    <span class="env-dot" :style="{ background: envColors[connection.env] ?? 'var(--pencil)' }" />
    <span class="conn-name">{{ connection.name }}</span>
    <span class="conn-host">{{ connection.user }}@{{ connection.host }}</span>
  </button>
</template>

<style scoped>
.conn-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius);
  color: inherit;
}
.conn-item:hover { background: var(--highlight); }
.env-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.conn-name {
  font-size: 13px;
  color: var(--ink);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: inherit;
}
.conn-host {
  font-size: 10px;
  color: var(--pencil);
  white-space: nowrap;
}
</style>
