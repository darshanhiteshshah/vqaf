@echo off
echo 🚀 Starting VQAF (single command)...

start "Frontend" cmd /k "cd /d frontend && npm run dev"
start "Backend" cmd /k "cd /d backend && npm run dev"

start "Python STT" cmd /k "cd /d python-stt && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

start "Python QA" cmd /k "cd /d python-qa && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo ✅ All services launched
