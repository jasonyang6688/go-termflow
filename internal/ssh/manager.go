package ssh

import (
	"fmt"
	"io"
	"sync"
	"sync/atomic"
)

var idCounter uint64

type Manager struct {
	mu       sync.RWMutex
	sessions map[string]ManagedSession
}

type ManagedSession interface {
	Start(cols int, rows int, onData func([]byte), onExit func(error)) error
	Write(data string) error
	Resize(cols int, rows int) error
	Run(command string) ([]byte, error)
	RunWithInput(command string, input io.Reader) ([]byte, error)
	RunToWriter(command string, output io.Writer, onWrite func(int)) ([]byte, error)
	Close() error
}

func NewManager() *Manager {
	return &Manager{sessions: make(map[string]ManagedSession)}
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

func (m *Manager) Get(id string) (ManagedSession, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.sessions[id]
	return s, ok
}

func (m *Manager) Add(id string, s ManagedSession) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[id] = s
}

func (m *Manager) Remove(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, id)
}
