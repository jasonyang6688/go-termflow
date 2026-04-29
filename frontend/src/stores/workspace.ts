import { ref } from 'vue'

export interface FilePathRequest {
  path: string
  nonce: number
}

export const sftpOpen = ref(false)
export const monitorOpen = ref(false)
export const filePathRequest = ref<FilePathRequest | null>(null)
export const commandScope = ref<number | 'global'>('global')
export const commandCreateRequest = ref<{ scope: number | 'global'; nonce: number } | null>(null)
export const activePanelRequest = ref<{ panel: string; nonce: number } | null>(null)
export const settingsSection = ref('appearance')

export function selectSettingsSection(section: string) {
  settingsSection.value = section
}

let nonce = 0
let commandNonce = 0
let panelNonce = 0

export function openFiles(path?: string) {
  sftpOpen.value = true
  if (path) {
    filePathRequest.value = { path, nonce: ++nonce }
  }
}

export function openMonitor() {
  monitorOpen.value = true
}

export function selectCommandScope(scope: number | 'global') {
  commandScope.value = scope
}

export function requestCommandCreate(scope: number | 'global') {
  commandScope.value = scope
  commandCreateRequest.value = { scope, nonce: ++commandNonce }
  activePanelRequest.value = { panel: 'commands', nonce: ++panelNonce }
}
