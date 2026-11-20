@echo off
rem Double-click to host Unmasked on this computer: it builds the site and opens it at http://localhost:5181.
rem Keep this window open while you use the site; close it to stop.
cd /d "%~dp0"
title Unmasked - http://localhost:5181
call npm run site:open
pause
