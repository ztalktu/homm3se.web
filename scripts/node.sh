#!/bin/sh
# Runs Node.js tooling inside Docker so nothing has to be installed on the host.
# Usage: scripts/node.sh npm install
#        scripts/node.sh npm run dev       (dev server on http://localhost:5173)
#        scripts/node.sh npm run preview   (built site on http://localhost:4173)
set -eu

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
image="${NODE_IMAGE:-node:22-alpine}"

tty_flags=""
if [ -t 0 ] && [ -t 1 ]; then
  tty_flags="-it"
fi

# Publish ports only for the servers, so other commands can run while a server is up.
port_flags=""
case " $* " in
  *" dev "*) port_flags="-p 127.0.0.1:5173:5173" ;;
  *" preview "*) port_flags="-p 127.0.0.1:4173:4173" ;;
esac

exec docker run --rm $tty_flags $port_flags \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  -e NPM_CONFIG_CACHE=/app/.npm-cache \
  -e VITE_WATCH_POLLING=1 \
  -v "$project_dir":/app \
  -w /app \
  "$image" "$@"
