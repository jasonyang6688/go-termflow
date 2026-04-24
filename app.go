package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"TermFlow/internal/ssh"
	"TermFlow/internal/store"
)

type App struct {
	ctx    context.Context
	db     *store.Store
	sshMgr *ssh.Manager
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

	conns, _ := a.db.ListConnections()
	if len(conns) == 0 {
		a.seedDemoData()
	}
}

func (a *App) shutdown(_ context.Context) {
	a.db.Close()
}

func (a *App) seedDemoData() {
	demoConns := []store.Connection{
		{Name: "prod-web-01", Host: "10.0.1.10", Port: 22, User: "deploy", Env: "prod", GroupName: "Production"},
		{Name: "prod-web-02", Host: "10.0.1.11", Port: 22, User: "deploy", Env: "prod", GroupName: "Production"},
		{Name: "stg-web-01", Host: "10.0.2.10", Port: 22, User: "deploy", Env: "stg", GroupName: "Staging"},
		{Name: "dev-local", Host: "127.0.0.1", Port: 22, User: os.Getenv("USER"), Env: "dev", GroupName: "Local"},
	}
	for _, c := range demoConns {
		a.db.SaveConnection(c)
	}
	demoCmds := []store.QuickCommand{
		{Label: "tail logs", Command: "tail -f /var/log/app.log", SortOrder: 0},
		{Label: "disk usage", Command: "df -h", SortOrder: 1},
		{Label: "htop", Command: "htop", SortOrder: 2},
		{Label: "git status", Command: "git status", SortOrder: 3},
	}
	for _, q := range demoCmds {
		a.db.SaveQuickCommand(q)
	}
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
		return ConnectResult{}, fmt.Errorf("ssh connect to %s: %w", c.Host, err)
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
