#!/bin/bash
set -e

PORT=${PORT:-8000}
BASE_URL=${BASE_URL:-"http://0.0.0.0:$PORT"}

export APOLLO_API_KEY=${APOLLO_API_KEY}

npx -y supergateway \
  --stdio "npx -y @thevgergroup/apollo-io-mcp@latest" \
  --port $PORT \
  --baseUrl $BASE_URL \
  --ssePath /sse \
  --messagePath /message
