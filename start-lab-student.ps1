# Start-Lab-Student.ps1 - Student Mode: Connect to instructor blockchain
param(
    [string]$ContractAddress = "",
    [string]$RpcUrl = ""
)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   STUDENT MODE - BLOCKCHAIN LEARNER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$configPath = "student-config.json"

if (Test-Path $configPath) {
    Write-Host "Loading previous configuration..." -ForegroundColor Gray
    try {
        $config = Get-Content $configPath | ConvertFrom-Json
        if (-not $ContractAddress) { $ContractAddress = $config.contractAddress }
        if (-not $RpcUrl) { $RpcUrl = $config.rpcUrl }
    } catch {
        Write-Host "Warning: could not read previous config. Continuing..." -ForegroundColor Yellow
    }
}

if (-not $ContractAddress) {
    Write-Host ""
    Write-Host "Enter the Contract Address from your instructor (ex: 0x1234...)" -ForegroundColor Yellow
    $ContractAddress = Read-Host "Contract Address"
}

if (-not $RpcUrl) {
    Write-Host ""
    Write-Host "Enter the RPC URL from your instructor." -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  http://INSTRUCTOR_IP:8545" -ForegroundColor Gray
    Write-Host "  https://your-rpc.ngrok-free.dev" -ForegroundColor Gray
    $RpcUrl = Read-Host "RPC URL"
}

if ($ContractAddress.Length -ne 42 -or (-not $ContractAddress.StartsWith("0x"))) {
    Write-Host "Invalid contract address. Must start with 0x and be 42 characters." -ForegroundColor Red
    exit 1
}

if (-not $RpcUrl.StartsWith("http")) {
    Write-Host "Invalid RPC URL. Must start with http:// or https://" -ForegroundColor Red
    exit 1
}

@{
    role = "student"
    contractAddress = $ContractAddress
    rpcUrl = $RpcUrl
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File -FilePath $configPath -Force

Write-Host ""
Write-Host "[1/3] Testing connection to instructor blockchain..." -ForegroundColor Green
try {
    $body = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    $response = Invoke-RestMethod -Uri $RpcUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
    if ($response.result) {
        $blockNum = [Convert]::ToInt32($response.result, 16)
        Write-Host "Connected! Current block: $blockNum" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not reach instructor RPC. You can still continue and configure inside the app." -ForegroundColor Yellow
}

$env:VITE_CONTRACT_ADDRESS = $ContractAddress
$env:VITE_RPC_URL = $RpcUrl

if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "[2/3] Installing dependencies..." -ForegroundColor Green
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies. Please check npm output." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[2/3] Dependencies already installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/3] Starting Web3 Training Lab..." -ForegroundColor Green

$setupHtml = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student Setup</title>
  <script>
    localStorage.setItem('pos_addr', '$ContractAddress');
    localStorage.setItem('custom_rpc', '$RpcUrl');
    localStorage.setItem('student_mode', 'true');
    window.location.href = 'http://localhost:5173';
  </script>
</head>
<body>
  <h1>Preparing your lab...</h1>
</body>
</html>
"@

$setupPath = "frontend/public/student-setup.html"
$setupHtml | Set-Content -Path $setupPath -Encoding UTF8

Start-Process "http://localhost:5173/student-setup.html"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "Student setup complete!" -ForegroundColor Green
Write-Host "Contract: $ContractAddress" -ForegroundColor White
Write-Host "RPC URL: $RpcUrl" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Yellow

npm run web
