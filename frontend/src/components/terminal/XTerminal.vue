<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { EventsOff, EventsOn } from '../../../wailsjs/runtime/runtime'
import { registerTerminalWriter } from '../../stores/terminalBridge'
import { markSessionClosed } from '../../stores/sessions'
import { settings } from '../../stores/uiSettings'
import '@xterm/xterm/css/xterm.css'

const props = defineProps<{ sessionId: string }>()
const container = ref<HTMLElement>()
const contextMenu = ref({ open: false, x: 0, y: 0 })
let term: Terminal
let fit: FitAddon
let ro: ResizeObserver
let unregisterWriter: (() => void) | undefined
let disposeDataInput: (() => void) | undefined
let removeDataListener: (() => void) | undefined
let removeExitListener: (() => void) | undefined
let pasteInFlight = false
let remoteClosed = false

const isPreview = props.sessionId.startsWith('preview-')

onMounted(() => {
  term = new Terminal({
    theme: {
      background:          'rgba(0,0,0,0)',
      foreground:          getComputedStyle(document.documentElement).getPropertyValue('--terminal-fg').trim() || '#FAF8F4',
      cursor:              getComputedStyle(document.documentElement).getPropertyValue('--terminal-fg').trim() || '#FAF8F4',
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
    allowTransparency: true,
    rightClickSelectsWord: true,
  })
  fit = new FitAddon()
  term.loadAddon(fit)
  term.open(container.value!)
  term.attachCustomKeyEventHandler(handleTerminalKey)
  fit.fit()
  setTimeout(() => term.focus(), 0)

  if (isPreview) {
    term.writeln('')
    term.writeln(`  \x1b[90mPreview session ${props.sessionId}\x1b[0m`)
    term.writeln('  \x1b[90mRun with wails dev for a real SSH PTY.\x1b[0m')
    term.writeln('')
    term.write('$ ')
  } else {
    attachRemotePty()
  }

  const dataInput = term.onData((data) => {
    if (isPreview) {
      if (data === '\r') {
        term.write('\r\n$ ')
      } else if (data === '\x7f') {
        term.write('\b \b')
      } else {
        term.write(data)
      }
    } else {
      sendRemoteInput(data)
    }
  })
  disposeDataInput = () => dataInput.dispose()

  unregisterWriter = registerTerminalWriter(props.sessionId, (command, execute) => {
    if (remoteClosed) return
    if (isPreview) {
      term.write(command)
      if (execute) term.write('\r\n$ ')
    } else {
      sendRemoteInput(execute ? `${command}\r` : command)
    }
  })

  ro = new ResizeObserver(() => {
    fit.fit()
    if (!isPreview) {
      resizeRemotePty()
    }
  })
  ro.observe(container.value!)
})

watch(settings, () => {
  if (!term) return
  term.options.theme = {
    ...term.options.theme,
    background: 'rgba(0,0,0,0)',
    foreground: settings.value.terminalFg,
    cursor: settings.value.terminalFg,
  }
}, { deep: true })

onUnmounted(() => {
  unregisterWriter?.()
  disposeDataInput?.()
  removeDataListener?.()
  removeExitListener?.()
  if (!isPreview) {
    EventsOff(`ssh:data:${props.sessionId}`, `ssh:exit:${props.sessionId}`)
  }
  ro?.disconnect()
  term?.dispose()
})

async function attachRemotePty() {
  try {
    removeDataListener = EventsOn(`ssh:data:${props.sessionId}`, (encoded: string) => {
      term.write(decodeBase64(encoded))
    })
    removeExitListener = EventsOn(`ssh:exit:${props.sessionId}`, (message: string) => {
      remoteClosed = true
      markSessionClosed(props.sessionId)
      term.writeln('')
      term.writeln(`\x1b[31m[session closed${message ? `: ${message}` : ''}]\x1b[0m`)
    })

    const { SSHStart } = await import('../../../wailsjs/go/main/App')
    await SSHStart(props.sessionId, term.cols, term.rows)
  } catch (e) {
    term.writeln('')
    term.writeln(`\x1b[31m[failed to start SSH shell: ${formatError(e)}]\x1b[0m`)
  }
}

async function sendRemoteInput(input: string) {
  if (remoteClosed) return
  try {
    const { SSHWrite } = await import('../../../wailsjs/go/main/App')
    await SSHWrite(props.sessionId, input)
  } catch (e) {
    if (isClosedSessionError(e)) {
      remoteClosed = true
      markSessionClosed(props.sessionId)
    }
    term.writeln('')
    term.writeln(`\x1b[31m[write failed: ${formatError(e)}]\x1b[0m`)
  }
}

async function resizeRemotePty() {
  try {
    const { SSHResize } = await import('../../../wailsjs/go/main/App')
    await SSHResize(props.sessionId, term.cols, term.rows)
  } catch (e) {
    console.warn('SSHResize failed:', e)
  }
}

function handleTerminalKey(event: KeyboardEvent) {
  const key = event.key.toLowerCase()
  const ctrlOrMeta = event.ctrlKey || event.metaKey

  if (ctrlOrMeta && key === 'c') {
    const selectedText = term.getSelection()
    if (selectedText) {
      copyText(selectedText)
      return false
    }
    return true
  }

  if (ctrlOrMeta && key === 'v') {
    pasteClipboardFromKeyboard(event)
    return false
  }

  if (ctrlOrMeta && event.shiftKey && key === 'c') {
    const selectedText = term.getSelection()
    if (selectedText) {
      copyText(selectedText)
    }
    return false
  }

  if (ctrlOrMeta && event.shiftKey && key === 'v') {
    pasteClipboardFromKeyboard(event)
    return false
  }

  return true
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    console.warn('copy failed:', e)
  }
}

