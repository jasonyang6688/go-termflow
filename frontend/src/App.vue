<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue'
import ConnectionSidebar from './components/sidebar/ConnectionSidebar.vue'
import TerminalArea from './components/terminal/TerminalArea.vue'
import { openSession } from './stores/sessions'
import type { Connection } from './stores/connections'

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
      <div v-else class="wf-label" style="padding:16px;color:var(--pencil)">
        {{ panel }} panel — coming soon
      </div>
    </template>
    <template #main>
      <TerminalArea />
    </template>
  </AppShell>
</template>
