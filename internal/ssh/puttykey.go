package ssh

import (
	"crypto/rsa"
	"encoding/base64"
	"fmt"
	"math/big"
	"strings"

	gossh "golang.org/x/crypto/ssh"
)

func parsePrivateKey(key []byte, passphrase string) (gossh.Signer, error) {
	signer, err := gossh.ParsePrivateKey(key)
	if err == nil {
		return signer, nil
	}

	if passphrase != "" {
		if signer, passErr := gossh.ParsePrivateKeyWithPassphrase(key, []byte(passphrase)); passErr == nil {
			return signer, nil
		}
	}

	if strings.HasPrefix(string(key), "PuTTY-User-Key-File-") {
		return parsePuTTYPrivateKey(key)
	}

	return nil, err
}

func parsePuTTYPrivateKey(key []byte) (gossh.Signer, error) {
	fields, err := parsePuTTYFields(string(key))
	if err != nil {
		return nil, err
	}

	algorithm := fields["PuTTY-User-Key-File-2"]
	if algorithm == "" {
		algorithm = fields["PuTTY-User-Key-File-3"]
	}
	if algorithm != "ssh-rsa" {
		return nil, fmt.Errorf("unsupported PuTTY key algorithm %q; convert the key to OpenSSH format", algorithm)
	}
	if encryption := strings.ToLower(fields["Encryption"]); encryption != "" && encryption != "none" {
		return nil, fmt.Errorf("encrypted PuTTY keys are not supported yet; convert the key to OpenSSH format")
	}

	publicBlob, err := base64.StdEncoding.DecodeString(fields["Public"])
	if err != nil {
		return nil, fmt.Errorf("decode PuTTY public key: %w", err)
	}
	privateBlob, err := base64.StdEncoding.DecodeString(fields["Private"])
	if err != nil {
		return nil, fmt.Errorf("decode PuTTY private key: %w", err)
	}

	pub, err := gossh.ParsePublicKey(publicBlob)
	if err != nil {
		return nil, fmt.Errorf("parse PuTTY public key: %w", err)
	}
	cryptoPub, ok := pub.(gossh.CryptoPublicKey)
	if !ok {
		return nil, fmt.Errorf("PuTTY public key does not expose crypto key")
	}
	rsaPub, ok := cryptoPub.CryptoPublicKey().(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("PuTTY public key is not RSA")
	}

	private, err := parsePuTTYRSAPrivateBlob(privateBlob)
	if err != nil {
		return nil, err
	}
	private.PublicKey = *rsaPub
	if err := private.Validate(); err != nil {
		return nil, fmt.Errorf("validate PuTTY RSA key: %w", err)
	}
	private.Precompute()

	signer, err := gossh.NewSignerFromKey(private)
	if err != nil {
		return nil, fmt.Errorf("create signer from PuTTY key: %w", err)
	}
	return signer, nil
}

func parsePuTTYFields(text string) (map[string]string, error) {
	lines := strings.Split(strings.ReplaceAll(text, "\r\n", "\n"), "\n")
	fields := make(map[string]string)
	for i := 0; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			continue
		}
		key, value, ok := strings.Cut(line, ":")
		if !ok {
			return nil, fmt.Errorf("invalid PuTTY key line %q", line)
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if key == "Public-Lines" || key == "Private-Lines" {
			count := 0
			if _, err := fmt.Sscanf(value, "%d", &count); err != nil {
				return nil, fmt.Errorf("invalid %s value %q", key, value)
			}
			if i+count >= len(lines) {
				return nil, fmt.Errorf("%s exceeds PuTTY key length", key)
			}
			var data strings.Builder
			for j := 0; j < count; j++ {
				i++
				data.WriteString(strings.TrimSpace(lines[i]))
			}
			if key == "Public-Lines" {
				fields["Public"] = data.String()
			} else {
				fields["Private"] = data.String()
			}
			continue
		}
		fields[key] = value
	}
	if fields["Public"] == "" || fields["Private"] == "" {
		return nil, fmt.Errorf("PuTTY key is missing public or private data")
	}
	return fields, nil
}

func parsePuTTYRSAPrivateBlob(blob []byte) (*rsa.PrivateKey, error) {
	rest := blob
	d, rest, ok := readSSHMpint(rest)
	if !ok {
		return nil, fmt.Errorf("invalid PuTTY RSA private exponent")
	}
	p, rest, ok := readSSHMpint(rest)
	if !ok {
		return nil, fmt.Errorf("invalid PuTTY RSA prime p")
	}
	q, _, ok := readSSHMpint(rest)
	if !ok {
		return nil, fmt.Errorf("invalid PuTTY RSA prime q")
	}
	return &rsa.PrivateKey{
		D:      d,
		Primes: []*big.Int{p, q},
	}, nil
}

func readSSHMpint(data []byte) (*big.Int, []byte, bool) {
	if len(data) < 4 {
		return nil, nil, false
	}
	size := int(data[0])<<24 | int(data[1])<<16 | int(data[2])<<8 | int(data[3])
	data = data[4:]
	if size < 0 || size > len(data) {
		return nil, nil, false
	}
	value := new(big.Int).SetBytes(data[:size])
	return value, data[size:], true
}
