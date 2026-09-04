@echo off
REM JALRAKSHAK AI - start backend + frontend on the LAN so phones on the same
REM Wi-Fi can reach the Citizen dashboard. Run from the repo root: start.bat
setlocal enabledelayedexpansion
cd /d "%~dp0"

for /f "delims=" %%i in ('node -e "const os=require('os');const nets=os.networkInterfaces();let ip='localhost';for(const name of Object.keys(nets)){for(const net of nets[name]||[]){if(net.family==='IPv4'&&!net.internal){ip=net.address;break;}}}console.log(ip);"') do set LAN_IP=%%i

set BACKEND_PORT=8000
set FRONTEND_PORT=5173

echo Starting backend...
cd backend
if not exist ".venv" (
  python -m venv .venv
  call .venv\Scripts\pip install -q -r requirements.txt
)
start "JALRAKSHAK Backend" cmd /k ".venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT%"
cd ..

echo Starting frontend...
cd frontend
if not exist "node_modules" (
  call npm install
)
set VITE_API_BASE=http://%LAN_IP%:%BACKEND_PORT%
set VITE_WS_URL=ws://%LAN_IP%:%BACKEND_PORT%/ws/live
start "JALRAKSHAK Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo  JALRAKSHAK AI is running
echo ============================================================
echo  AUTHORITY (laptop):
echo    http://%LAN_IP%:%FRONTEND_PORT%
echo.
echo  CITIZEN PHONE (same Wi-Fi):
echo    http://%LAN_IP%:%FRONTEND_PORT%/citizen
echo.
echo  BACKEND API:
echo    http://%LAN_IP%:%BACKEND_PORT%
echo ============================================================
echo  Close the two opened windows to stop the servers.
echo.
pause
