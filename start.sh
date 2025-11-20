#!/bin/sh
echo "Starting Vite preview server..."
echo "PORT=${PORT:-4173}"
echo "HOST=${HOST:-0.0.0.0}"
echo "Current directory: $(pwd)"
echo "Dist folder exists: $([ -d dist ] && echo 'yes' || echo 'no')"
exec vite preview --host --port ${PORT:-4173}

