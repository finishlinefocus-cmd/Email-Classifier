#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL_NAME="${OLLAMA_MODEL:-email-classifier}"
BASE_MODEL="${OLLAMA_BASE_MODEL:-llama3.2:3b}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama CLI not found. Install from https://ollama.com"
  exit 1
fi

echo "Pulling base model: ${BASE_MODEL}"
ollama pull "${BASE_MODEL}"

TMPFILE="$(mktemp)"
trap 'rm -f "${TMPFILE}"' EXIT
sed "s|^FROM .*|FROM ${BASE_MODEL}|" "${ROOT}/ollama/Modelfile" > "${TMPFILE}"

echo "Creating Ollama model: ${MODEL_NAME} (base: ${BASE_MODEL})"
ollama create "${MODEL_NAME}" -f "${TMPFILE}"

echo ""
echo "Done. Model uses ~2GB RAM on CPU — good for Windows server."
echo "  ollama list | grep ${MODEL_NAME}"
echo "  npm run ollama:test"
echo ""
echo "Even lighter base (optional): OLLAMA_BASE_MODEL=llama3.2:1b npm run ollama:create"
