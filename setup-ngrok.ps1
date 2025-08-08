# Ngrok Setup Script for Chat App (PowerShell)
# This script sets up ngrok tunnels for both frontend and backend

Write-Host "Setting up ngrok tunnels for Chat App..." -ForegroundColor Green

# Check if ngrok is installed
try {
    $ngrokVersion = ngrok version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "ngrok not found"
    }
    Write-Host "ngrok is installed" -ForegroundColor Green
} catch {
    Write-Host "ngrok is not installed. Please install it from https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

# Check if ngrok is authenticated
try {
    ngrok config check 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "ngrok not authenticated"
    }
    Write-Host "ngrok is authenticated" -ForegroundColor Green
} catch {
    Write-Host "ngrok is not authenticated. Please run: ngrok config add-authtoken YOUR_AUTH_TOKEN" -ForegroundColor Red
    exit 1
}

# Kill any existing ngrok processes
Write-Host "Stopping existing ngrok processes..." -ForegroundColor Yellow
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start ngrok tunnel for frontend (port 3000)
Write-Host "Starting ngrok tunnel for frontend (port 3000)..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "3000", "--log=stdout" -WindowStyle Hidden -RedirectStandardOutput "ngrok-frontend.log" -RedirectStandardError "ngrok-frontend.log"

# Wait a moment for the tunnel to start
Start-Sleep -Seconds 3

# Get the frontend tunnel URL
try {
    $tunnelsResponse = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing
    $tunnelsData = $tunnelsResponse.Content | ConvertFrom-Json
    $frontendUrl = $tunnelsData.tunnels[0].public_url
    
    if (-not $frontendUrl) {
        throw "Failed to get frontend tunnel URL"
    }
    
    Write-Host "Frontend tunnel: $frontendUrl" -ForegroundColor Green
} catch {
    Write-Host "Failed to get frontend tunnel URL" -ForegroundColor Red
    exit 1
}

# Start ngrok tunnel for backend (port 8000)
Write-Host "Starting ngrok tunnel for backend (port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "8000", "--log=stdout" -WindowStyle Hidden -RedirectStandardOutput "ngrok-backend.log" -RedirectStandardError "ngrok-backend.log"

# Wait a moment for the tunnel to start
Start-Sleep -Seconds 3

# Get the backend tunnel URL
try {
    $tunnelsResponse = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing
    $tunnelsData = $tunnelsResponse.Content | ConvertFrom-Json
    $backendUrl = $tunnelsData.tunnels[1].public_url
    
    if (-not $backendUrl) {
        throw "Failed to get backend tunnel URL"
    }
    
    Write-Host "Backend tunnel: $backendUrl" -ForegroundColor Green
} catch {
    Write-Host "Failed to get backend tunnel URL" -ForegroundColor Red
    exit 1
}

# Update docker-compose.yml with the new URLs
Write-Host "Updating docker-compose.yml with ngrok URLs..." -ForegroundColor Yellow

# Create a backup of the original file
Copy-Item "docker-compose.yml" "docker-compose.yml.backup"

# Read the docker-compose.yml content
$dockerComposeContent = Get-Content "docker-compose.yml" -Raw

# Update ALLOWED_ORIGINS
$dockerComposeContent = $dockerComposeContent -replace 'ALLOWED_ORIGINS=.*', "ALLOWED_ORIGINS=http://localhost:3000,$frontendUrl"

# Update REACT_APP_API_URL
$dockerComposeContent = $dockerComposeContent -replace 'REACT_APP_API_URL=.*', "REACT_APP_API_URL=$backendUrl"

# Update REACT_APP_WS_URL (convert http to ws)
$wsUrl = $backendUrl -replace '^http', 'ws'
$dockerComposeContent = $dockerComposeContent -replace 'REACT_APP_WS_URL=.*', "REACT_APP_WS_URL=$wsUrl"

# Write the updated content back
$dockerComposeContent | Set-Content "docker-compose.yml"

Write-Host "Updated docker-compose.yml" -ForegroundColor Green

# Restart the containers to apply the new configuration
Write-Host "Restarting containers..." -ForegroundColor Yellow
docker-compose down
docker-compose up -d

Write-Host ""
Write-Host "Ngrok setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Open $frontendUrl in your browser"
Write-Host "2. Register/login with the app"
Write-Host "3. Test the chat functionality"
Write-Host ""
Write-Host "Monitor tunnels at: http://localhost:4040" -ForegroundColor Cyan
Write-Host "Logs: ngrok-frontend.log and ngrok-backend.log" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop: pkill ngrok && docker-compose down" -ForegroundColor Red
Write-Host "To restart: .\setup-ngrok.ps1" -ForegroundColor Yellow
