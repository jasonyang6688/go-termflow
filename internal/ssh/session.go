package ssh

import (
	"fmt"
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
