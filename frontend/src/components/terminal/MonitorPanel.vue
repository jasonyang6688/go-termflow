<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  sessionId: string | null
  sessionName?: string
  mode?: 'drawer' | 'dashboard'
}>(), {
  mode: 'drawer',
})

defineEmits<{ (e: 'close'): void }>()

interface DiskUsage {
  filesystem: string
  mount: string
  used: string
  size: string
  percent: number
}

interface ProcessUsage {
  pid: string
  user: string
  cpu: number
  memory: number
  command: string
}

interface Metrics {
  cpuPercent: number
  memoryPercent: number
  memoryUsedMb?: number
  memoryTotalMb?: number
  diskPercent: number
  loadAverage: string
  uptime?: string
  hostname?: string
  kernel?: string
  processCount?: number
  diskUsage?: DiskUsage[]
  topProcesses?: ProcessUsage[]
}

const metrics = ref<Metrics | null>(null)
const history = ref<number[]>([])
const loading = ref(false)
const error = ref('')
let timer: number | undefined

const isDashboard = computed(() => props.mode === 'dashboard')
const diskRows = computed(() => metrics.value?.diskUsage?.length ? metrics.value.diskUsage : [])
const processRows = computed(() => metrics.value?.topProcesses?.length ? metrics.value.topProcesses : [])
const memoryText = computed(() => {
  const used = metrics.value?.memoryUsedMb
  const total = metrics.value?.memoryTotalMb
  if (!used || !total) return 'Memory'
  return `${formatGb(used)} / ${formatGb(total)}`
})
const sparklinePoints = computed(() => {
  const values = history.value.length ? history.value : [0]
  const width = 220
  const height = 54
  return values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width
    const y = height - (pct(value) / 100) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
})

onMounted(start)
onUnmounted(stop)
watch(() => props.sessionId, start)

function start() {
  stop()
  metrics.value = null
  history.value = []
  if (!props.sessionId) return
  refresh()
  timer = window.setInterval(refresh, 5000)
}

