import { computed, ref } from 'vue'

export interface TerminalSettings {
  backgroundImage: string
  overlay: number
  terminalFg: string
  folderColor: string
  fileColor: string
  commandColor: string
}

export interface AppPreferences {
  terminalScrollback: number
  pasteConfirm: boolean
  commandRunMode: 'run' | 'fill'
  dangerousCommandConfirm: boolean
  transferConflict: 'ask' | 'overwrite' | 'rename'
  showHiddenFiles: boolean
  keepaliveSeconds: number
  hideSecrets: boolean
}

const defaultSettings: TerminalSettings = {
  backgroundImage: '',
  overlay: 0.78,
  terminalFg: '#FAF8F4',
  folderColor: '#42D98D',
  fileColor: '#D8D2C8',
  commandColor: '#6EA8FF',
}

const defaultPreferences: AppPreferences = {
  terminalScrollback: 5000,
  pasteConfirm: true,
  commandRunMode: 'run',
  dangerousCommandConfirm: true,
  transferConflict: 'ask',
  showHiddenFiles: false,
  keepaliveSeconds: 60,
  hideSecrets: true,
}

const storageKey = 'termflow.ui.settings'
const prefStorageKey = 'termflow.app.preferences'
const settings = ref<TerminalSettings>(loadSettings())
const preferences = ref<AppPreferences>(loadPreferences())

export const terminalStyle = computed(() => ({
  '--terminal-bg-image': settings.value.backgroundImage ? `url(${settings.value.backgroundImage})` : 'none',
  '--terminal-bg-overlay': String(settings.value.overlay),
  '--terminal-fg': settings.value.terminalFg,
  '--remote-folder-color': settings.value.folderColor,
  '--remote-file-color': settings.value.fileColor,
  '--command-color': settings.value.commandColor,
}))

export function updateSettings(next: Partial<TerminalSettings>) {
  settings.value = { ...settings.value, ...next }
  saveSettings()
  applySettings()
}

export function updatePreferences(next: Partial<AppPreferences>) {
  preferences.value = { ...preferences.value, ...next }
  savePreferences()
}

export function resetPreferences() {
  preferences.value = { ...defaultPreferences }
  savePreferences()
}

export function setBackgroundImage(dataUrl: string, average?: { r: number; g: number; b: number }) {
  const dark = average ? luminance(average) < 0.48 : true
  updateSettings({
    backgroundImage: dataUrl,
    overlay: dark ? 0.72 : 0.84,
    terminalFg: dark ? '#FAF8F4' : '#1C1B19',
    folderColor: dark ? '#5CF2A5' : '#087A45',
    fileColor: dark ? '#ECE6DB' : '#2B2A28',
    commandColor: dark ? '#7DB7FF' : '#165CB8',
  })
}

export function clearBackgroundImage() {
  updateSettings({
    backgroundImage: '',
    overlay: defaultSettings.overlay,
    terminalFg: defaultSettings.terminalFg,
    folderColor: defaultSettings.folderColor,
    fileColor: defaultSettings.fileColor,
    commandColor: defaultSettings.commandColor,
  })
}

export function applySettings() {
  const root = document.documentElement
  root.style.setProperty('--terminal-bg-image', settings.value.backgroundImage ? `url(${settings.value.backgroundImage})` : 'none')
  root.style.setProperty('--terminal-bg-overlay', String(settings.value.overlay))
  root.style.setProperty('--terminal-fg', settings.value.terminalFg)
  root.style.setProperty('--remote-folder-color', settings.value.folderColor)
  root.style.setProperty('--remote-file-color', settings.value.fileColor)
  root.style.setProperty('--command-color', settings.value.commandColor)
}

function loadSettings(): TerminalSettings {
  try {
    const raw = window.localStorage?.getItem(storageKey)
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

function loadPreferences(): AppPreferences {
  try {
    const raw = window.localStorage?.getItem(prefStorageKey)
    return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : { ...defaultPreferences }
  } catch {
    return { ...defaultPreferences }
  }
}

function saveSettings() {
  window.localStorage?.setItem(storageKey, JSON.stringify(settings.value))
}

function savePreferences() {
  window.localStorage?.setItem(prefStorageKey, JSON.stringify(preferences.value))
}

function luminance(color: { r: number; g: number; b: number }) {
  return (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255
}

applySettings()

export { defaultSettings, preferences, settings }
