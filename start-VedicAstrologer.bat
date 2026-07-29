@echo off
setlocal EnableDelayedExpansion
title Vedic Astrologer

rem  Starts the app locally and opens it in the browser.
rem
rem  Port 3737, not 3000. A service worker takes over an entire origin
rem  (scheme + host + port), so any other PWA you have ever opened on
rem  http://localhost:3000 keeps answering navigations there and shows its own
rem  cached page instead of this app - no matter which server is actually
rem  listening. A dedicated port keeps this app out of that fight.
rem
rem  If you already hit that: open http://localhost:3000, press F12, then
rem  Application -> Service Workers -> Unregister, and hard-reload.

cd /d "%~dp0"

set PORT=3737
set URL=http://localhost:%PORT%

echo.
echo   Vedic Astrologer
echo   ----------------
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo   Node.js was not found.
  echo.
  echo   Install it from https://nodejs.org/ ^(LTS^), then run this file again.
  echo   Or use the hosted version, where nothing needs installing:
  echo     https://diprajkadlag.github.io/VedicAstrologer/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   Installing dependencies, this happens only once...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   npm install failed. Check the messages above.
    pause
    exit /b 1
  )
)

echo   Starting on %URL%
echo   Close this window to stop the server.
echo.

rem  Open the browser only once the server answers. The previous version
rem  launched it first, so it raced the dev server and often landed on a
rem  connection error - or on a cached page from whatever ran there before.
start "" /b cmd /c "for /l %%i in (1,1,60) do (curl -s -o nul %URL% && (start %URL% & exit) || timeout /t 1 /nobreak >nul)"

call npm run dev

endlocal
