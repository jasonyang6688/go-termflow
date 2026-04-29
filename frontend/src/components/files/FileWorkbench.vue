<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { EventsOn } from '../../../wailsjs/runtime/runtime'
import { ensureConnectionsLoaded, ensureFileSession, selectedFileConnection } from '../../stores/fileWorkbench'

interface FileItem {
  name: string
  path: string
  isDir: boolean
  size: number
  modified: number
}

interface PaneState {
  path: string
  pathDraft: string
  files: FileItem[]
  selectedPath: string
  loading: boolean
  error: string
}

interface TransferProgress {
  id: string
  name: string
  kind: string
  written: number
  total: number
  percent: number
  status: string
  error?: string
  savePath?: string
  targetPath?: string
}

const local = ref<PaneState>(emptyPane(''))
const remote = ref<PaneState>(emptyPane('~'))
const remoteStates = ref<Record<number, PaneState>>({})
const remoteSessionId = ref('')
const connecting = ref(false)
const transfers = ref<TransferProgress[]>([])
const menu = ref<{ open: boolean; x: number; y: number; scope: 'local' | 'remote'; file: FileItem | null }>({
  open: false,
  x: 0,
  y: 0,
  scope: 'local',
  file: null,
})
let removeTransferListener: (() => void) | undefined
let connectToken = 0

const selectedName = computed(() => selectedFileConnection.value?.name || 'No server selected')

onMounted(async () => {
  removeTransferListener = EventsOn('transfer:progress', (progress: TransferProgress) => {
    const index = transfers.value.findIndex(item => item.id === progress.id)
    if (index >= 0) transfers.value[index] = progress
    else transfers.value.unshift(progress)
    if (progress.status === 'done') {
      if (progress.kind === 'download') loadLocal()
      if (progress.kind === 'upload') loadRemote()
    }
  })
  await ensureConnectionsLoaded()
  await Promise.all([loadLocal(), connectRemote()])
})
onUnmounted(() => removeTransferListener?.())

watch(selectedFileConnection, () => connectRemote())

function emptyPane(path: string): PaneState {
  return { path, pathDraft: path, files: [], selectedPath: '', loading: false, error: '' }
}

async function connectRemote() {
  const conn = selectedFileConnection.value
  const token = ++connectToken
  remoteSessionId.value = ''
  remote.value = conn ? remoteStateFor(conn.id) : emptyPane('~')
  remote.value.files = []
  remote.value.selectedPath = ''
  remote.value.error = ''
  if (!conn) return

  connecting.value = true
  try {
    const sessionId = await ensureFileSession(conn)
    if (token !== connectToken) return
    remoteSessionId.value = sessionId
    await loadRemote(remote.value.path || '~')
  } catch (e) {
    if (token !== connectToken) return
    remote.value.error = formatError(e)
  } finally {
    if (token === connectToken) {
      connecting.value = false
    }
  }
}

function remoteStateFor(connectionId: number) {
  if (!remoteStates.value[connectionId]) {
    remoteStates.value[connectionId] = emptyPane('~')
  }
  return remoteStates.value[connectionId]
}

async function loadLocal(path = local.value.path) {
  local.value.loading = true
  local.value.error = ''
  try {
    const { LocalListDir } = await import('../../../wailsjs/go/main/App')
    const result = await LocalListDir(path)
    local.value.path = result.path
    local.value.pathDraft = result.path
    local.value.files = result.files ?? []
    local.value.selectedPath = ''
  } catch (e) {
    local.value.error = formatError(e)
  } finally {
    local.value.loading = false
  }
}

async function loadRemote(path = remote.value.path) {
  if (!remoteSessionId.value) return
  remote.value.loading = true
  remote.value.error = ''
  try {
    const { RemoteListDir } = await import('../../../wailsjs/go/main/App')
    const result = await RemoteListDir(remoteSessionId.value, path || '~')
    remote.value.path = result.path
    remote.value.pathDraft = result.path
    remote.value.files = result.files ?? []
    remote.value.selectedPath = ''
  } catch (e) {
    remote.value.error = formatError(e)
  } finally {
    remote.value.loading = false
  }
}

function openItem(scope: 'local' | 'remote', file: FileItem) {
  if (!file.isDir) return
  if (scope === 'local') loadLocal(file.path)
  else loadRemote(file.path)
}

