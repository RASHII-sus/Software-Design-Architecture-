@echo off
setlocal

where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  mvn %*
  exit /b %ERRORLEVEL%
)

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  docker run --rm -v "%cd%:/workspace" -w /workspace maven:3.9-eclipse-temurin-17 mvn %*
  exit /b %ERRORLEVEL%
)

echo Maven is not installed and Docker is not available.
echo Install Maven 3.9+ or start Docker Desktop, then rerun this command.
exit /b 1
