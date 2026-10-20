#!/bin/zsh
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
fi
if [ ! -d node_modules ]; then
  if command -v npm >/dev/null; then npm install; else pnpm install; fi
fi
./node_modules/.bin/vite --host 127.0.0.1 --port 5174
