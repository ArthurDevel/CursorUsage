#!/bin/sh
PORT=${PORT:-4173}
echo "Starting Vite preview server on port $PORT"
echo "Current directory: $(pwd)"
echo "Dist folder exists: $([ -d dist ] && echo 'yes' || echo 'no')"
ls -la dist/ 2>/dev/null | head -5 || echo "Dist folder listing failed"
exec vite preview --host 0.0.0.0 --port $PORT