function stop() {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

async function refresh() {
  if (!props.sessionId) return
  loading.value = true
  error.value = ''
  try {
    const { RemoteMetrics } = await import('../../../wailsjs/go/main/App')
    const next = await RemoteMetrics(props.sessionId) as Metrics
    metrics.value = next
    history.value = [...history.value.slice(-23), pct(next.cpuPercent)]
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function pct(value?: number) {
  return Math.max(0, Math.min(100, Number(value ?? 0)))
}

function formatGb(valueMb: number) {
  return `${(valueMb / 1024).toFixed(1)} GB`
}
</script>

<template>
  <aside :class="['monitor-panel', { dashboard: isDashboard }]" aria-label="Remote monitor">
    <div class="monitor-head">
      <div>
        <div class="monitor-title wf-label">{{ sessionName || metrics?.hostname || 'Select a server' }}</div>
        <div class="monitor-sub">
          {{ metrics?.hostname || 'Remote observability' }}
          <span v-if="metrics?.kernel">/ {{ metrics.kernel }}</span>
        </div>
      </div>
      <button v-if="!isDashboard" class="icon-btn" title="Close monitor" @click="$emit('close')">x</button>
      <button class="refresh-btn head-refresh" :disabled="loading || !sessionId" @click="refresh">
        {{ loading ? 'Refreshing' : 'Refresh' }}
      </button>
    </div>

    <div v-if="error" class="monitor-error">{{ error }}</div>
    <div v-else-if="!sessionId" class="monitor-state">
      Select a server from the observability sidebar to begin.
    </div>
    <div v-else class="monitor-body">
      <section class="hero-metrics">
        <div class="metric primary">
          <span>CPU</span>
          <strong>{{ pct(metrics?.cpuPercent).toFixed(0) }}%</strong>
          <div class="meter"><i :style="{ width: `${pct(metrics?.cpuPercent)}%` }" /></div>
        </div>
        <div class="metric">
          <span>{{ memoryText }}</span>
          <strong>{{ pct(metrics?.memoryPercent).toFixed(0) }}%</strong>
          <div class="meter memory"><i :style="{ width: `${pct(metrics?.memoryPercent)}%` }" /></div>
        </div>
        <div class="metric">
          <span>Root disk</span>
          <strong>{{ pct(metrics?.diskPercent).toFixed(0) }}%</strong>
          <div class="meter disk"><i :style="{ width: `${pct(metrics?.diskPercent)}%` }" /></div>
        </div>
        <div class="metric">
          <span>Load avg</span>
          <strong class="compact">{{ metrics?.loadAverage || '-' }}</strong>
          <small>{{ metrics?.processCount || 0 }} processes</small>
        </div>
      </section>

      <section class="chart-panel">
        <div class="section-head">
          <h3>CPU trend</h3>
          <span>last {{ history.length }} samples</span>
        </div>
        <svg viewBox="0 0 220 54" preserveAspectRatio="none" aria-hidden="true">
          <polyline :points="sparklinePoints" />
        </svg>
      </section>

      <section class="split-panels">
        <div class="table-panel">
          <div class="section-head">
            <h3>Top processes</h3>
            <span>{{ metrics?.uptime || 'uptime unavailable' }}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>PID</th>
                <th>Command</th>
                <th>CPU</th>
                <th>MEM</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="proc in processRows" :key="`${proc.pid}-${proc.command}`">
                <td>{{ proc.pid }}</td>
                <td>
                  <strong>{{ proc.command }}</strong>
                  <small>{{ proc.user }}</small>
                </td>
                <td>{{ proc.cpu.toFixed(1) }}%</td>
                <td>{{ proc.memory.toFixed(1) }}%</td>
              </tr>
              <tr v-if="processRows.length === 0">
                <td colspan="4" class="empty-cell">Process data unavailable.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-panel">
          <div class="section-head">
            <h3>Disk usage</h3>
            <span>mounted filesystems</span>
          </div>
          <div class="disk-list">
            <div v-for="disk in diskRows" :key="`${disk.filesystem}-${disk.mount}`" class="disk-row">
              <div>
                <strong>{{ disk.mount }}</strong>
                <small>{{ disk.used }} / {{ disk.size }} - {{ disk.filesystem }}</small>
              </div>
              <span>{{ pct(disk.percent).toFixed(0) }}%</span>
              <div class="meter disk"><i :style="{ width: `${pct(disk.percent)}%` }" /></div>
            </div>
            <div v-if="diskRows.length === 0" class="empty-cell">Disk data unavailable.</div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.monitor-panel {
  width: 330px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-left: 1.5px solid var(--ink);
  box-shadow: -12px 0 28px rgba(28, 27, 25, 0.16);
  color: var(--ink);
}
.monitor-panel.dashboard {
  width: 100%;
  min-width: 0;
  border-left: none;
  box-shadow: none;
  background: var(--paper-sidebar);
}
.monitor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--paper-tabbar);
  border-bottom: 1.2px solid var(--faint);
}
.monitor-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}
.monitor-sub,
.monitor-error,
.monitor-state,
.section-head span,
.metric span,
.metric small,
.disk-row small,
td small {
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
}
.monitor-sub {
  margin-top: 2px;
  font-size: 12px;
}
.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--pencil);
  cursor: pointer;
  font-size: 15px;
}
.icon-btn:hover { background: var(--highlight); color: var(--ink); }
.monitor-error,
.monitor-state {
  padding: 18px;
}
.monitor-error {
  color: var(--env-prod);
}
.monitor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: auto;
}
.dashboard .monitor-body {
  padding: 16px;
}
.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.monitor-panel:not(.dashboard) .hero-metrics {
  grid-template-columns: 1fr;
}
.metric,
.chart-panel,
.table-panel {
  padding: 12px;
  border: 1.2px solid var(--faint);
  border-radius: var(--radius);
  background: rgba(250, 248, 244, 0.72);
}
.metric.primary {
  border-color: var(--ink);
}
.metric strong {
  display: block;
  margin: 4px 0 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
}
.metric strong.compact {
  font-size: 16px;
}
.meter {
  height: 7px;
  border: 1px solid var(--ink);
  border-radius: 5px;
  overflow: hidden;
}
.meter i {
  display: block;
  height: 100%;
  background: var(--env-dev);
}
.meter.memory i { background: var(--accent); }
.meter.disk i { background: var(--env-stg); }
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
}
.chart-panel svg {
  width: 100%;
  height: 92px;
  border: 1px dashed var(--faint);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.35);
}
.chart-panel polyline {
  fill: none;
  stroke: var(--env-dev);
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
}
.split-panels {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
}
.monitor-panel:not(.dashboard) .split-panels {
  grid-template-columns: 1fr;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
th,
td {
  padding: 7px 6px;
  border-top: 1px solid var(--faint);
  text-align: left;
  vertical-align: top;
}
th {
  color: var(--pencil);
  font-weight: 700;
}
td strong,
.disk-row strong {
  display: block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
  font-weight: 700;
}
td small,
.disk-row small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
}
.disk-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.disk-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 7px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.disk-row .meter {
  grid-column: 1 / -1;
}
.empty-cell {
  padding: 12px 6px;
  color: var(--pencil);
  font-family: 'Kalam', 'Caveat', cursive;
  text-align: center;
}
.refresh-btn {
  height: 28px;
  padding: 0 12px;
  border: 1.2px solid var(--ink);
  border-radius: 20px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-weight: 700;
}
.head-refresh {
  flex-shrink: 0;
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .hero-metrics,
  .split-panels {
    grid-template-columns: 1fr;
  }
}
</style>