async function pasteClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      if (isPreview) {
        term.write(text)
      } else {
        sendRemoteInput(text)
      }
    }
  } catch (e) {
    console.warn('paste failed:', e)
  }
}

async function pasteClipboardFromKeyboard(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.repeat || pasteInFlight) return
  pasteInFlight = true
  try {
    await pasteClipboard()
  } finally {
    window.setTimeout(() => {
      pasteInFlight = false
    }, 0)
  }
}

async function copySelectionFromMenu() {
  const selectedText = term?.getSelection()
  if (selectedText) {
    await copyText(selectedText)
  }
  closeContextMenu()
}

async function pasteFromMenu() {
  await pasteClipboard()
  closeContextMenu()
  focusTerminal()
}

function openContextMenu(event: MouseEvent) {
  contextMenu.value = {
    open: true,
    x: event.offsetX,
    y: event.offsetY,
  }
}

function closeContextMenu() {
  contextMenu.value.open = false
}

function decodeBase64(encoded: string) {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function formatError(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function isClosedSessionError(e: unknown) {
  return formatError(e).toLowerCase().includes('session') &&
    formatError(e).toLowerCase().includes('closed')
}

function focusTerminal() {
  closeContextMenu()
  term?.focus()
}
</script>

<template>
  <div
    ref="container"
    class="xterm-wrap"
    @mousedown="focusTerminal"
    @contextmenu.prevent.stop="openContextMenu"
  >
    <div
      v-if="contextMenu.open"
      class="terminal-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @mousedown.stop
      @click.stop
    >
      <button type="button" @click="copySelectionFromMenu">Copy</button>
      <button type="button" @click="pasteFromMenu">Paste</button>
    </div>
  </div>
</template>

<style scoped>
.xterm-wrap {
  flex: 1;
  overflow: hidden;
  padding: 4px 4px 0;
  position: relative;
  background-image:
    linear-gradient(rgba(28, 27, 25, var(--terminal-bg-overlay, 0.78)), rgba(28, 27, 25, var(--terminal-bg-overlay, 0.78))),
    var(--terminal-bg-image, none);
  background-size: cover;
  background-position: center;
}
.terminal-menu {
  position: absolute;
  z-index: 12;
  min-width: 116px;
  padding: 5px;
  border: 1px solid rgba(250, 248, 244, 0.24);
  border-radius: 6px;
  background: rgba(28, 27, 25, 0.96);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
}
.terminal-menu button {
  display: block;
  width: 100%;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--terminal-fg);
  cursor: pointer;
  text-align: left;
  padding: 0 9px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.terminal-menu button:hover {
  background: rgba(250, 248, 244, 0.12);
}
.xterm-wrap :deep(.xterm) {
  height: 100%;
}
.xterm-wrap :deep(.xterm-screen),
.xterm-wrap :deep(.xterm-helpers),
.xterm-wrap :deep(.xterm-text-layer),
.xterm-wrap :deep(.xterm-selection-layer) {
  background: transparent !important;
}
.xterm-wrap :deep(.xterm-viewport) {
  background: transparent !important;
}
</style>
