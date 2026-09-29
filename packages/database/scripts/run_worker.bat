@echo off
rem ==============================================================================
rem SIPAKA Legal Harvester — Windows Worker Launcher
rem ==============================================================================

set SCRIPT_DIR=%~dp0
set DB_DIR=%SCRIPT_DIR%..

if not exist "%DB_DIR%\logs" mkdir "%DB_DIR%\logs"

if "%1"=="" goto usage
if "%1"=="status" goto do_status
if "%1"=="batch" goto do_batch
if "%1"=="continuous" goto do_continuous
if "%1"=="reset" goto do_reset

:usage
echo ==============================================================================
echo SIPAKA Automated Legal Harvester Launcher (Windows)
echo ==============================================================================
echo Penggunaan:
echo   run_worker.bat status            - Tampilkan telemetri live worker
echo   run_worker.bat batch [N]         - Jalankan N dokumen (default: 5)
echo   run_worker.bat continuous        - Jalankan terus-menerus di latar depan
echo   run_worker.bat reset             - Reset checkpoint pemrosesan
echo ==============================================================================
exit /b 0

:do_status
python "%SCRIPT_DIR%crawler_worker.py" --status
exit /b 0

:do_batch
set LIMIT=%2
if "%LIMIT%"=="" set LIMIT=5
echo [SIPAKA] Menjalankan batch %LIMIT% dokumen dengan ethical rate limiter...
python "%SCRIPT_DIR%crawler_worker.py" --batch %LIMIT% --delay 1.5
exit /b 0

:do_continuous
echo [SIPAKA] Menjalankan worker dalam continuous loop (Ctrl+C untuk graceful stop)...
python "%SCRIPT_DIR%crawler_worker.py" --continuous --batch 10 --delay 1.5
exit /b 0

:do_reset
echo [SIPAKA] Mereset checkpoint worker...
python "%SCRIPT_DIR%crawler_worker.py" --reset-checkpoint
exit /b 0
