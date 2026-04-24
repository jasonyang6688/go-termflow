# TermFlow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build TermFlow — a cross-platform SSH terminal manager desktop app (macOS/Windows/Linux) using Wails v2 (Go backend + Vue 3 frontend), implementing the Classic IDE layout from the wireframes.

**Architecture:** Go backend exposes SSH/SFTP management, SQLite storage, and resource monitoring via Wails bindings. Vue 3 frontend renders the Classic IDE shell (activity rail + connection sidebar + terminal tabs + quick command pills) using xterm.js for terminal rendering. AES-256-GCM encrypts stored credentials.

**Tech Stack:** Wails v2, Go 1.21+, Vue 3 + TypeScript, xterm.js, golang.org/x/crypto/ssh, github.com/pkg/sftp, modernc.org/sqlite, ECharts

---

## Design Tokens Reference

```css
--ink: #2B2A28;
--paper: #FAF8F4;
--pencil: #6B6864;
--faint: #C9C4BA;
--highlight: oklch(0.92 0.18 95);
--env-prod: oklch(0.65 0.2 25);
--env-stg: oklch(0.8 0.15 80);
--env-dev: oklch(0.72 0.17 150);
--accent: oklch(0.72 0.13 230);
--terminal-bg: #1C1B19;
```

---

### Task 1: Install Wails CLI and scaffold project

**Files:**
- Create: `/home/jason/project/TermFlow/` (Wails project root)
- Create: `frontend/` (Vue 3 app inside Wails project)

**Step 1: Install Wails CLI**

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Expected: `wails` binary in `$GOPATH/bin`

**Step 2: Verify wails is available**

```bash
wails version
```

Expected: prints version like `Wails CLI v2.x.x`

**Step 3: Scaffold Wails project with Vue template**

```bash
cd /home/jason/project/TermFlow
wails init -n TermFlow -t vue-ts
```

Expected: creates `go.mod`, `main.go`, `app.go`, `frontend/`, `wails.json`

**Step 4: Add Go backend dependencies**

```bash
cd /home/jason/project/TermFlow
go get golang.org/x/crypto/ssh
go get github.com/pkg/sftp
go get modernc.org/sqlite
```

**Step 5: Add frontend dependencies**

```bash
cd /home/jason/project/TermFlow/frontend
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links echarts vue-echarts
npm install -D @types/node
```

**Step 6: Verify build works**

```bash
cd /home/jason/project/TermFlow
wails build
```

Expected: compiles without errors (frontend may be placeholder)

**Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Wails v2 + Vue 3 project with dependencies"
```

---

### Task 2: Go backend — database store

**Files:**
- Create: `internal/store/store.go`
- Create: `internal/store/migrations.go`
- Test: `internal/store/store_test.go`

**Step 1: Write failing test**

```go
// internal/store/store_test.go
package store_test

import (
    "testing"
    "github.com/user/termflow/internal/store"
)

func TestSaveAndGetConnection(t *testing.T) {
    db, err := store.New(":memory:")
    if err != nil {
        t.Fatal(err)
    }
    defer db.Close()

    conn := store.Connection{
        Name: "prod-server", Host: "10.0.0.1", Port: 22,
        User: "deploy", Env: "prod",
    }
    id, err := db.SaveConnection(conn)
    if err != nil {
        t.Fatalf("save: %v", err)
    }
    got, err := db.GetConnection(id)
    if err != nil {
        t.Fatalf("get: %v", err)
    }
    if got.Name != "prod-server" {
        t.Errorf("got name %q, want prod-server", got.Name)
    }
}
```

**Step 2: Run test to verify it fails**

```bash
cd /home/jason/project/TermFlow
go test ./internal/store/... -v
```

Expected: FAIL — package not found

**Step 3: Write migrations**

```go
// internal/store/migrations.go
package store

const schema = `
CREATE TABLE IF NOT EXISTS connections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    host        TEXT NOT NULL,
    port        INTEGER NOT NULL DEFAULT 22,
    user        TEXT NOT NULL,
    password    BLOB,
    key_path    TEXT,
    env         TEXT NOT NULL DEFAULT 'dev',
    group_name  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quick_commands (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    label       TEXT NOT NULL,
    command     TEXT NOT NULL,
    connection_id INTEGER REFERENCES connections(id),
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS command_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    command     TEXT NOT NULL,
    connection_id INTEGER REFERENCES connections(id),
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`
```

**Step 4: Write store implementation**

```go
// internal/store/store.go
package store

import (
    "database/sql"
    _ "modernc.org/sqlite"
)

