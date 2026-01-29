# FFmpeg Installation Script for Windows
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FFmpeg Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs to run as Administrator!" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Method 1: Try Chocolatey
Write-Host "Attempting to install FFmpeg via Chocolatey..." -ForegroundColor Yellow

try {
    # Check if Chocolatey is installed
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
    
    if ($chocoInstalled) {
        Write-Host "✅ Chocolatey is installed" -ForegroundColor Green
        Write-Host "Installing FFmpeg..." -ForegroundColor Yellow
        choco install ffmpeg -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ FFmpeg installed successfully via Chocolatey!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Please restart your Python service for the changes to take effect." -ForegroundColor Cyan
            exit 0
        }
    } else {
        Write-Host "⚠️  Chocolatey is not installed" -ForegroundColor Yellow
        Write-Host "Would you like to install Chocolatey first? (Y/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq 'Y' -or $response -eq 'y') {
            Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Chocolatey installed. Now installing FFmpeg..." -ForegroundColor Green
                choco install ffmpeg -y
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "✅ FFmpeg installed successfully!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Please restart your Python service for the changes to take effect." -ForegroundColor Cyan
                    exit 0
                }
            }
        }
    }
} catch {
    Write-Host "⚠️  Chocolatey installation failed: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Trying alternative method: Winget..." -ForegroundColor Yellow

# Method 2: Try Winget
try {
    $wingetInstalled = Get-Command winget -ErrorAction SilentlyContinue
    
    if ($wingetInstalled) {
        Write-Host "✅ Winget is available" -ForegroundColor Green
        Write-Host "Installing FFmpeg via Winget..." -ForegroundColor Yellow
        winget install --id=Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ FFmpeg installed successfully via Winget!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Please restart your Python service for the changes to take effect." -ForegroundColor Cyan
            exit 0
        }
    } else {
        Write-Host "⚠️  Winget is not available (requires Windows 10 1809+ or Windows 11)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Winget installation failed: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automatic installation methods failed." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please install FFmpeg manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Download FFmpeg from:" -ForegroundColor White
Write-Host "   https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Download 'ffmpeg-release-essentials.zip'" -ForegroundColor White
Write-Host ""
Write-Host "3. Extract to C:\ffmpeg" -ForegroundColor White
Write-Host ""
Write-Host "4. Add to PATH:" -ForegroundColor White
Write-Host "   - Press Win+X, select 'System'" -ForegroundColor White
Write-Host "   - Click 'Advanced system settings'" -ForegroundColor White
Write-Host "   - Click 'Environment Variables'" -ForegroundColor White
Write-Host "   - Under 'System variables', find 'Path' and click 'Edit'" -ForegroundColor White
Write-Host "   - Click 'New' and add: C:\ffmpeg\bin" -ForegroundColor White
Write-Host "   - Click OK on all dialogs" -ForegroundColor White
Write-Host ""
Write-Host "5. Restart your Python service" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


