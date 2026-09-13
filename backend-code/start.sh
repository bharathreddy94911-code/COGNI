#!/bin/sh
set -e

echo "=== Starting Loan Document Processing AI Backend ==="
echo "Environment: ${APP_ENV:-production}"
echo "Host: ${HOST:-0.0.0.0}"
echo "Port: ${PORT:-8000}"

# Ensure working directories exist
mkdir -p /app/data /app/uploads /app/scratch

# Execute production Uvicorn web server
exec uvicorn main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}" --workers 2