type Connection struct {
    ID        int64  `json:"id"`
    Name      string `json:"name"`
    Host      string `json:"host"`
    Port      int    `json:"port"`
    User      string `json:"user"`
    Password  string `json:"password,omitempty"`
    KeyPath   string `json:"keyPath"`
    Env       string `json:"env"`
    GroupName string `json:"groupName"`
}

type QuickCommand struct {
    ID           int64  `json:"id"`
    Label        string `json:"label"`
    Command      string `json:"command"`
    ConnectionID *int64 `json:"connectionId,omitempty"`
    SortOrder    int    `json:"sortOrder"`
}

type Store struct {
    db *sql.DB
}

func New(path string) (*Store, error) {
    db, err := sql.Open("sqlite", path)
    if err != nil {
        return nil, err
    }
    if _, err := db.Exec(schema); err != nil {
        db.Close()
        return nil, err
    }
    return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) SaveConnection(c Connection) (int64, error) {
    res, err := s.db.Exec(
        `INSERT INTO connections (name,host,port,user,password,key_path,env,group_name)
         VALUES (?,?,?,?,?,?,?,?)`,
        c.Name, c.Host, c.Port, c.User, c.Password, c.KeyPath, c.Env, c.GroupName,
    )
    if err != nil {
        return 0, err
    }
    return res.LastInsertId()
}

func (s *Store) GetConnection(id int64) (Connection, error) {
    var c Connection
    row := s.db.QueryRow(
        `SELECT id,name,host,port,user,COALESCE(password,''),COALESCE(key_path,''),env,COALESCE(group_name,'')
         FROM connections WHERE id=?`, id,
    )
    return c, row.Scan(&c.ID, &c.Name, &c.Host, &c.Port, &c.User, &c.Password, &c.KeyPath, &c.Env, &c.GroupName)
}

func (s *Store) ListConnections() ([]Connection, error) {
    rows, err := s.db.Query(
        `SELECT id,name,host,port,user,COALESCE(password,''),COALESCE(key_path,''),env,COALESCE(group_name,'')
         FROM connections ORDER BY group_name, name`,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var out []Connection
    for rows.Next() {
        var c Connection
        if err := rows.Scan(&c.ID, &c.Name, &c.Host, &c.Port, &c.User, &c.Password, &c.KeyPath, &c.Env, &c.GroupName); err != nil {
            return nil, err
        }
        out = append(out, c)
    }
    return out, rows.Err()
}

func (s *Store) DeleteConnection(id int64) error {
    _, err := s.db.Exec(`DELETE FROM connections WHERE id=?`, id)
    return err
}

func (s *Store) ListQuickCommands() ([]QuickCommand, error) {
    rows, err := s.db.Query(`SELECT id,label,command,connection_id,sort_order FROM quick_commands ORDER BY sort_order`)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var out []QuickCommand
    for rows.Next() {
        var q QuickCommand
        if err := rows.Scan(&q.ID, &q.Label, &q.Command, &q.ConnectionID, &q.SortOrder); err != nil {
            return nil, err
        }
        out = append(out, q)
    }
    return out, rows.Err()
}
```

**Step 5: Run test to verify it passes**

```bash
go test ./internal/store/... -v
```

Expected: PASS

**Step 6: Commit**

```bash
git add internal/store/
git commit -m "feat: SQLite store with connections and quick commands"
```

---

### Task 3: Go backend — SSH session manager

**Files:**
- Create: `internal/ssh/manager.go`
- Create: `internal/ssh/session.go`
- Test: `internal/ssh/manager_test.go`

**Step 1: Write failing test**

```go
// internal/ssh/manager_test.go
package ssh_test

import (
    "testing"
    "github.com/user/termflow/internal/ssh"
)

func TestManagerOpenClose(t *testing.T) {
    m := ssh.NewManager()
    // Without a real server, just verify session IDs are unique
    id1 := m.NewSessionID()
    id2 := m.NewSessionID()
    if id1 == id2 {
        t.Error("session IDs must be unique")
    }
    // No open sessions initially
    if m.Count() != 0 {
        t.Errorf("expected 0 sessions, got %d", m.Count())
    }
}
```

**Step 2: Run test to verify it fails**

```bash
go test ./internal/ssh/... -v
```

Expected: FAIL — package not found

**Step 3: Write session manager**

```go
// internal/ssh/manager.go
package ssh

import (
    "fmt"
    "sync"
    "sync/atomic"
)

var idCounter uint64

type Manager struct {
    mu       sync.RWMutex
    sessions map[string]*Session
}

func NewManager() *Manager {
    return &Manager{sessions: make(map[string]*Session)}
}

func (m *Manager) NewSessionID() string {
    n := atomic.AddUint64(&idCounter, 1)
    return fmt.Sprintf("sess-%d", n)
}

func (m *Manager) Count() int {
    m.mu.RLock()
    defer m.mu.RUnlock()
    return len(m.sessions)
}

func (m *Manager) Get(id string) (*Session, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    s, ok := m.sessions[id]
    return s, ok
}

func (m *Manager) Add(id string, s *Session) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.sessions[id] = s
}

