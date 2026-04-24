<script setup lang="ts">
import { onMounted } from 'vue'
import { quickCommands, fetchQuickCommands } from '../../stores/quickCommands'
import { sessions, activeSessionId } from '../../stores/sessions'

onMounted(fetchQuickCommands)

function runCommand(cmd: string) {
  // TODO: route command to active session PTY stdin
  console.log('Quick cmd:', cmd, '→ session:', activeSessionId.value)
}
</script>

<template>
  <div class="cmd-bar" v-if="sessions.length > 0">
    <span class="bar-label">⚡</span>
    <button
      v-for="cmd in quickCommands"
      :key="cmd.id"
      class="pill"
      :title="cmd.command"
      @click="runCommand(cmd.command)"
    >
      {{ cmd.label }}
    </button>
  </div>
</template>

<style scoped>
.cmd-bar {
  display: flex;
  gap: 6px;
  padding: 0 12px;
  height: var(--pill-h);
  background: rgba(250,248,244,0.04);
  border-top: 1px solid rgba(250,248,244,0.08);
  overflow-x: auto;
  align-items: center;
  flex-shrink: 0;
}
.bar-label {
  font-size: 12px;
  color: var(--pencil);
  flex-shrink: 0;
  margin-right: 4px;
}
.pill {
  padding: 3px 12px;
  border: 1px solid rgba(250,248,244,0.18);
  border-radius: 100px;
  background: transparent;
  color: rgba(250,248,244,0.8);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s, border-color 0.1s;
}
.pill:hover {
  background: rgba(250,248,244,0.1);
  border-color: var(--accent);
  color: var(--paper);
}
</style>
