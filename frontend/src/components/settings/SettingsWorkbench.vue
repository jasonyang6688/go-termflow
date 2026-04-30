<script setup lang="ts">
import { computed } from 'vue'
import { clearBackgroundImage, defaultSettings, preferences, resetPreferences, setBackgroundImage, settings, updatePreferences, updateSettings } from '../../stores/uiSettings'
import { settingsSection } from '../../stores/workspace'
import bgInkPaper from '../../assets/images/bg-ink-paper.png'
import bgOpsMap from '../../assets/images/bg-ops-map.png'
import bgPaperGrid from '../../assets/images/bg-paper-grid.png'
import bgHologramPhone from '../../assets/images/bg-hologram-phone.png'

const builtInBackgrounds = [
  {
    id: 'paper-grid',
    label: 'Paper grid',
    src: bgPaperGrid,
    overlay: 0.56,
    terminalFg: '#FAF8F4',
    folderColor: '#5CF2A5',
    fileColor: '#ECE6DB',
    commandColor: '#7DB7FF',
  },
  {
    id: 'ops-map',
    label: 'Ops map',
    src: bgOpsMap,
    overlay: 0.6,
    terminalFg: '#FAF8F4',
    folderColor: '#55D6B2',
    fileColor: '#E7E1D6',
    commandColor: '#8AB8FF',
  },
  {
    id: 'ink-paper',
    label: 'Ink paper',
    src: bgInkPaper,
    overlay: 0.58,
    terminalFg: '#FAF8F4',
    folderColor: '#8EE0A3',
    fileColor: '#ECE6DB',
    commandColor: '#7DB7FF',
  },
  {
    id: 'hologram-phone',
    label: 'Hologram phone',
    src: bgHologramPhone,
    overlay: 0.54,
    terminalFg: '#FAF8F4',
    folderColor: '#5CF2A5',
    fileColor: '#ECE6DB',
    commandColor: '#7DB7FF',
  },
]

const title = computed(() => {
  const names: Record<string, string> = {
    appearance: 'Appearance',
    terminal: 'Terminal',
    files: 'Files',
    commands: 'Commands',
    security: 'SSH / Security',
    about: 'About',
  }
  return names[settingsSection.value] ?? 'Settings'
})

async function chooseBackground(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const dataUrl = await readFile(file)
  const average = await averageImageColor(dataUrl)
  setBackgroundImage(dataUrl, average)
  input.value = ''
}

function resetAppearance() {
  clearBackgroundImage()
  updateSettings(defaultSettings)
}

function applyBuiltInBackground(background: typeof builtInBackgrounds[number]) {
  updateSettings({
    backgroundImage: background.src,
    overlay: background.overlay,
    terminalFg: background.terminalFg,
    folderColor: background.folderColor,
    fileColor: background.fileColor,
    commandColor: background.commandColor,
  })
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function averageImageColor(src: string): Promise<{ r: number; g: number; b: number }> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 24
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve({ r: 28, g: 27, b: 25 })
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data
      let r = 0
      let g = 0
      let b = 0
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      const count = data.length / 4
      resolve({ r: r / count, g: g / count, b: b / count })
    }
    img.onerror = () => resolve({ r: 28, g: 27, b: 25 })
    img.src = src
  })
}
</script>

