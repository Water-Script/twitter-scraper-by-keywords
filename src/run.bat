@echo off
echo Running...
if not exist .\node_modules\ (
    call npm install
)
call npm run ts
pause