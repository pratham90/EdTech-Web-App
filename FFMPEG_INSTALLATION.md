# FFmpeg Installation Guide for Windows

## Why FFmpeg is Needed

Whisper (the audio transcription library) requires FFmpeg to process audio files. The error `[WinError 2] The system cannot find the file specified` means FFmpeg is not installed or not in your system PATH.

## Installation Methods

### Method 1: Using Chocolatey (Recommended - Easiest)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`

2. **Install FFmpeg**:
   ```powershell
   choco install ffmpeg
   ```

3. **Restart your terminal/Python service**

### Method 2: Manual Installation

1. **Download FFmpeg**:
   - Go to https://www.gyan.dev/ffmpeg/builds/
   - Download "ffmpeg-release-essentials.zip" (or latest version)

2. **Extract FFmpeg**:
   - Extract to a folder like `C:\ffmpeg`

3. **Add to PATH**:
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin` (or wherever you extracted ffmpeg)
   - Click "OK" on all dialogs

4. **Verify Installation**:
   - Open a new Command Prompt or PowerShell
   - Run: `ffmpeg -version`
   - You should see FFmpeg version information

5. **Restart Python Service**:
   - Close and restart your Python service/terminal
   - The service needs to be restarted to pick up the new PATH

### Method 3: Using Winget (Windows 10/11)

```powershell
winget install ffmpeg
```

## Verify Installation

After installing, verify FFmpeg is accessible:

```powershell
ffmpeg -version
```

You should see version information. If you get "command not found", FFmpeg is not in your PATH.

## After Installation

1. **Restart your Python service** - This is important! The service needs to restart to see the new PATH.
2. **Test audio transcription** - Try recording audio again in the application.

## Troubleshooting

### "FFmpeg is still not found after installation"

1. Make sure you restarted your terminal/Python service
2. Verify FFmpeg is in PATH: `echo $env:Path` (PowerShell) or `echo %PATH%` (CMD)
3. Try running `ffmpeg -version` in a NEW terminal window
4. If it works in terminal but not in Python, restart the Python service

### "I can't add to PATH"

- Make sure you're editing "System variables" not "User variables"
- You may need administrator privileges
- Try restarting your computer after adding to PATH

## Alternative: Use Text Input Instead

If you can't install FFmpeg right now, you can still use the question generator by:
- Typing your content directly in the text input field
- Uploading a PDF or TXT file instead of audio


