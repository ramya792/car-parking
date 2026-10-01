@echo off
echo ===================================================
echo  Running Smart Parking Automated Pytest Suite
echo ===================================================
python -m pytest backend/tests -v --tb=short
pause
