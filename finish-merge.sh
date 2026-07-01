#!/bin/sh
# Run this in the Replit shell to complete the merge after conflicts were resolved
set -e

echo "Staging all resolved files..."
git add artifacts/app/
git add artifacts/appflexor/
git add pnpm-workspace.yaml
git add pnpm-lock.yaml
git add package.json

echo "Completing merge..."
git -c core.editor=true merge --continue -m "Merge branch 'main' of https://github.com/shahzadhassanpk/appflexor — resolve conflicts keeping workspace setup, React 19, cross-platform support, s2a service routing"

echo "Done! Merge complete."