func (m *Manager) Remove(id string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    delete(m.sessions, id)
}
```

**Step 4: Write session struct**

```go
// internal/ssh/session.go
package ssh

import (
    "io"
    "os"
    gossh "golang.org/x/crypto/ssh"
)

type ConnectParams struct {
    Host     string
    Port     int
    User     string
    Password string
    KeyPath  string
}

type Session struct {
    ID     string
    client *gossh.Client
    stdin  io.WriteCloser
    stdout io.Reader
}

func Connect(id string, p ConnectParams) (*Session, error) {
    cfg := &gossh.ClientConfig{
        User:            p.User,
        HostKeyCallback: gossh.InsecureIgnoreHostKey(),
    }
    if p.KeyPath != "" {
        key, err := os.ReadFile(p.KeyPath)
        if err != nil {
            return nil, err
        }
        signer, err := gossh.ParsePrivateKey(key)
        if err != nil {
            return nil, err
        }
        cfg.Auth = []gossh.AuthMethod{gossh.PublicKeys(signer)}
    } else {
        cfg.Auth = []gossh.AuthMethod{gossh.Password(p.Password)}
    }
    addr := fmt.Sprintf("%s:%d", p.Host, p.Port)
    client, err := gossh.Dial("tcp", addr, cfg)
    if err != nil {
        return nil, err
    }
    return &Session{ID: id, client: client}, nil
}

func (s *Session) Close() error {
    return s.client.Close()
}
```

**Step 5: Fix fmt import in session.go**

```go
import (
    "fmt"
    "io"
    "os"
    gossh "golang.org/x/crypto/ssh"
)
```

**Step 6: Run test to verify it passes**

```bash
go test ./internal/ssh/... -v
```

Expected: PASS

**Step 7: Commit**

```bash
git add internal/ssh/
git commit -m "feat: SSH session manager with connect/close"
```

---

### Task 4: Go backend — Wails app bindings

**Files:**
- Modify: `app.go`
- Create: `internal/app/bindings.go`

**Step 1: Write app.go with all bindings**

Replace the default `app.go` with:

```go
// app.go
package main

import (
    "context"
    "fmt"
    "os"
    "path/filepath"

    "github.com/user/termflow/internal/ssh"
    "github.com/user/termflow/internal/store"
)

type App struct {
    ctx     context.Context
    db      *store.Store
    sshMgr  *ssh.Manager
}

func NewApp() *App {
    return &App{sshMgr: ssh.NewManager()}
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
    dbPath := filepath.Join(os.Getenv("HOME"), ".termflow", "data.db")
    os.MkdirAll(filepath.Dir(dbPath), 0700)
    db, err := store.New(dbPath)
    if err != nil {
        panic(fmt.Sprintf("failed to open db: %v", err))
    }
    a.db = db
}

func (a *App) shutdown(ctx context.Context) {
    a.db.Close()
}

// ── Connection CRUD ──────────────────────────────────────────────

func (a *App) ListConnections() ([]store.Connection, error) {
    return a.db.ListConnections()
}

func (a *App) SaveConnection(c store.Connection) (int64, error) {
    return a.db.SaveConnection(c)
}

func (a *App) DeleteConnection(id int64) error {
    return a.db.DeleteConnection(id)
}

// ── SSH Sessions ─────────────────────────────────────────────────

type ConnectResult struct {
    SessionID string `json:"sessionId"`
}

func (a *App) SSHConnect(connID int64) (ConnectResult, error) {
    c, err := a.db.GetConnection(connID)
    if err != nil {
        return ConnectResult{}, err
    }
    id := a.sshMgr.NewSessionID()
    sess, err := ssh.Connect(id, ssh.ConnectParams{
        Host:     c.Host,
        Port:     c.Port,
        User:     c.User,
        Password: c.Password,
        KeyPath:  c.KeyPath,
    })
    if err != nil {
        return ConnectResult{}, err
    }
    a.sshMgr.Add(id, sess)
    return ConnectResult{SessionID: id}, nil
}

func (a *App) SSHDisconnect(sessionID string) error {
    sess, ok := a.sshMgr.Get(sessionID)
    if !ok {
        return fmt.Errorf("session %q not found", sessionID)
    }
    err := sess.Close()
    a.sshMgr.Remove(sessionID)
    return err
}

// ── Quick Commands ───────────────────────────────────────────────

