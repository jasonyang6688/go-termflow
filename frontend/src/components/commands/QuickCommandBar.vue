<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { fetchQuickCommands, quickCommands } from '../../stores/quickCommands'
import type { Session } from '../../stores/sessions'
import { sendCommandToSession } from '../../stores/terminalBridge'
import { preferences } from '../../stores/uiSettings'
import { requestCommandCreate } from '../../stores/workspace'

const props = defineProps<{ activeSession: Session | null }>()

onMounted(fetchQuickCommands)

const visibleCommands = computed(() => quickCommands.value.filter(cmd =>
  cmd.connectionId == null || cmd.connectionId === props.activeSession?.connectionId
))

function runCommand(cmd: string) {
  if (preferences.value.dangerousCommandConfirm && isDangerousCommand(cmd) && !window.confirm(`Run "${cmd}"?`)) {
    return
  }
  sendCommandToSession(props.activeSession?.id, cmd, preferences.value.commandRunMode === 'run')
}

function isDangerousCommand(command: string) {
  return /\b(rm\s+-rf|mkfs|shutdown|reboot|poweroff|dd\s+if=|chmod\s+-R\s+777)\b/.test(command) ||
    command.includes(':(){:')
}

function addCommand() {
  if (!props.activeSession) return
  requestCommandCreate(props.activeSession.connectionId)
}
</script>

<template>
  <div class="cmd-bar" v-if="visibleCommands.length > 0">
    <div class="bar-header">
      <span class="bar-label wf-label">Quick commands</span>
      <span v-if="activeSession" class="bar-context wf-label">· {{ activeSession.connectionName }}</span>
      <div class="bar-spacer" />
      <button class="gear-btn" title="Manage commands">⚙</button>
    </div>
    <div class="pills-row">
      <button
        v-for="cmd in visibleCommands"
        :key="cmd.id"
        :class="['pill', { primary: cmd.sortOrder === 0 }]"
        :title="cmd.command"
        :disabled="!activeSession"
        @click="runCommand(cmd.command)"
      >
        {{ cmd.label }}
      </button>
      <button
        class="pill pill-add"
        title="Add command for this server"
        :disabled="!activeSession"
        @click="addCommand"
      >
        + add
      </button>
    </div>
  </div>
</template>

<style scoped>
.cmd-bar {
  background: var(--paper-tabbar);
  border-top: 1.2px solid var(--faint);
  padding: 8px 14px 10px;
  flex-shrink: 0;
}
.bar-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.bar-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--pencil);
}
.bar-context {
  font-size: 13px;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.bar-spacer { flex: 1; }
.gear-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--pencil);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.gear-btn:hover { background: rgba(43,42,40,0.08); color: var(--ink); }
.pills-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pill {
  padding: 4px 14px;
  border: 1.2px solid var(--ink);
  border-radius: 100px;
  background: transparent;
  color: var(--ink);
  font-family: 'Caveat', cursive;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s, border-color 0.1s;
}
.pill:hover {
  background: var(--highlight);
  border-color: var(--ink);
}
.pill:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}
.pill.primary {
  background: var(--env-prod);
  color: var(--paper);
}
.pill-add {
  border-style: dashed;
  color: var(--pencil);
  border-color: var(--pencil);
  font-weight: 400;
}
.pill-add:hover {
  color: var(--ink);
  border-color: var(--ink);
  background: var(--highlight);
}
</style>
