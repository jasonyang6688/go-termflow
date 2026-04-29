package ssh

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"fmt"
	"math/big"
	"strings"
	"testing"

	gossh "golang.org/x/crypto/ssh"
)

func TestParsePuTTYPrivateKeyRSA(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		t.Fatal(err)
	}
	signer, err := gossh.NewSignerFromKey(key)
	if err != nil {
		t.Fatal(err)
	}

	ppk := buildTestRSAPPK(t, key, signer.PublicKey().Marshal())
	parsed, err := parsePrivateKey([]byte(ppk), "")
	if err != nil {
		t.Fatal(err)
	}
	if parsed.PublicKey().Type() != "ssh-rsa" {
		t.Fatalf("expected ssh-rsa signer, got %s", parsed.PublicKey().Type())
	}
}

func buildTestRSAPPK(t *testing.T, key *rsa.PrivateKey, publicBlob []byte) string {
	t.Helper()
	privateBlob := appendSSHMPInts(key.D, key.Primes[0], key.Primes[1], key.Precomputed.Qinv)
	public := splitBase64(publicBlob, 64)
	private := splitBase64(privateBlob, 64)
	return fmt.Sprintf("PuTTY-User-Key-File-2: ssh-rsa\nEncryption: none\nComment: test\nPublic-Lines: %d\n%s\nPrivate-Lines: %d\n%s\nPrivate-MAC: 0000000000000000000000000000000000000000\n",
		len(public), strings.Join(public, "\n"), len(private), strings.Join(private, "\n"))
}

func appendSSHMPInts(values ...*big.Int) []byte {
	var out []byte
	for _, value := range values {
		bytes := value.Bytes()
		if len(bytes) > 0 && bytes[0]&0x80 != 0 {
			bytes = append([]byte{0}, bytes...)
		}
		size := len(bytes)
		out = append(out, byte(size>>24), byte(size>>16), byte(size>>8), byte(size))
		out = append(out, bytes...)
	}
	return out
}

func splitBase64(data []byte, width int) []string {
	encoded := base64.StdEncoding.EncodeToString(data)
	var lines []string
	for len(encoded) > width {
		lines = append(lines, encoded[:width])
		encoded = encoded[width:]
	}
	if encoded != "" {
		lines = append(lines, encoded)
	}
	return lines
}
