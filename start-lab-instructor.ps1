# Start-Lab-Instructor.ps1 - Instructor Mode
param(
    [switch]$UseNgrok = $false
)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   INSTRUCTOR MODE - BLOCKCHAIN HOST" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Get Local IP Address
$ipAddr = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi", "Ethernet" | Select-Object -ExpandProperty IPAddress | Select-Object -First 1)

if (-not $ipAddr) {
    Write-Host "Could not auto-detect IP. Using 127.0.0.1" -ForegroundColor Yellow
    $ipAddr = "127.0.0.1"
}

Write-Host "Your Local IP: $ipAddr" -ForegroundColor Green

# Check if ngrok is available
$hasNgrok = Get-Command ngrok -ErrorAction SilentlyContinue

# 1. Start Hardhat Node (Background Job) in a new window
Write-Host ""
Write-Host "[1/4] Starting blockchain node..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run chain" 

# Wait for node to boot
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
        Write-Host "." -NoNewline
    }
}

Write-Host "" # New line after dots

if (-not $nodeReady) {
    Write-Host "WARNING: Node may not be ready. Check the Hardhat window for errors." -ForegroundColor Red
    exit 1
}

# 2. Deploy Contracts
Write-Host ""
Write-Host "[2/4] Deploying smart contracts..." -ForegroundColor Green
$deployOutput = npm run deploy | Out-String
Write-Host $deployOutput

# Extract Contract Address
$posAddr = ""
if ($deployOutput -match "PoS Simulator deployed to (0x[a-fA-F0-9]{40})") {
    $posAddr = $matches[1]
    
    # Save to file for reference
    $posAddr | Out-File -FilePath "CONTRACT_ADDRESS.txt" -Force
    
    # Display prominently
    Write-Host ""
    Write-Host "██████████████████████████████████████████████████████████████" -ForegroundColor Magenta
    Write-Host "█                                                            █" -ForegroundColor Magenta
    Write-Host "█  CONTRACT ADDRESS (WRITE ON BOARD):                       █" -ForegroundColor Magenta
    Write-Host "█                                                            █" -ForegroundColor Magenta  
    Write-Host "█  $posAddr  █" -ForegroundColor White -BackgroundColor DarkMagenta
    Write-Host "█                                                            █" -ForegroundColor Magenta
    Write-Host "██████████████████████████████████████████████████████████████" -ForegroundColor Magenta
} 
else {
    Write-Host "Could not extract contract address. Check deployment output above." -ForegroundColor Red
}

# 3. Start ngrok for RPC if requested
$rpcUrl = "http://$($ipAddr):8545"
if ($UseNgrok) {
    if ($hasNgrok) {
        Write-Host ""
        Write-Host "[3/4] Starting ngrok for remote RPC access..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'NGROK RPC TUNNEL' -ForegroundColor Cyan; Write-Host 'Copy the HTTPS URL shown below and share with students' -ForegroundColor Yellow; ngrok http 8545"
        Start-Sleep -Seconds 3
        Write-Host "Open the ngrok window to view the HTTPS URL for students." -ForegroundColor Yellow
        $rpcUrl = "<See ngrok window for HTTPS URL>"
    } else {
        Write-Host ""
        Write-Host "Ngrok not found. Students will use your local IP for RPC." -ForegroundColor Yellow
    }
}

# 4. Start Frontend with Instructor Dashboard
Write-Host ""
Write-Host "[4/4] Starting instructor dashboard..." -ForegroundColor Green
Write-Host "Opening http://localhost:5173/?mode=instructor" -ForegroundColor Cyan

# Create instructor info file
@{
    role = "instructor"
    contractAddress = $posAddr
    rpcUrl = $rpcUrl
    localIp = $ipAddr
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File -FilePath "instructor-config.json" -Force

Start-Process "http://localhost:5173/?mode=instructor"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "INSTRUCTOR SETUP COMPLETE" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "WRITE ON BOARD FOR STUDENTS:" -ForegroundColor Magenta
Write-Host "  Contract Address: $posAddr" -ForegroundColor Yellow
if ($UseNgrok) {
    Write-Host "  RPC URL: [see ngrok window]" -ForegroundColor Yellow
} else {
    Write-Host "  RPC URL: http://$($ipAddr):8545" -ForegroundColor Yellow
}
Write-Host "Students should run: .\start-lab-student.ps1" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Yellow

# Start frontend
npm run web