function parentPath(scope: 'local' | 'remote') {
  const path = scope === 'local' ? local.value.path : remote.value.path
  const sep = scope === 'local' && path.includes('\\') ? '\\' : '/'
  const trimmed = path.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  if (index <= 0) return sep === '\\' ? trimmed.slice(0, 3) : '/'
  return trimmed.slice(0, index)
}

async function mkdir(scope: 'local' | 'remote') {
  const name = window.prompt('Folder name')
  if (!name) return
  try {
    if (scope === 'local') {
      const { LocalMkdir } = await import('../../../wailsjs/go/main/App')
      await LocalMkdir(local.value.path, name)
      await loadLocal()
    } else {
      const { RemoteMkdir } = await import('../../../wailsjs/go/main/App')
      await RemoteMkdir(remoteSessionId.value, remote.value.path, name)
      await loadRemote()
    }
  } catch (e) {
    setError(scope, e)
  }
}

function showMenu(event: MouseEvent, scope: 'local' | 'remote', file: FileItem) {
  event.preventDefault()
  pane(scope).selectedPath = file.path
  menu.value = { open: true, x: event.clientX, y: event.clientY, scope, file }
}

async function renameMenu() {
  const { scope, file } = menu.value
  menu.value.open = false
  if (!file) return
  const next = window.prompt('New name', file.name)
  if (!next || next === file.name) return
  try {
    if (scope === 'local') {
      const { LocalRename } = await import('../../../wailsjs/go/main/App')
      await LocalRename(file.path, next)
      await loadLocal()
    } else {
      const { RemoteRename } = await import('../../../wailsjs/go/main/App')
      await RemoteRename(remoteSessionId.value, file.path, next)
      await loadRemote()
    }
  } catch (e) {
    setError(scope, e)
  }
}

async function deleteMenu() {
  const { scope, file } = menu.value
  menu.value.open = false
  if (!file || !window.confirm(`Delete ${file.name}?`)) return
  try {
    if (scope === 'local') {
      const { LocalDelete } = await import('../../../wailsjs/go/main/App')
      await LocalDelete(file.path)
      await loadLocal()
    } else {
      const { RemoteDelete } = await import('../../../wailsjs/go/main/App')
      await RemoteDelete(remoteSessionId.value, file.path)
      await loadRemote()
    }
  } catch (e) {
    setError(scope, e)
  }
}

function dragLocal(event: DragEvent, file: FileItem) {
  event.dataTransfer?.setData('application/x-termflow-local-file', JSON.stringify(file))
}

function dragRemote(event: DragEvent, file: FileItem) {
  if (file.isDir) return
  event.dataTransfer?.setData('application/x-termflow-remote-file', JSON.stringify(file))
}

async function dropOnRemote(event: DragEvent) {
  const localFile = parseDrag(event, 'application/x-termflow-local-file')
  if (localFile && !localFile.isDir) {
    await uploadLocalPath(localFile)
    return
  }
  const osFiles = Array.from(event.dataTransfer?.files ?? [])
  for (const file of osFiles) {
    await uploadBrowserFile(file)
  }
}

async function dropOnLocal(event: DragEvent) {
  const remoteFile = parseDrag(event, 'application/x-termflow-remote-file')
  if (!remoteFile || remoteFile.isDir) return
  try {
    const { RemoteDownloadToDir } = await import('../../../wailsjs/go/main/App')
    await RemoteDownloadToDir(remoteSessionId.value, remoteFile.path, local.value.path, remoteFile.name, remoteFile.size)
  } catch (e) {
    setError('local', e)
  }
}

async function uploadLocalPath(file: FileItem) {
  try {
    const { RemoteUploadLocalFile } = await import('../../../wailsjs/go/main/App')
    await RemoteUploadLocalFile(remoteSessionId.value, file.path, remote.value.path)
  } catch (e) {
    setError('remote', e)
  }
}

async function uploadBrowserFile(file: File) {
  try {
    const { RemoteStartUpload, RemoteWriteUploadChunk } = await import('../../../wailsjs/go/main/App')
    const result = await RemoteStartUpload(remoteSessionId.value, remote.value.path, file.name, file.size)
    const chunkSize = 192 * 1024
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const encoded = await blobToBase64(file.slice(offset, Math.min(offset + chunkSize, file.size)))
      await RemoteWriteUploadChunk(result.transferId, encoded, false)
    }
    await RemoteWriteUploadChunk(result.transferId, '', true)
  } catch (e) {
    setError('remote', e)
  }
}