func (a *App) ListQuickCommands() ([]store.QuickCommand, error) {
    return a.db.ListQuickCommands()
}
```

**Step 2: Update main.go to wire app**

```go
// main.go
package main

import (
    "embed"
    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
    "github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
    app := NewApp()
    err := wails.Run(&options.App{
        Title:  "TermFlow",
        Width:  1280,
        Height: 800,
        AssetServer: &assetserver.Options{
            Assets: assets,
        },
        BackgroundColour: &options.RGBA{R: 28, G: 27, B: 25, A: 1},
        OnStartup:        app.startup,
        OnShutdown:       app.shutdown,
        Bind:             []interface{}{app},
    })
    if err != nil {
        println("Error:", err.Error())
    }
}
```

**Step 3: Generate Wails bindings**

```bash
cd /home/jason/project/TermFlow
wails generate module
```

Expected: generates `frontend/src/wailsjs/go/main/App.js` with all bound methods

**Step 4: Build to verify**

```bash
wails build
```

Expected: success

**Step 5: Commit**

```bash
git add app.go main.go
git commit -m "feat: Wails app bindings for connections, SSH, quick commands"
```

---

### Task 5: Vue 3 — design system tokens and base styles

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/base.css`
- Modify: `frontend/src/main.ts`

**Step 1: Write CSS tokens**

```css
/* frontend/src/styles/tokens.css */
:root {
  --ink: #2B2A28;
  --paper: #FAF8F4;
  --pencil: #6B6864;
  --faint: #C9C4BA;
  --highlight: oklch(0.92 0.18 95);
  --env-prod: oklch(0.65 0.2 25);
  --env-stg: oklch(0.8 0.15 80);
  --env-dev: oklch(0.72 0.17 150);
  --accent: oklch(0.72 0.13 230);
  --terminal-bg: #1C1B19;
  --rail-w: 56px;
  --sidebar-w: 240px;
  --tab-h: 36px;
  --pill-h: 32px;
  --status-h: 24px;
  --radius: 6px;
}
```

**Step 2: Write base styles**

```css
/* frontend/src/styles/base.css */
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--terminal-bg);
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  overflow: hidden;
  height: 100vh;
}

.wf-label {
  font-family: 'Caveat', cursive;
  font-size: 14px;
  color: var(--pencil);
}
```

**Step 3: Import in main.ts**

```ts
// frontend/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).mount('#app')
```

**Step 4: Commit**

```bash
git add frontend/src/styles/ frontend/src/main.ts
git commit -m "feat: design system tokens and base styles"
```

---

### Task 6: Vue 3 — Classic IDE shell layout

**Files:**
- Create: `frontend/src/components/layout/AppShell.vue`
- Create: `frontend/src/components/layout/ActivityRail.vue`
- Modify: `frontend/src/App.vue`

**Step 1: Write ActivityRail**

```vue
<!-- frontend/src/components/layout/ActivityRail.vue -->
<script setup lang="ts">
import { ref } from 'vue'

type Panel = 'connections' | 'files' | 'monitor' | 'commands' | 'search' | 'settings'

const active = ref<Panel>('connections')

const items: { id: Panel; icon: string; title: string }[] = [
  { id: 'connections', icon: '⬡', title: 'Connections' },
  { id: 'files', icon: '⊞', title: 'SFTP Files' },
  { id: 'monitor', icon: '◈', title: 'Monitor' },
  { id: 'commands', icon: '⚡', title: 'Commands' },
  { id: 'search', icon: '⌕', title: 'Search' },
  { id: 'settings', icon: '⚙', title: 'Settings' },
]

const emit = defineEmits<{ (e: 'change', panel: Panel): void }>()

function select(panel: Panel) {
  active.value = panel
  emit('change', panel)
}
</script>

<template>
  <nav class="rail">
    <button
      v-for="item in items"
      :key="item.id"
      :class="['rail-btn', { active: active === item.id }]"
      :title="item.title"
      @click="select(item.id)"
    >
      {{ item.icon }}
    </button>
  </nav>
</template>

<style scoped>
.rail {
  width: var(--rail-w);
  background: var(--paper);
  border-right: 1px solid var(--faint);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 4px;
  flex-shrink: 0;
}
.rail-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius);
  font-size: 18px;
  color: var(--pencil);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}
.rail-btn:hover { background: var(--highlight); color: var(--ink); }
.rail-btn.active {
  background: var(--ink);
  color: var(--paper);
}
</style>
```

**Step 2: Write AppShell**