<template>
  <main class="settings-workbench">
    <header class="settings-head">
      <div>
        <h1 class="wf-label">{{ title }}</h1>
        <p>Configure TermFlow behavior without crowding the sidebar.</p>
      </div>
      <button v-if="settingsSection !== 'about'" class="reset-btn" @click="settingsSection === 'appearance' ? resetAppearance() : resetPreferences()">
        Reset section
      </button>
    </header>

    <section v-if="settingsSection === 'appearance'" class="settings-grid">
      <div class="settings-card wide">
        <h2>Terminal background</h2>
        <p>Use an image behind terminal sessions and tune the mask for readability.</p>
        <div class="actions-row">
          <label class="file-btn">
            Upload image
            <input type="file" accept="image/*" @change="chooseBackground" />
          </label>
          <button @click="clearBackgroundImage">Clear image</button>
        </div>
        <div class="builtin-grid">
          <button
            v-for="background in builtInBackgrounds"
            :key="background.id"
            :class="['builtin-bg', { active: settings.backgroundImage === background.src }]"
            @click="applyBuiltInBackground(background)"
          >
            <img :src="background.src" :alt="background.label" />
            <span>{{ background.label }}</span>
          </button>
        </div>
        <label class="field">
          <span>Background mask</span>
          <input
            type="range"
            min="0.2"
            max="0.72"
            step="0.01"
            :value="settings.overlay"
            @input="updateSettings({ overlay: Number(($event.target as HTMLInputElement).value) })"
          />
        </label>
      </div>

      <div class="settings-card">
        <h2>Terminal preview</h2>
        <div class="terminal-preview" :style="{ color: settings.terminalFg }">
          <span>deploy@prod-api-01:~$ systemctl status nginx</span>
          <em>Active: running</em>
          <strong>~/www/app</strong>
        </div>
      </div>

      <div class="settings-card">
        <h2>Colors</h2>
        <label class="swatch"><span>Text</span><input type="color" :value="settings.terminalFg" @input="updateSettings({ terminalFg: ($event.target as HTMLInputElement).value })" /></label>
        <label class="swatch"><span>Folder</span><input type="color" :value="settings.folderColor" @input="updateSettings({ folderColor: ($event.target as HTMLInputElement).value })" /></label>
        <label class="swatch"><span>File</span><input type="color" :value="settings.fileColor" @input="updateSettings({ fileColor: ($event.target as HTMLInputElement).value })" /></label>
        <label class="swatch"><span>Command</span><input type="color" :value="settings.commandColor" @input="updateSettings({ commandColor: ($event.target as HTMLInputElement).value })" /></label>
      </div>
    </section>

    <section v-else-if="settingsSection === 'terminal'" class="settings-grid">
      <div class="settings-card">
        <h2>Terminal behavior</h2>
        <label class="field">
          <span>Scrollback lines</span>
          <input type="number" min="1000" max="50000" step="1000" :value="preferences.terminalScrollback" @input="updatePreferences({ terminalScrollback: Number(($event.target as HTMLInputElement).value) })" />
        </label>
        <label class="check-row">
          <input type="checkbox" :checked="preferences.pasteConfirm" @change="updatePreferences({ pasteConfirm: ($event.target as HTMLInputElement).checked })" />
          <span>Confirm multi-line paste</span>
        </label>
      </div>
      <div class="settings-card">
        <h2>Encoding</h2>
        <div class="static-row"><span>Default encoding</span><strong>utf-8</strong></div>
        <div class="static-row"><span>Heartbeat</span><strong>{{ preferences.keepaliveSeconds }}s</strong></div>
      </div>
    </section>

    <section v-else-if="settingsSection === 'files'" class="settings-grid">
      <div class="settings-card">
        <h2>Transfers</h2>
        <label class="field">
          <span>Conflict policy</span>
          <select :value="preferences.transferConflict" @change="updatePreferences({ transferConflict: ($event.target as HTMLSelectElement).value as any })">
            <option value="ask">Ask every time</option>
            <option value="overwrite">Overwrite</option>
            <option value="rename">Auto rename</option>
          </select>
        </label>
        <label class="check-row">
          <input type="checkbox" :checked="preferences.showHiddenFiles" @change="updatePreferences({ showHiddenFiles: ($event.target as HTMLInputElement).checked })" />
          <span>Show hidden files</span>
        </label>
      </div>
    </section>

    <section v-else-if="settingsSection === 'commands'" class="settings-grid">
      <div class="settings-card">
        <h2>Execution</h2>
        <label class="field">
          <span>Quick command action</span>
          <select :value="preferences.commandRunMode" @change="updatePreferences({ commandRunMode: ($event.target as HTMLSelectElement).value as any })">
            <option value="run">Run immediately</option>
            <option value="fill">Fill terminal and wait</option>
          </select>
        </label>
        <label class="check-row">
          <input type="checkbox" :checked="preferences.dangerousCommandConfirm" @change="updatePreferences({ dangerousCommandConfirm: ($event.target as HTMLInputElement).checked })" />
          <span>Confirm destructive commands</span>
        </label>
      </div>
    </section>

    <section v-else-if="settingsSection === 'security'" class="settings-grid">
      <div class="settings-card">
        <h2>SSH session safety</h2>
        <label class="field">
          <span>Keepalive interval</span>
          <input type="number" min="15" max="300" step="15" :value="preferences.keepaliveSeconds" @input="updatePreferences({ keepaliveSeconds: Number(($event.target as HTMLInputElement).value) })" />
        </label>
        <label class="check-row">
          <input type="checkbox" :checked="preferences.hideSecrets" @change="updatePreferences({ hideSecrets: ($event.target as HTMLInputElement).checked })" />
          <span>Hide secrets in UI and logs</span>
        </label>
      </div>
    </section>

    <section v-else class="settings-grid">
      <div class="settings-card wide">
        <h2>TermFlow</h2>
        <div class="static-row"><span>Application</span><strong>Wails v2 desktop app</strong></div>
        <div class="static-row"><span>Data directory</span><strong>~/.termflow</strong></div>
        <div class="static-row"><span>Frontend</span><strong>Vue 3</strong></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.settings-workbench {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--paper-sidebar);
  color: var(--ink);
}
.settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1.2px solid var(--faint);
  background: var(--paper-tabbar);
}
.settings-head h1 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
}
.settings-head p,
.settings-card p {
  margin: 4px 0 0;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  padding: 18px;
}
.settings-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1.2px solid var(--faint);
  border-radius: var(--radius);
  background: var(--paper);
}
.settings-card.wide {
  grid-column: 1 / -1;
}
.settings-card h2 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
}
button,
.file-btn {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-weight: 700;
  padding: 0 12px;
}
button:hover,
.file-btn:hover {
  background: var(--highlight);
}
.file-btn input {
  display: none;
}
.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.builtin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.builtin-bg {
  display: grid;
  gap: 7px;
  padding: 8px;
  min-height: 0;
  text-align: left;
  border-color: var(--faint);
}
.builtin-bg.active {
  border-color: var(--ink);
  background: var(--highlight);
}
.builtin-bg img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius);
  border: 1px solid var(--faint);
}
.builtin-bg span {
  color: var(--ink);
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 14px;
}
.field {
  display: grid;
  gap: 6px;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.field input,
.field select {
  min-height: 30px;
  border: 1.2px solid var(--faint);
  border-radius: var(--radius);
  background: var(--paper-sidebar);
  color: var(--ink);
  padding: 0 9px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.check-row,
.swatch,
.static-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.swatch input {
  width: 46px;
  height: 28px;
  border: 1px solid var(--faint);
  border-radius: var(--radius);
}
.static-row strong {
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.terminal-preview {
  display: grid;
  gap: 7px;
  min-height: 132px;
  padding: 14px;
  border-radius: var(--radius);
  background:
    linear-gradient(rgba(28, 27, 25, var(--terminal-bg-overlay)), rgba(28, 27, 25, var(--terminal-bg-overlay))),
    var(--terminal-bg-image),
    var(--terminal-bg);
  background-size: cover;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.terminal-preview em {
  color: var(--env-dev);
  font-style: normal;
}
.terminal-preview strong {
  color: var(--remote-folder-color);
}
</style>
