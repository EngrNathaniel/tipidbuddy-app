@echo off
echo ===================================================
echo   TipidBuddy GitHub Push Helper
echo ===================================================

echo.
echo [1/4] Checking for Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git for Windows to proceed.
    echo Opening download page...
    start https://git-scm.com/download/win
    echo.
    echo After installing, please run this script again.
    pause
    exit /b
)

echo [OK] Git is installed.

echo.
echo [2/4] Initializing Git Repository...
if not exist .git (
    git init
    echo [OK] Repository initialized.
) else (
    echo [OK] Repository already exists.
)

echo.
echo [3/4] Staging and Committing files...
git add .
git commit -m "Update TipidBuddy with PWA and Fixes"
echo [OK] Files committed.

echo.
echo [4/4] Pushing to GitHub...
echo.
echo Please go to https://github.com/new and create a new repository.
echo Do NOT check "Initialize with README", "Add .gitignore", or "Add a license".
echo copy the HTTPS URL (e.g., https://github.com/yourname/repo.git).
echo.
set /p remote_url="Paste your GitHub Repository URL here: "

if "%remote_url%"=="" (
    echo [ERROR] URL cannot be empty.
    pause
    exit /b
)

git remote remove origin >nul 2>&1
git remote add origin %remote_url%
git branch -M main
git push -u origin main

echo.
echo ===================================================
echo   SUCCESS! Your code is now on GitHub.
echo ===================================================
pause