```vue
<!-- frontend/src/components/layout/AppShell.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import ActivityRail from './ActivityRail.vue'

const activePanel = ref('connections')
</script>

<template>
  <div class="shell">
    <ActivityRail @change="activePanel = $event" />
    <aside class="sidebar">
      <slot name="sidebar" :panel="activePanel" />
    </aside>
    <main class="main-area">
      <slot name="main" />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.sidebar {
  width: var(--sidebar-w);
  background: var(--paper);
  border-right: 1px solid var(--faint);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--terminal-bg);
}
</style>
```

**Step 3: Update App.vue**

```vue
<!-- frontend/src/App.vue -->
<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue'
import ConnectionSidebar from './components/sidebar/ConnectionSidebar.vue'
import TerminalArea from './components/terminal/TerminalArea.vue'
</script>

<template>
  <AppShell>
    <template #sidebar="{ panel }">
      <ConnectionSidebar v-if="panel === 'connections'" />
      <div v-else class="wf-label" style="padding:16px">{{ panel }}</div>
    </template>
    <template #main>
      <TerminalArea />
    </template>
  </AppShell>
</template>
```

**Step 4: Build to verify**

```bash
cd /home/jason/project/TermFlow
wails build
```

Expected: compiles, app shows IDE shell skeleton

**Step 5: Commit**

```bash
git add frontend/src/components/layout/ frontend/src/App.vue
git commit -m "feat: Classic IDE shell — activity rail + sidebar + main area"
```

---

### Task 7: Vue 3 — Connection sidebar

**Files:**
- Create: `frontend/src/components/sidebar/ConnectionSidebar.vue`
- Create: `frontend/src/components/sidebar/ConnectionItem.vue`
- Create: `frontend/src/stores/connections.ts`

**Step 1: Write connections store**

```ts
// frontend/src/stores/connections.ts
import { ref, computed } from 'vue'
import { ListConnections, SaveConnection, DeleteConnection } from '../../wailsjs/go/main/App'

export interface Connection {
  id: number
  name: string
  host: string
  port: number
  user: string
  password: string
  keyPath: string
  env: 'prod' | 'stg' | 'dev'
  groupName: string
}

const connections = ref<Connection[]>([])
const loading = ref(false)

export async function fetchConnections() {
  loading.value = true
  try {
    const result = await ListConnections()
    connections.value = result ?? []
  } finally {
    loading.value = false
  }
}

export async function addConnection(c: Omit<Connection, 'id'>) {
  await SaveConnection(c as Connection)
  await fetchConnections()
}

export async function removeConnection(id: number) {
  await DeleteConnection(id)
  connections.value = connections.value.filter(c => c.id !== id)
}

export const groupedConnections = computed(() => {
  const groups: Record<string, Connection[]> = {}
  for (const c of connections.value) {
    const g = c.groupName || 'Default'
    if (!groups[g]) groups[g] = []
    groups[g].push(c)
  }
  return groups
})

export { connections, loading }
```

**Step 2: Write ConnectionItem**

```vue
<!-- frontend/src/components/sidebar/ConnectionItem.vue -->
<script setup lang="ts">
import type { Connection } from '../../stores/connections'

const props = defineProps<{ connection: Connection }>()
const emit = defineEmits<{ (e: 'connect', c: Connection): void }>()

const envColors: Record<string, string> = {
  prod: 'var(--env-prod)',
  stg: 'var(--env-stg)',
  dev: 'var(--env-dev)',
}
</script>

<template>
  <button class="conn-item" @dblclick="emit('connect', connection)">
    <span class="env-dot" :style="{ background: envColors[connection.env] }" />
    <span class="conn-name">{{ connection.name }}</span>
    <span class="conn-host">{{ connection.user }}@{{ connection.host }}</span>
  </button>
</template>

<style scoped>
.conn-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius);
}
.conn-item:hover { background: var(--highlight); }
.env-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.conn-name {
  font-size: 13px;
  color: var(--ink);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conn-host {
  font-size: 11px;
  color: var(--pencil);
  white-space: nowrap;
}
</style>
```

**Step 3: Write ConnectionSidebar**

