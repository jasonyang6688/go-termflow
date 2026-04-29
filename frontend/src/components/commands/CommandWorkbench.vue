<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { deleteQuickCommand, quickCommands, ensureQuickCommandsLoaded, saveQuickCommand, saveQuickCommands } from '../../stores/quickCommands'
import type { QuickCommand } from '../../stores/quickCommands'
import { connections, ensureConnectionsLoaded } from '../../stores/connections'
import { commandCreateRequest, commandScope } from '../../stores/workspace'

onMounted(() => {
  ensureQuickCommandsLoaded()
  ensureConnectionsLoaded()
})

watch(commandCreateRequest, request => {
  if (request) {
    openNew()
  }
})

const selectedConnection = computed(() =>
  commandScope.value === 'global'
    ? null
    : connections.value.find(conn => conn.id === commandScope.value) ?? null
)

const visibleCommands = computed(() => quickCommands.value.filter(cmd =>
  commandScope.value === 'global'
    ? cmd.connectionId == null
    : cmd.connectionId === commandScope.value
))
const editing = ref<QuickCommand | null>(null)
const editorOpen = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const importing = ref(false)
const error = ref('')
const draft = ref({
  label: '',
  command: '',
})

const scopeTitle = computed(() =>
  selectedConnection.value?.name ?? 'Global commands'
)

function commandScopeLabel(connectionId?: number) {
  if (connectionId == null) return 'Global'
  return connections.value.find(conn => conn.id === connectionId)?.name ?? 'Server'
}

function openNew() {
  editorOpen.value = true
  editing.value = null
  draft.value = { label: '', command: '' }
  error.value = ''
}

function openEdit(command: QuickCommand) {
  editorOpen.value = true
  editing.value = command
  draft.value = { label: command.label, command: command.command }
  error.value = ''
}

function closeEditor() {
  editorOpen.value = false
  editing.value = null
  draft.value = { label: '', command: '' }
  error.value = ''
}

