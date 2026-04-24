<script setup lang="ts">
import { sessions, activeSessionId, closeSession } from '../../stores/sessions'
import TerminalTab from './TerminalTab.vue'
import XTerminal from './XTerminal.vue'
import QuickCommandBar from '../commands/QuickCommandBar.vue'
</script>

<template>
  <div class="term-area">
    <!-- Tab bar -->
    <div class="tab-bar">
      <TerminalTab
        v-for="s in sessions"
        :key="s.id"
        :session="s"
        :active="s.id === activeSessionId"
        @activate="activeSessionId = s.id"
        @close="closeSession(s.id)"
      />
      <div v-if="sessions.length === 0" class="tab-hint wf-label">
        Double-click a connection to open a session
      </div>
      <div class="tab-spacer" />
    </div>

    <!-- Terminal panels (mounted, shown/hidden) -->
    <div class="terminal-wrap">
      <XTerminal
        v-for="s in sessions"
        v-show="s.id === activeSessionId"
        :key="s.id"
        :session-id="s.id"
      />
      <div v-if="sessions.length === 0" class="empty-terminal">
        <div class="empty-inner">
          <div class="empty-icon">⬡</div>
          <div class="wf-label" style="font-size:18px;font-weight:600;color:var(--pencil)">
            Welcome to TermFlow
          </div>
          <div class="wf-label" style="font-size:14px;margin-top:8px;color:var(--faint)">
            Select a connection from the sidebar to begin
          </div>
        </div>
      </div>
    </div>

    <!-- Quick command pills -->
    <QuickCommandBar />

    <!-- Status bar -->
    <div class="status-bar">
      <span style="color:var(--pencil);font-size:11px">
        TermFlow
      </span>
      <span style="margin-left:auto;color:var(--pencil);font-size:11px">
        {{ sessions.length }} session{{ sessions.length !== 1 ? 's' : '' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.term-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.tab-bar {
  display: flex;
  height: var(--tab-h);
  background: rgba(43,42,40,0.95);
  border-bottom: 1px solid rgba(250,248,244,0.08);
  overflow-x: auto;
  flex-shrink: 0;
  align-items: stretch;
}
.tab-hint {
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: var(--pencil);
  font-size: 12px;
  opacity: 0.6;
}
.tab-spacer { flex: 1; }
.terminal-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}
.empty-terminal {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.empty-icon {
  font-size: 48px;
  color: rgba(250,248,244,0.1);
  margin-bottom: 8px;
}
.status-bar {
  height: var(--status-h);
  background: rgba(43,42,40,0.95);
  border-top: 1px solid rgba(250,248,244,0.06);
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
}
</style>
