//go:build !windows

package termexec

import "os/exec"

func hideConsoleWindow(cmd *exec.Cmd) {}