async function saveDraft() {
  const label = draft.value.label.trim()
  const command = draft.value.command.trim()
  if (!label || !command) {
    error.value = 'Name and command are required.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await saveQuickCommand({
      id: editing.value?.id ?? 0,
      label,
      command,
      connectionId: commandScope.value === 'global' ? undefined : commandScope.value,
      sortOrder: editing.value?.sortOrder ?? visibleCommands.value.length,
    })
    closeEditor()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function removeCommand(command: QuickCommand) {
  if (!window.confirm(`Delete "${command.label}"?`)) return
  error.value = ''
  try {
    await deleteQuickCommand(command.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function openImport() {
  importInput.value?.click()
}

function exportCommands() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scope: commandScope.value === 'global'
      ? { type: 'global' }
      : { type: 'server', connectionId: commandScope.value, name: selectedConnection.value?.name ?? '' },
    commands: visibleCommands.value.map(cmd => ({
      label: cmd.label,
      command: cmd.command,
      connectionId: cmd.connectionId,
      sortOrder: cmd.sortOrder,
    })),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const scopeName = commandScope.value === 'global'
    ? 'global'
    : (selectedConnection.value?.name || 'server').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  link.href = url
  link.download = `termflow-commands-${scopeName || 'scope'}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function importCommands(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  importing.value = true
  error.value = ''
  try {
    const parsed = JSON.parse(await file.text())
    const rows = Array.isArray(parsed) ? parsed : parsed.commands
    if (!Array.isArray(rows)) {
      throw new Error('Import file must be an array or { "commands": [...] }.')
    }

    const imported = rows.map((row: Record<string, unknown>, index: number) => {
      const label = String(row.label ?? row.name ?? '').trim()
      const command = String(row.command ?? '').trim()
      if (!label || !command) {
        throw new Error(`Command ${index + 1} is missing label/name or command.`)
      }
      const connectionId = typeof row.connectionId === 'number'
        ? row.connectionId
        : commandScope.value === 'global'
          ? undefined
          : commandScope.value

      return {
        id: 0,
        label,
        command,
        connectionId,
        sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : visibleCommands.value.length + index,
      }
    })

    await saveQuickCommands(imported)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="command-workbench">
    <header class="command-head">
      <div>
        <h1 class="wf-label">{{ scopeTitle }}</h1>
        <p>
          {{ commandScope === 'global'
            ? 'Shown on every active server.'
            : 'Shown only when this server is active.' }}
        </p>
      </div>
      <div class="head-actions">
        <button title="Create command" @click="openNew">+ new</button>
        <button title="Export visible commands" :disabled="visibleCommands.length === 0" @click="exportCommands">
          export
        </button>
        <button title="Import commands" :disabled="importing" @click="openImport">
          {{ importing ? 'importing...' : 'import' }}
        </button>
        <input
          ref="importInput"
          class="hidden-import"
          type="file"
          accept="application/json,.json"
          @change="importCommands"
        />
      </div>
    </header>

    <form v-if="editorOpen" class="editor-panel" @submit.prevent="saveDraft">
      <div class="editor-main">
        <label>
          <span>Name</span>
          <input v-model="draft.label" placeholder="Restart Nginx" />
        </label>
        <label>
          <span>Command</span>
          <input v-model="draft.command" placeholder="sudo systemctl restart nginx" />
        </label>
      </div>
      <div class="editor-meta">
        <span>{{ commandScope === 'global' ? 'Global command' : `Server command · ${selectedConnection?.name || 'server'}` }}</span>
        <strong v-if="error">{{ error }}</strong>
      </div>
      <div class="editor-actions">
        <button type="button" @click="closeEditor">Cancel</button>
        <button type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      </div>
    </form>

    <section class="command-grid">
      <article
        v-for="cmd in visibleCommands"
        :key="cmd.id"
        class="command-card"
      >
        <div class="card-top">
          <span :class="['scope-dot', { server: cmd.connectionId != null }]" />
          <strong>{{ cmd.label }}</strong>
          <small>{{ commandScopeLabel(cmd.connectionId) }}</small>
        </div>
        <code>{{ cmd.command }}</code>
        <div class="card-actions">
          <button title="Edit command" @click="openEdit(cmd)">Edit</button>
          <button class="danger" title="Delete command" @click="removeCommand(cmd)">Delete</button>
        </div>
      </article>

      <button class="new-card" title="Create command" @click="openNew">
        <strong>+ new command</strong>
        <span>{{ commandScope === 'global' ? 'Create a global command' : 'Create a server command' }}</span>
      </button>
    </section>

    <div v-if="visibleCommands.length === 0" class="empty-state">
      <strong>No commands in this scope.</strong>
      <span>{{ commandScope === 'global' ? 'Global commands will appear for every server.' : 'Server commands stay scoped to this host.' }}</span>
    </div>
  </div>
</template>

<style scoped>
.command-workbench {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: var(--paper-sidebar);
  color: var(--ink);
}
.command-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1.2px solid var(--faint);
  background: var(--paper-tabbar);
}
.command-head h1 {
  margin: 0;
  font-size: 22px;
  color: var(--ink);
}
.command-head p {
  margin: 4px 0 0;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.head-actions {
  display: flex;
  gap: 8px;
}
.hidden-import {
  display: none;
}
.head-actions button,
.card-actions button,
.new-card {
  border: 1.2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-weight: 700;
}
.head-actions button {
  height: 30px;
  padding: 0 12px;
}
.head-actions button:disabled {
  opacity: 0.55;
  cursor: progress;
}
.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  padding: 16px;
}
.editor-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin: 14px 16px 0;
  padding: 12px;
  border: 1.2px solid var(--ink);
  border-radius: var(--radius);
  background: var(--paper);
}
.editor-main {
  display: grid;
  grid-template-columns: minmax(160px, 0.35fr) minmax(220px, 1fr);
  gap: 10px;
}
.editor-main label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.editor-main input {
  min-width: 0;
  height: 30px;
  border: 1.2px solid var(--faint);
  border-radius: var(--radius);
  background: var(--paper-sidebar);
  color: var(--ink);
  padding: 0 9px;
  outline: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.editor-main input:focus {
  border-color: var(--ink);
  background: var(--paper);
}
.editor-meta {
  grid-column: 1 / 2;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.editor-meta strong {
  margin-left: 10px;
  color: var(--env-prod);
  font-weight: 400;
}
.editor-actions {
  grid-column: 2 / 3;
  grid-row: 1 / span 2;
  display: flex;
  align-items: end;
  gap: 7px;
}
.editor-actions button {
  height: 28px;
  padding: 0 12px;
  border: 1.2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-weight: 700;
}
.editor-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.command-card,
.new-card {
  min-height: 126px;
  padding: 12px;
  background: var(--paper);
  border: 1.2px solid var(--faint);
  border-radius: var(--radius);
}
.card-top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}
.scope-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
}
.scope-dot.server {
  background: var(--env-dev);
}
.card-top strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-top small {
  color: var(--pencil);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}
code {
  display: block;
  margin-top: 10px;
  min-height: 36px;
  padding: 8px;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--paper-tabbar);
  color: var(--pencil);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.45;
}
.card-actions {
  display: flex;
  gap: 7px;
  margin-top: 10px;
}
.card-actions button {
  height: 26px;
  padding: 0 10px;
}
.card-actions button.danger {
  color: var(--env-prod);
  border-color: var(--env-prod);
}
.new-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  border-style: dashed;
  color: var(--pencil);
  text-align: left;
}
.new-card strong {
  color: var(--ink);
}
.new-card span,
.empty-state span {
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.empty-state {
  margin: 0 16px 16px;
  padding: 18px;
  border: 1.2px dashed var(--pencil);
  border-radius: var(--radius);
  background: rgba(250, 248, 244, 0.55);
}
.empty-state strong,
.empty-state span {
  display: block;
}
</style>
