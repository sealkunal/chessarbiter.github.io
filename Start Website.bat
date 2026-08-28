@echo off
echo Starting FIDE Arbiter's Manual local server...
echo Open your browser at: http://localhost:8080
echo Press Ctrl+C to stop the server.
echo.
python "%~dp0start-server.py"
pause