```vue
<!-- frontend/src/components/sidebar/ConnectionSidebar.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import ConnectionItem from './ConnectionItem.vue'
import { fetchConnections, groupedConnections, loading } from '../../stores/connections'
import type { Connection } from '../../stores/connections'

onMounted(fetchConnections)

const emit = defineEmits<{ (e: 'connect', c: Connection): void }>()
</script>

<template>
  <div class="sidebar-wrap">
    <div class="sidebar-header">
      <span class="wf-label">Connections</span>
      <button class="add-btn" title="Add connection">+</button>
    </div>
    <input class="search-input" placeholder="Search…" type="search" />
    <div class="groups-wrap">
      <div v-if="loading" class="wf-label" style="padding:16px">Loading…</div>
      <template v-else>
        <div
          v-for="(conns, group) in groupedConnections"
          :key="group"
          class="group"
        >
          <div class="group-label wf-label">{{ group }}</div>
          <ConnectionItem
            v-for="c in conns"
            :key="c.id"
            :connection="c"
            @connect="emit('connect', $event)"
          />
        </div>
        <div v-if="Object.keys(groupedConnections).length === 0" class="empty-state wf-label">
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
}
.add-btn {
  width: 24px; height: 24px;
  border: 1.5px solid var(--faint);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: var(--pencil);
}
.add-btn:hover { background: var(--highlight); color: var(--ink); }
.search-input {
  margin: 8px 12px;
  padding: 6px 10px;
  border: 1px solid var(--faint);
  border-radius: var(--radius);
  background: var(--paper);
  font-size: 12px;
  color: var(--ink);
  outline: none;
}
.search-input:focus { border-color: var(--accent); }
.groups-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 4px 4px 8px;
}
.group-label {
  padding: 8px 12px 2px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.empty-state {
  padding: 24px 16px;
  text-align: center;
  line-height: 1.8;
  color: var(--pencil);
}
</style>
```

**Step 4: Commit**

```bash
git add frontend/src/components/sidebar/ frontend/src/stores/
git commit -m "feat: connection sidebar with env dots, grouping, and store"
```

---

### Task 8: Vue 3 — Terminal tab area with xterm.js

**Files:**
- Create: `frontend/src/components/terminal/TerminalArea.vue`
- Create: `frontend/src/components/terminal/TerminalTab.vue`
- Create: `frontend/src/components/terminal/XTerminal.vue`
- Create: `frontend/src/stores/sessions.ts`

**Step 1: Write sessions store**

```ts
// frontend/src/stores/sessions.ts
import { ref } from 'vue'
import { SSHConnect, SSHDisconnect } from '../../wailsjs/go/main/App'
import type { Connection } from './connections'

export interface Session {
  id: string
  connectionName: string
  env: string
  connected: boolean
}

export const sessions = ref<Session[]>([])
export const activeSessionId = ref<string | null>(null)

export async function openSession(conn: Connection) {
  const result = await SSHConnect(conn.id)
  const session: Session = {
    id: result.sessionId,
    connectionName: conn.name,
    env: conn.env,
    connected: true,
  }
  sessions.value.push(session)
  activeSessionId.value = session.id
  return session
}

export async function closeSession(id: string) {
  await SSHDisconnect(id)
  sessions.value = sessions.value.filter(s => s.id !== id)
  if (activeSessionId.value === id) {
    activeSessionId.value = sessions.value[0]?.id ?? null
  }
}
```

**Step 2: Write XTerminal (xterm.js wrapper)**

