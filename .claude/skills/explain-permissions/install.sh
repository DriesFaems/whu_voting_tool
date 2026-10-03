#!/bin/sh
# Installs the explain-permissions mod for every Claude Code session on this computer.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude/skills/explain-permissions"
mkdir -p "$DEST"
cp -R "$SRC/.claude-plugin" "$SRC/hooks" "$DEST/"
echo "Installed to $DEST. Start a new Claude Code session to use it."
