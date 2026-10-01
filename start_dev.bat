@echo off
echo ===================================================
echo  Starting Vision-Based Smart Parking System
echo ===================================================

echo [1/2] Launching FastAPI Backend (Port 8000)...
start "FastAPI Backend - Smart Parking" cmd /k "set DEMO_MODE=true&& python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching React Three.js Frontend (Port 5173)...
start "React Frontend - Smart Parking" cmd /k "cd frontend && npm run dev -- --host"

echo ===================================================
echo  System is running:
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://127.0.0.1:8000
echo  - API Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