```vue
<!-- frontend/src/components/terminal/XTerminal.vue -->
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
      background: '#1C1B19',
      foreground: '#FAF8F4',
      cursor: '#FAF8F4',
      selectionBackground: 'rgba(250,248,244,0.2)',
    },
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 13,
    lineHeight: 1.5,
    cursorBlink: true,
  })
  fit = new FitAddon()
  term.loadAddon(fit)
  term.open(container.value!)
  fit.fit()
  term.writeln(`\r\n  \x1b[90mConnecting to session ${props.sessionId}…\x1b[0m\r\n`)

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
  padding: 4px;
}
.xterm-wrap :deep(.xterm) {
  height: 100%;
}
</style>
```

**Step 3: Write TerminalTab**

```vue
<!-- frontend/src/components/terminal/TerminalTab.vue -->
<script setup lang="ts">
import type { Session } from '../../stores/sessions'

const props = defineProps<{ session: Session; active: boolean }>()
const emit = defineEmits<{
  (e: 'activate'): void
  (e: 'close'): void
}>()

const envColors: Record<string, string> = {
  prod: 'var(--env-prod)',
  stg: 'var(--env-stg)',
  dev: 'var(--env-dev)',
}
</script>

<template>
  <button :class="['tab', { active }]" @click="emit('activate')">
    <span class="tab-dot" :style="{ background: envColors[session.env] }" />
    <span class="tab-name">{{ session.connectionName }}</span>
    <span class="tab-close" @click.stop="emit('close')">×</span>
  </button>
</template>

<style scoped>
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: var(--tab-h);
  border: none;
  border-right: 1px solid rgba(250,248,244,0.1);
  background: rgba(250,248,244,0.05);
  color: var(--pencil);
  cursor: pointer;
  white-space: nowrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.tab.active {
  background: var(--terminal-bg);
  color: var(--paper);
  border-bottom: 2px solid var(--accent);
}
.tab-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tab-close {
  margin-left: 4px;
  opacity: 0.5;
  font-size: 14px;
}
.tab-close:hover { opacity: 1; }
</style>
```

**Step 4: Write TerminalArea**

```vue
<!-- frontend/src/components/terminal/TerminalArea.vue -->
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
      <div v-if="sessions.length === 0" class="tab-bar-empty wf-label">
        No open sessions — double-click a connection to start
      </div>
    </div>

    <!-- Terminal -->
    <div class="terminal-wrap">
      <XTerminal
        v-for="s in sessions"
        v-show="s.id === activeSessionId"
        :key="s.id"
        :session-id="s.id"
      />
      <div v-if="sessions.length === 0" class="empty-terminal">
        <span class="wf-label" style="color:var(--pencil)">Select a connection to begin</span>
      </div>
    </div>

    <!-- Quick command bar -->
    <QuickCommandBar />

    <!-- Status bar -->
    <div class="status-bar">
      <span class="wf-label" style="font-size:11px">
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
  background: rgba(250,248,244,0.08);
  border-bottom: 1px solid rgba(250,248,244,0.1);
  overflow-x: auto;
  flex-shrink: 0;
}
.tab-bar-empty {
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: var(--pencil);
  font-size: 12px;
}
.terminal-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.empty-terminal {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-bar {
  height: var(--status-h);
  background: rgba(250,248,244,0.05);
  border-top: 1px solid rgba(250,248,244,0.1);
  display: flex;
  align-items: center;
  padding: 0 12px;
}
</style>
```

**Step 5: Commit**

```bash
git add frontend/src/components/terminal/ frontend/src/stores/sessions.ts
git commit -m "feat: terminal tab area with xterm.js and session management"
```

---

### Task 9: Vue 3 — Quick command pills bar

**Files:**
- Create: `frontend/src/components/commands/QuickCommandBar.vue`
- Create: `frontend/src/stores/quickCommands.ts`

**Step 1: Write quick commands store**

```ts
// frontend/src/stores/quickCommands.ts
import { ref } from 'vue'
import { ListQuickCommands } from '../../wailsjs/go/main/App'

export interface QuickCommand {
  id: number
  label: string
  command: string
  connectionId?: number
  sortOrder: number
}

export const quickCommands = ref<QuickCommand[]>([])

export async function fetchQuickCommands() {
  const result = await ListQuickCommands()
  quickCommands.value = result ?? []
}
```

**Step 2: Write QuickCommandBar**

```vue
<!-- frontend/src/components/commands/QuickCommandBar.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { quickCommands, fetchQuickCommands } from '../../stores/quickCommands'

onMounted(fetchQuickCommands)

function runCommand(cmd: string) {
  // TODO: write to active session stdin
  console.log('Run:', cmd)
}
</script>

<template>
  <div class="cmd-bar">
    <button
      v-for="cmd in quickCommands"
      :key="cmd.id"
      class="pill"
      @click="runCommand(cmd.command)"
    >
      ⚡ {{ cmd.label }}
    </button>
    <div v-if="quickCommands.length === 0" class="no-cmds wf-label">
      No quick commands — add them in settings
    </div>
  </div>
</template>

<style scoped>
.cmd-bar {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
  height: var(--pill-h);
  background: rgba(250,248,244,0.05);
  border-top: 1px solid rgba(250,248,244,0.08);
  overflow-x: auto;
  align-items: center;
  flex-shrink: 0;
}
.pill {
  padding: 3px 12px;
  border: 1px solid rgba(250,248,244,0.2);
  border-radius: 100px;
  background: transparent;
  color: var(--paper);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;
}
.pill:hover {
  background: rgba(250,248,244,0.1);
  border-color: var(--accent);
}
.no-cmds {
  color: var(--pencil);
  font-size: 12px;
}
</style>
```

**Step 3: Commit**

```bash
git add frontend/src/components/commands/ frontend/src/stores/quickCommands.ts
git commit -m "feat: quick command pills bar"
```

---

### Task 10: Wire connect action end-to-end

**Files:**
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/components/sidebar/ConnectionSidebar.vue`

**Step 1: Propagate connect event from sidebar to App**

Update `App.vue`:

```vue
<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue'
import ConnectionSidebar from './components/sidebar/ConnectionSidebar.vue'
import TerminalArea from './components/terminal/TerminalArea.vue'
import { openSession } from './stores/sessions'
import type { Connection } from './stores/connections'

async function handleConnect(conn: Connection) {
  try {
    await openSession(conn)
  } catch (e) {
    console.error('SSH connect failed:', e)
    alert(`Connection failed: ${e}`)
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
      <div v-else class="wf-label" style="padding:16px">{{ panel }}</div>
    </template>
    <template #main>
      <TerminalArea />
    </template>
  </AppShell>
</template>
```

**Step 2: Update ConnectionSidebar to forward connect events**

The sidebar already emits `connect` — verify App.vue receives it.

**Step 3: Test the full flow manually**

1. `wails dev` — opens app in dev mode
2. Add a test connection (localhost SSH server if available)
3. Double-click connection → new tab appears → terminal shows connecting message

**Step 4: Commit**

```bash
git add frontend/src/App.vue frontend/src/components/sidebar/ConnectionSidebar.vue
git commit -m "feat: wire connect action from sidebar through to SSH session"
```

---

### Task 11: Add seed data for demo

**Files:**
- Modify: `app.go` (add seed method)

**Step 1: Add seed method to app.go**

```go
func (a *App) SeedDemoData() error {
    conns := []store.Connection{
        {Name: "prod-web-01", Host: "10.0.1.10", Port: 22, User: "deploy", Env: "prod", GroupName: "Production"},
        {Name: "prod-web-02", Host: "10.0.1.11", Port: 22, User: "deploy", Env: "prod", GroupName: "Production"},
        {Name: "stg-web-01",  Host: "10.0.2.10", Port: 22, User: "deploy", Env: "stg",  GroupName: "Staging"},
        {Name: "dev-local",   Host: "127.0.0.1", Port: 22, User: "jason",  Env: "dev",  GroupName: "Local"},
    }
    for _, c := range conns {
        if _, err := a.db.SaveConnection(c); err != nil {
            return err
        }
    }
    cmds := []store.QuickCommand{
        {Label: "tail logs", Command: "tail -f /var/log/app.log"},
        {Label: "disk usage", Command: "df -h"},
        {Label: "htop",       Command: "htop"},
        {Label: "git status", Command: "git status"},
    }
    for _, q := range cmds {
        if _, err := a.db.Exec(`INSERT INTO quick_commands (label,command,sort_order) VALUES (?,?,?)`,
            q.Label, q.Command, q.SortOrder); err != nil {
            return err
        }
    }
    return nil
}
```

Note: use `a.db.db` is private, so add a helper to store:

```go
// Add to store.go
func (s *Store) SaveQuickCommand(q QuickCommand) error {
    _, err := s.db.Exec(
        `INSERT INTO quick_commands (label,command,sort_order) VALUES (?,?,?)`,
        q.Label, q.Command, q.SortOrder,
    )
    return err
}
```

Update seed to use `a.db.SaveQuickCommand(q)`.

**Step 2: Call seed on first startup**

In `app.go` startup, add:

```go
// Seed if empty
conns, _ := a.db.ListConnections()
if len(conns) == 0 {
    a.SeedDemoData()
}
```

**Step 3: Run app and verify sidebar populates**

```bash
wails dev
```

Expected: sidebar shows 4 connections grouped by Production/Staging/Local with correct env dot colors

**Step 4: Commit**

```bash
git add app.go internal/store/store.go
git commit -m "feat: seed demo connections and quick commands on first launch"
```

---

### Task 12: Final polish — window chrome and fonts

**Files:**
- Modify: `wails.json`
- Create: `frontend/src/styles/window.css`

**Step 1: Configure wails.json for macOS native feel**

```json
{
  "name": "TermFlow",
  "outputfilename": "TermFlow",
  "frontend:install": "npm install",
  "frontend:build": "npm run build",
  "frontend:dev:watcher": "npm run dev",
  "frontend:dev:serverUrl": "auto",
  "author": {"name": "TermFlow"},
  "info": {
    "productName": "TermFlow",
    "productVersion": "0.1.0",
    "copyright": "© 2026 TermFlow"
  },
  "macos": {
    "titlebar": "hiddenInset"
  }
}
```

**Step 2: Add window drag region**

```css
/* frontend/src/styles/window.css */
.window-drag {
  -webkit-app-region: drag;
}
.window-no-drag {
  -webkit-app-region: no-drag;
}
```

Import in `main.ts`:

```ts
import './styles/window.css'
```

Add `.window-drag` to ActivityRail top area in `ActivityRail.vue`.

**Step 3: Final build**

```bash
wails build
```

Expected: distributable binary in `build/bin/`

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: window chrome polish and final build"
```

---

## Execution Checklist

- [ ] Task 1: Wails scaffold + deps
- [ ] Task 2: SQLite store
- [ ] Task 3: SSH manager
- [ ] Task 4: Wails bindings
- [ ] Task 5: CSS tokens
- [ ] Task 6: IDE shell layout
- [ ] Task 7: Connection sidebar
- [ ] Task 8: Terminal + xterm.js
- [ ] Task 9: Quick command pills
- [ ] Task 10: Connect wiring
- [ ] Task 11: Seed data
- [ ] Task 12: Polish + final build
