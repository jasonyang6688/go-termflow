<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { OnFileDrop, OnFileDropOff } from '../wailsjs/runtime/runtime'
import AppShell from './components/layout/AppShell.vue'
import ConnectionSidebar from './components/sidebar/ConnectionSidebar.vue'
import ModuleSidebar from './components/sidebar/ModuleSidebar.vue'
import CommandWorkbench from './components/commands/CommandWorkbench.vue'
import FileWorkbench from './components/files/FileWorkbench.vue'
import SettingsWorkbench from './components/settings/SettingsWorkbench.vue'
import TerminalArea from './components/terminal/TerminalArea.vue'
import { dispatchFileDrop } from './stores/fileDrops'
import { openSession } from './stores/sessions'
import { applySettings } from './stores/uiSettings'
import type { Connection } from './stores/connections'

applySettings()

onMounted(() => {
  OnFileDrop((x, y, paths) => dispatchFileDrop(x, y, paths), false)
})

onUnmounted(() => {
  OnFileDropOff()
})

async function handleConnect(conn: Connection) {
  try {
    await openSession(conn)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    alert(`Connection failed: ${msg}`)
  }
}
</script>

<template>
  <AppShell>
    <template #sidebar="{ panel }">
      <ConnectionSidebar
        v-show="panel === 'connections'"
        @connect="handleConnect"
      />
      <ModuleSidebar v-show="panel !== 'connections'" :panel="panel" />
    </template>
    <template #main="{ panel }">
      <FileWorkbench v-show="panel === 'files'" />
      <CommandWorkbench v-show="panel === 'commands'" />
      <SettingsWorkbench v-show="panel === 'settings'" />
      <TerminalArea
        v-show="panel === 'connections' || panel === 'monitor'"
        :active-panel="panel === 'monitor' ? 'monitor' : 'connections'"
      />
    </template>
  </AppShell>
</template>