function parseDrag(event: DragEvent, type: string): FileItem | null {
  const raw = event.dataTransfer?.getData(type)
  if (!raw) return null
  try {
    return JSON.parse(raw) as FileItem
  } catch {
    return null
  }
}

function pane(scope: 'local' | 'remote') {
  return scope === 'local' ? local.value : remote.value
}

function setError(scope: 'local' | 'remote', e: unknown) {
  pane(scope).error = formatError(e)
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatModified(seconds: number) {
  if (!seconds) return ''
  return new Date(seconds * 1000).toLocaleString()
}

function formatError(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result ?? '')
      resolve(value.includes(',') ? value.slice(value.indexOf(',') + 1) : value)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
</script>

<template>
  <div class="file-workbench" @click="menu.open = false">
    <section class="pane local-pane" @dragover.prevent @drop.prevent="dropOnLocal">
      <header class="pane-head">
        <div>
          <h2>Local Files</h2>
          <span>Windows workspace</span>
        </div>
        <button @click="loadLocal()">Refresh</button>
      </header>
      <div class="path-row">
        <input v-model="local.pathDraft" spellcheck="false" @keydown.enter.prevent="loadLocal(local.pathDraft)" />
        <button @click="loadLocal(parentPath('local'))">Parent</button>
        <button @click="mkdir('local')">Mkdir</button>
      </div>
      <div v-if="local.error" class="pane-error">{{ local.error }}</div>
      <div v-else-if="local.loading" class="pane-state">Loading local files...</div>
      <div v-else class="file-list">
        <button
          v-for="file in local.files"
          :key="file.path"
          :class="['file-row', { selected: local.selectedPath === file.path, folder: file.isDir }]"
          :draggable="!file.isDir"
          :title="file.path"
          @click="local.selectedPath = file.path"
          @dblclick="openItem('local', file)"
          @contextmenu="showMenu($event, 'local', file)"
          @dragstart="dragLocal($event, file)"
        >
          <span class="file-icon">{{ file.isDir ? '[D]' : '[F]' }}</span>
          <span class="file-main">
            <strong>{{ file.name }}</strong>
            <small>{{ formatModified(file.modified) }}</small>
          </span>
          <span class="file-size">{{ file.isDir ? 'folder' : formatSize(file.size) }}</span>
        </button>
      </div>
    </section>

    <section class="pane remote-pane" @dragover.prevent @drop.prevent="dropOnRemote">
      <header class="pane-head">
        <div>
          <h2>Remote Files</h2>
          <span>{{ selectedName }}</span>
        </div>
        <button :disabled="!remoteSessionId || remote.loading" @click="loadRemote()">Refresh</button>
      </header>
      <div class="path-row">
        <input v-model="remote.pathDraft" :disabled="!remoteSessionId" spellcheck="false" @keydown.enter.prevent="loadRemote(remote.pathDraft)" />
        <button :disabled="!remoteSessionId" @click="loadRemote(parentPath('remote'))">Parent</button>
        <button :disabled="!remoteSessionId" @click="mkdir('remote')">Mkdir</button>
      </div>
      <div v-if="remote.error" class="pane-error">{{ remote.error }}</div>
      <div v-else-if="connecting || remote.loading" class="pane-state">{{ connecting ? 'Connecting remote server...' : 'Loading remote files...' }}</div>
      <div v-else-if="!remoteSessionId" class="pane-state">Select a server from the left.</div>
      <div v-else class="file-list">
        <button
          v-for="file in remote.files"
          :key="file.path"
          :class="['file-row', { selected: remote.selectedPath === file.path, folder: file.isDir }]"
          :draggable="!file.isDir"
          :title="file.path"
          @click="remote.selectedPath = file.path"
          @dblclick="openItem('remote', file)"
          @contextmenu="showMenu($event, 'remote', file)"
          @dragstart="dragRemote($event, file)"
        >
          <span class="file-icon">{{ file.isDir ? '[D]' : '[F]' }}</span>
          <span class="file-main">
            <strong>{{ file.name }}</strong>
            <small>{{ formatModified(file.modified) }}</small>
          </span>
          <span class="file-size">{{ file.isDir ? 'folder' : formatSize(file.size) }}</span>
        </button>
      </div>
    </section>

    <aside v-if="transfers.length" class="transfer-panel">
      <div class="transfer-title">Transfers</div>
      <div v-for="transfer in transfers.slice(0, 5)" :key="transfer.id" class="transfer-row">
        <div class="transfer-line">
          <span>{{ transfer.kind }} {{ transfer.name }}</span>
          <strong>{{ transfer.status === 'error' ? 'failed' : `${Math.round(transfer.percent || 0)}%` }}</strong>
        </div>
        <small>{{ transfer.targetPath || transfer.savePath }}</small>
        <div class="progress"><i :style="{ width: `${transfer.status === 'done' ? 100 : transfer.percent || 0}%` }" /></div>
        <em v-if="transfer.error">{{ transfer.error }}</em>
      </div>
    </aside>

    <div v-if="menu.open" class="context-menu" :style="{ left: `${menu.x}px`, top: `${menu.y}px` }" @click.stop>
      <button @click="renameMenu">Rename</button>
      <button class="danger" @click="deleteMenu">Delete</button>
    </div>
  </div>
</template>

<style scoped>
.file-workbench {
  position: relative;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(360px, 1.15fr);
  gap: 1px;
  height: 100%;
  min-height: 0;
  background: var(--faint);
  color: var(--ink);
}
.pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1.2px solid var(--faint);
  background: var(--paper-tabbar);
}
.pane-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 18px;
}
.pane-head span,
.pane-state,
.pane-error {
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
button {
  min-height: 28px;
  border: 1.2px solid var(--faint);
  border-radius: var(--radius);
  background: rgba(250, 248, 244, 0.72);
  color: var(--ink);
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-weight: 700;
  font-size: 14px;
  line-height: 1;
  padding: 0 10px;
  box-shadow: 0 1px 0 rgba(43, 42, 40, 0.08);
}
button:hover:not(:disabled) {
  border-color: var(--ink);
  background: var(--highlight);
}
button:disabled {
  color: var(--pencil);
  border-color: var(--faint);
  background: rgba(250, 248, 244, 0.35);
  box-shadow: none;
  opacity: 0.62;
  cursor: not-allowed;
}
.path-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 7px;
  padding: 10px 14px;
  border-bottom: 1.2px solid var(--faint);
}
.path-row input {
  min-width: 0;
  border: 1.2px dashed var(--pencil);
  border-radius: var(--radius);
  background: rgba(250, 248, 244, 0.58);
  padding: 6px 8px;
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  outline: none;
}
.pane-state,
.pane-error {
  padding: 14px;
}
.pane-error {
  color: var(--env-prod);
}
.file-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px;
}
.file-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 4px;
  padding: 8px;
  border: 1.2px solid transparent;
  background: transparent;
  text-align: left;
  cursor: default;
}
.file-row[draggable="true"] {
  cursor: grab;
}
.file-row:hover,
.file-row.selected {
  border-color: var(--ink);
  background: var(--highlight);
}
.file-row.folder {
  background: rgba(66, 166, 116, 0.07);
}
.file-icon,
.file-size,
.file-main small {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}
.file-icon {
  color: var(--remote-folder-color, var(--env-dev));
}
.file-main {
  min-width: 0;
}
.file-main strong,
.file-main small,
.file-size {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-main strong {
  color: var(--ink);
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 15px;
}
.file-main small,
.file-size {
  color: var(--pencil);
}
.file-size {
  justify-self: end;
}
.transfer-panel {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 8;
  max-height: 190px;
  overflow: auto;
  border: 1.4px solid var(--ink);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: 0 14px 30px rgba(28, 27, 25, 0.18);
  padding: 10px 12px;
}
.transfer-title {
  margin-bottom: 7px;
  color: var(--pencil);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.transfer-row {
  padding: 6px 0;
}
.transfer-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: 'Kalam', 'Caveat', cursive;
}
.transfer-row small,
.transfer-row em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--pencil);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-style: normal;
}
.transfer-row em {
  color: var(--env-prod);
}
.progress {
  height: 7px;
  margin-top: 5px;
  border: 1px solid var(--ink);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(250, 248, 244, 0.72);
}
.progress i {
  display: block;
  height: 100%;
  background: var(--env-dev);
}
.context-menu {
  position: fixed;
  z-index: 20;
  width: 132px;
  padding: 5px;
  border: 1.2px solid var(--ink);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: 0 10px 24px rgba(28, 27, 25, 0.2);
}
.context-menu button {
  display: block;
  width: 100%;
  height: 28px;
  border: none;
  text-align: left;
}
.context-menu button:hover {
  background: var(--highlight);
}
.context-menu .danger {
  color: var(--env-prod);
}

@media (max-width: 980px) {
  .file-workbench {
    grid-template-columns: 1fr;
  }
}
</style>
