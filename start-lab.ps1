# Start-Lab.ps1

# 1. Get Local IP Address
$ipAddr = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi", "Ethernet" | Select-Object -ExpandProperty IPAddress | Select-Object -First 1)

if (-not $ipAddr) {
    Write-Host "Could not auto-detect IP. Using 127.0.0.1" -ForegroundColor Yellow
    $ipAddr = "127.0.0.1"
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "   WEB3 CLASSROOM LAB - INSTRUCTOR MODE" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Instructor IP: $ipAddr" -ForegroundColor Green
Write-Host "Students should connect to: http://$($ipAddr):8545" -ForegroundColor Yellow
Write-Host "==================================================`n"

# 2. Check for ngrok
$hasNgrok = Get-Command ngrok -ErrorAction SilentlyContinue

# 3. Start Hardhat Node (Background Job) in a new window
Write-Host "[1/3] Starting Blockchain Node..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run chain" 

# Wait for node to boot and verify it's listening
Write-Host "Waiting for node to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$nodeReady = $false

while ($attempt -lt $maxAttempts -and -not $nodeReady) {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $nodeReady = $true
            Write-Host "Node is ready!" -ForegroundColor Green
        }
    }
    catch {
        # Node not ready yet, continue waiting
        Write-Host "." -NoNewline
    }
}

Write-Host "" # New line after dots

if (-not $nodeReady) {
    Write-Host "WARNING: Node may not be ready. Check the Hardhat window for errors." -ForegroundColor Red
    Write-Host "Make sure Hardhat is running before starting ngrok!" -ForegroundColor Yellow
} 
else {
    Write-Host "Node is listening on port 8545" -ForegroundColor Green
}

# 4. Deploy Contracts
Write-Host "`n[2/3] Deploying Contracts..." -ForegroundColor Green
$deployOutput = npm run deploy | Out-String
Write-Host $deployOutput

# Extract Contract Address
$posAddr = ""
if ($deployOutput -match "PoS Simulator deployed to (0x[a-fA-F0-9]{40})") {
    $posAddr = $matches[1]
    
    # Save to file for reference
    $posAddr | Out-File -FilePath "CONTRACT_ADDRESS.txt" -Force
    
    # Also save to a JSON file for easy reading
    @{
        posAddress = $posAddr
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        network = "localhost:8545"
    } | ConvertTo-Json | Out-File -FilePath "deployment.json" -Force
    
    # Display prominently
    Write-Host "`n" -NoNewline
    Write-Host "██████████████████████████████████████████████████████████████" -ForegroundColor Magenta
    Write-Host "█                                                            █" -ForegroundColor Magenta
    Write-Host "█  CONTRACT ADDRESS (WRITE ON BOARD):                       █" -ForegroundColor Magenta
    Write-Host "█                                                            █" -ForegroundColor Magenta  
    Write-Host "█  $posAddr  █" -ForegroundColor White -BackgroundColor DarkMagenta
    Write-Host "█                                                            █" -ForegroundColor Magenta
    Write-Host "█  Also saved to: CONTRACT_ADDRESS.txt                      █" -ForegroundColor Cyan
    Write-Host "█                                                            █" -ForegroundColor Magenta
    Write-Host "██████████████████████████████████████████████████████████████" -ForegroundColor Magenta
    
    if ($hasNgrok) {
        Write-Host "`n==================================================" -ForegroundColor Cyan
        Write-Host "FOR REMOTE STUDENTS (via ngrok):" -ForegroundColor Cyan
        Write-Host "==================================================" -ForegroundColor Cyan
        Write-Host "1. Open a NEW terminal window" -ForegroundColor Yellow
        Write-Host "2. Run: ngrok http 8545" -ForegroundColor Yellow
        Write-Host "3. Copy the 'Forwarding' HTTPS URL" -ForegroundColor Yellow
        Write-Host "   (e.g., https://abc123.ngrok-free.app)" -ForegroundColor Yellow
        Write-Host "4. Students paste that URL in 'Node URL' box" -ForegroundColor Yellow
        Write-Host "==================================================" -ForegroundColor Cyan
        Write-Host "`nIMPORTANT: Make sure Hardhat is running FIRST!" -ForegroundColor Red
        Write-Host "   If you see ngrok errors, check the Hardhat window." -ForegroundColor Red
    } 
    else {
        Write-Host "`nTIP: Install ngrok for remote students:" -ForegroundColor Cyan
        Write-Host "   Download from: https://ngrok.com/download" -ForegroundColor Yellow
    }
} 
else {
    Write-Host "Could not auto-read contract address. Check the deployment output above." -ForegroundColor Red
}

# 5. Start Frontend
Write-Host "`n[3/3] Starting Dashboard..." -ForegroundColor Green

# Final Instructions
Write-Host "`n==================================================" -ForegroundColor Yellow
Write-Host "LAB READY! WRITE ON BOARD:" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "" -NoNewline
Write-Host "INSTRUCTOR DASHBOARD:" -ForegroundColor Magenta
Write-Host "  URL: http://localhost:5173/?mode=instructor" -ForegroundColor White
Write-Host "  Contract: $posAddr" -ForegroundColor Yellow -BackgroundColor DarkRed
Write-Host "  ^ COPY THIS ADDRESS TO INSTRUCTOR DASHBOARD ^" -ForegroundColor Red
Write-Host "" -NoNewline
Write-Host "STUDENT ACCESS:" -ForegroundColor Cyan
Write-Host "  URL: http://$($ipAddr):5173" -ForegroundColor White
Write-Host "  Contract: $posAddr" -ForegroundColor White
if ($hasNgrok) {
Write-Host "" -NoNewline
Write-Host "FOR REMOTE STUDENTS:" -ForegroundColor Yellow
Write-Host "  Run in a new terminal: .\start-ngrok.ps1" -ForegroundColor White
Write-Host "  This will expose your lab to remote students via HTTPS" -ForegroundColor Gray
}
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "" -NoNewline
Write-Host "FILES CREATED:" -ForegroundColor Gray
Write-Host "  CONTRACT_ADDRESS.txt - Contains the PoS address" -ForegroundColor Gray
Write-Host "  deployment.json - Full deployment details" -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Yellow

Write-Host "`nOpening Instructor Dashboard in your browser..."
Start-Process "http://localhost:5173/?mode=instructor"
npm run web