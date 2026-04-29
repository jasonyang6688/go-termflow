package ssh

import (
	"fmt"
	"io"
	"os"
	"strings"
	"sync"

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
	ID       string
	client   *gossh.Client
	mu       sync.Mutex
	shell    *gossh.Session
	stdin    io.WriteCloser
	started  bool
	closed   bool
	closeErr error
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

func (s *Session) Start(cols int, rows int, onData func([]byte), onExit func(error)) error {
	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return fmt.Errorf("session %s is closed", s.ID)
	}
	if s.started {
		s.mu.Unlock()
		return nil
	}
	s.started = true
	s.mu.Unlock()

	if cols <= 0 {
		cols = 120
	}
	if rows <= 0 {
		rows = 32
	}

	shell, err := s.client.NewSession()
	if err != nil {
		return err
	}

	modes := gossh.TerminalModes{
		gossh.ECHO:          1,
		gossh.TTY_OP_ISPEED: 14400,
		gossh.TTY_OP_OSPEED: 14400,
	}
	if err := shell.RequestPty("xterm-256color", rows, cols, modes); err != nil {
		shell.Close()
		return err
	}

	stdin, err := shell.StdinPipe()
	if err != nil {
		shell.Close()
		return err
	}
	stdout, err := shell.StdoutPipe()
	if err != nil {
		shell.Close()
		return err
	}
	stderr, err := shell.StderrPipe()
	if err != nil {
		shell.Close()
		return err
	}

	s.mu.Lock()
	s.shell = shell
	s.stdin = stdin
	s.mu.Unlock()

	go copyOutput(stdout, onData)
	go copyOutput(stderr, onData)

	if err := shell.Shell(); err != nil {
		shell.Close()
		return err
	}

	go func() {
		err := shell.Wait()
		s.mu.Lock()
		s.closeErr = err
		s.closed = true
		s.mu.Unlock()
		if onExit != nil {
			onExit(err)
		}
	}()

	return nil
}

func (s *Session) Write(data string) error {
	s.mu.Lock()
	stdin := s.stdin
	closed := s.closed
	s.mu.Unlock()

	if closed {
		return fmt.Errorf("session %s is closed", s.ID)
	}
	if stdin == nil {
		return fmt.Errorf("session %s shell is not started", s.ID)
	}
	_, err := io.WriteString(stdin, data)
	return err
}

func (s *Session) Resize(cols int, rows int) error {
	s.mu.Lock()
	shell := s.shell
	s.mu.Unlock()

	if shell == nil {
		return nil
	}
	if cols <= 0 || rows <= 0 {
		return nil
	}
	return shell.WindowChange(rows, cols)
}

func (s *Session) Run(command string) ([]byte, error) {
	return s.RunWithInput(command, nil)
}

func (s *Session) RunWithInput(command string, input io.Reader) ([]byte, error) {
	s.mu.Lock()
	client := s.client
	closed := s.closed
	s.mu.Unlock()

	if closed {
		return nil, fmt.Errorf("session %s is closed", s.ID)
	}
	if client == nil {
		return nil, fmt.Errorf("session %s client is not connected", s.ID)
	}

	cmdSession, err := client.NewSession()
	if err != nil {
		return nil, err
	}
	defer cmdSession.Close()
	if input != nil {
		cmdSession.Stdin = input
	}
	return cmdSession.CombinedOutput(command)
}

func (s *Session) RunToWriter(command string, output io.Writer, onWrite func(int)) ([]byte, error) {
	s.mu.Lock()
	client := s.client
	closed := s.closed
	s.mu.Unlock()

	if closed {
		return nil, fmt.Errorf("session %s is closed", s.ID)
	}
	if client == nil {
		return nil, fmt.Errorf("session %s client is not connected", s.ID)
	}

	cmdSession, err := client.NewSession()
	if err != nil {
		return nil, err
	}
	defer cmdSession.Close()

	stdout, err := cmdSession.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := cmdSession.StderrPipe()
	if err != nil {
		return nil, err
	}
	if err := cmdSession.Start(command); err != nil {
		return nil, err
	}

	var stderrText strings.Builder
	errCh := make(chan error, 2)
	go func() {
		errCh <- copyWithProgress(output, stdout, onWrite)
	}()
	go func() {
		_, err := io.Copy(&stderrText, stderr)
		errCh <- err
	}()

	copyErr := <-errCh
	stderrErr := <-errCh
	waitErr := cmdSession.Wait()
	if copyErr != nil {
		return []byte(stderrText.String()), copyErr
	}
	if stderrErr != nil {
		return []byte(stderrText.String()), stderrErr
	}
	if waitErr != nil {
		return []byte(stderrText.String()), waitErr
	}
	return []byte(stderrText.String()), nil
}

func (s *Session) Close() error {
	s.mu.Lock()
	s.closed = true
	shell := s.shell
	client := s.client
	s.mu.Unlock()

	if shell != nil {
		_ = shell.Close()
	}
	return client.Close()
}

func copyWithProgress(dst io.Writer, src io.Reader, onWrite func(int)) error {
	buf := make([]byte, 32*1024)
	for {
		n, readErr := src.Read(buf)
		if n > 0 {
			written, writeErr := dst.Write(buf[:n])
			if written > 0 && onWrite != nil {
				onWrite(written)
			}
			if writeErr != nil {
				return writeErr
			}
			if written != n {
				return io.ErrShortWrite
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				return nil
			}
			return readErr
		}
	}
}

func copyOutput(reader io.Reader, onData func([]byte)) {
	buf := make([]byte, 4096)
	for {
		n, err := reader.Read(buf)
		if n > 0 && onData != nil {
			chunk := make([]byte, n)
			copy(chunk, buf[:n])
			onData(chunk)
		}
		if err != nil {
			return
		}
	}
}
