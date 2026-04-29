<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue'
import ConnectionSidebar from './components/sidebar/ConnectionSidebar.vue'
import ModuleSidebar from './components/sidebar/ModuleSidebar.vue'
import CommandWorkbench from './components/commands/CommandWorkbench.vue'
import FileWorkbench from './components/files/FileWorkbench.vue'
import SettingsWorkbench from './components/settings/SettingsWorkbench.vue'
import TerminalArea from './components/terminal/TerminalArea.vue'
import { openSession } from './stores/sessions'
import { applySettings } from './stores/uiSettings'
import type { Connection } from './stores/connections'

applySettings()

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
        v-if="panel === 'connections'"
        @connect="handleConnect"
      />
      <ModuleSidebar v-else :panel="panel" />
    </template>
    <template #main="{ panel }">
      <FileWorkbench v-if="panel === 'files'" />
      <CommandWorkbench v-else-if="panel === 'commands'" />
      <SettingsWorkbench v-else-if="panel === 'settings'" />
      <TerminalArea v-else :active-panel="panel" />
    </template>
  </AppShell>
</template>
