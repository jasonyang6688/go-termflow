package termexec

import (
	"context"
	"os/exec"
)

func CommandContext(ctx context.Context, name string, arg ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, name, arg...)
	hideConsoleWindow(cmd)
	return cmd
}
