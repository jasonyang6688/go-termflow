<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ConnectionItem from './ConnectionItem.vue'
import { fetchConnections, groupedConnections, loading } from '../../stores/connections'
import type { Connection } from '../../stores/connections'

onMounted(fetchConnections)

const emit = defineEmits<{ (e: 'connect', c: Connection): void }>()
const search = ref('')
</script>

<template>
  <div class="sidebar-wrap">
    <div class="sidebar-header">
      <span class="wf-label" style="font-size:16px;font-weight:600">Connections</span>
      <button class="add-btn" title="Add connection">+</button>
    </div>
    <input
      v-model="search"
      class="search-input"
      placeholder="Search…"
      type="search"
    />
    <div class="groups-wrap">
      <div v-if="loading" class="status-msg wf-label">Loading…</div>
      <template v-else>
        <div
          v-for="(conns, group) in groupedConnections"
          :key="group"
          class="group"
        >
          <div class="group-label">{{ group }}</div>
          <ConnectionItem
            v-for="c in conns.filter(c => !search || c.name.includes(search) || c.host.includes(search))"
            :key="c.id"
            :connection="c"
            @connect="emit('connect', $event)"
          />
        </div>
        <div v-if="Object.keys(groupedConnections).length === 0" class="status-msg wf-label">
          No connections yet.<br/>Click + to add one.
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sidebar-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 4px;
  border-bottom: 1px solid var(--faint);
  height: 40px;
}
.add-btn {
  width: 22px; height: 22px;
  border: 1.5px solid var(--faint);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: var(--pencil);
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-btn:hover { background: var(--highlight); color: var(--ink); border-color: var(--ink); }
.search-input {
  margin: 8px 10px;
  padding: 5px 10px;
  border: 1px solid var(--faint);
  border-radius: var(--radius);
  background: transparent;
  font-size: 12px;
  color: var(--ink);
  font-family: inherit;
  outline: none;
}
.search-input:focus { border-color: var(--accent); }
.groups-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 4px 4px 8px;
}
.group-label {
  padding: 10px 10px 3px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pencil);
  font-family: 'JetBrains Mono', monospace;
}
.status-msg {
  padding: 20px 16px;
  text-align: center;
  line-height: 1.8;
  color: var(--pencil);
}
</style>
