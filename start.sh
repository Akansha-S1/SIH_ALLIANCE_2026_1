#!/usr/bin/env bash
# JALRAKSHAK AI - start backend + frontend on the LAN so phones on the same
# Wi-Fi can reach the Citizen dashboard. Run from the repo root: ./start.sh
set -e
cd "$(dirname "$0")"

LAN_IP=$(node -e "
const os = require('os');
const nets = os.networkInterfaces();
let ip = 'localhost';
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal) { ip = net.address; break; }
  }
}
console.log(ip);
")

BACKEND_PORT=8000
FRONTEND_PORT=5173

echo "Starting backend..."
cd backend
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  ./.venv/bin/pip install -q -r requirements.txt
fi
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT > /tmp/jalrakshak-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Starting frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
VITE_API_BASE="http://$LAN_IP:$BACKEND_PORT" VITE_WS_URL="ws://$LAN_IP:$BACKEND_PORT/ws/live" \
  npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > /tmp/jalrakshak-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
sleep 3

cat <<EOF

============================================================
 JALRAKSHAK AI is running
============================================================
 AUTHORITY (laptop):
   http://$LAN_IP:$FRONTEND_PORT

 CITIZEN PHONE (same Wi-Fi):
   http://$LAN_IP:$FRONTEND_PORT/citizen

 BACKEND API:
   http://$LAN_IP:$BACKEND_PORT
============================================================
 Press Ctrl+C to stop both servers.
EOF

wait
