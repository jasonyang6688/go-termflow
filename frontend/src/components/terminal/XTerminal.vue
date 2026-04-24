<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const props = defineProps<{ sessionId: string }>()
const container = ref<HTMLElement>()
let term: Terminal
let fit: FitAddon
let ro: ResizeObserver

onMounted(() => {
  term = new Terminal({
    theme: {
      background:          '#1C1B19',
      foreground:          '#FAF8F4',
      cursor:              '#FAF8F4',
      selectionBackground: 'rgba(250,248,244,0.2)',
      black:               '#1C1B19',
      brightBlack:         '#6B6864',
      white:               '#FAF8F4',
      brightWhite:         '#FAF8F4',
    },
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    fontSize:   13,
    lineHeight: 1.5,
    cursorBlink: true,
    scrollback:  5000,
    allowTransparency: false,
  })
  fit = new FitAddon()
  term.loadAddon(fit)
  term.open(container.value!)
  fit.fit()

  term.writeln('')
  term.writeln(`  \x1b[90mConnected to session ${props.sessionId}\x1b[0m`)
  term.writeln(`  \x1b[90mType commands below — PTY bridge coming soon\x1b[0m`)
  term.writeln('')
  term.write('$ ')

  term.onKey(({ key, domEvent }) => {
    if (domEvent.key === 'Enter') {
      term.write('\r\n$ ')
    } else if (domEvent.key === 'Backspace') {
      term.write('\b \b')
    } else {
      term.write(key)
    }
  })

  ro = new ResizeObserver(() => fit.fit())
  ro.observe(container.value!)
})

onUnmounted(() => {
  ro?.disconnect()
  term?.dispose()
})
</script>

<template>
  <div ref="container" class="xterm-wrap" />
</template>

<style scoped>
.xterm-wrap {
  flex: 1;
  overflow: hidden;
  padding: 4px 4px 0;
}
.xterm-wrap :deep(.xterm) {
  height: 100%;
}
.xterm-wrap :deep(.xterm-viewport) {
  background: transparent !important;
}
</style>
