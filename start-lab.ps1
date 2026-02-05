# Start-Lab.ps1 - Unified Blockchain Lab Launcher
# Usage:
#   .\start-lab.ps1 -Mode instructor              # Host the blockchain
#   .\start-lab.ps1 -Mode instructor -UseNgrok    # Host with ngrok tunnel
#   .\start-lab.ps1 -Mode student                 # Connect to instructor's blockchain

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("instructor", "student")]
    [string]$Mode,
    
    [switch]$UseNgrok = $false,
    
    # Student-mode parameters
    [string]$ContractAddress = "",
    [string]$RpcUrl = ""
)

# ============================================================================
# INSTRUCTOR MODE
# ============================================================================
function Start-InstructorMode {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "   INSTRUCTOR MODE - BLOCKCHAIN HOST" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan

    # Get Local IP Address
    $ipAddr = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi", "Ethernet" -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty IPAddress | 
               Select-Object -First 1)

    if (-not $ipAddr) {
        Write-Host "Could not auto-detect IP. Using 127.0.0.1" -ForegroundColor Yellow
        $ipAddr = "127.0.0.1"
    }

    Write-Host "Your Local IP: $ipAddr" -ForegroundColor Green
    Write-Host "Students should connect to: http://$($ipAddr):8545" -ForegroundColor Yellow

    # Check if ngrok is available
    $hasNgrok = Get-Command ngrok -ErrorAction SilentlyContinue

    # 1. Start Hardhat Node in a new window
    Write-Host ""
    Write-Host "[1/4] Starting blockchain node..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run chain"

    # Wait for node to boot
    Write-Host "Waiting for node to start..." -ForegroundColor Yellow
    $maxAttempts = 60
    $attempt = 0
    $nodeReady = $false

    while ($attempt -lt $maxAttempts -and -not $nodeReady) {
        Start-Sleep -Seconds 1
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST `
                -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' `
                -ContentType "application/json" -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $nodeReady = $true
                Write-Host "`nNode is ready!" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "." -NoNewline
        }
    }

    if (-not $nodeReady) {
        Write-Host "`nWARNING: Node may not be ready. Check the Hardhat window for errors." -ForegroundColor Red
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
        
        # Save to CONTRACT_ADDRESS.txt
        $posAddr | Out-File -FilePath "CONTRACT_ADDRESS.txt" -Force
        
        # Save to deployment.json
        @{
            posAddress = $posAddr
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            network = "localhost:8545"
        } | ConvertTo-Json | Out-File -FilePath "deployment.json" -Force
        
        # Display prominently
        Write-Host ""
        Write-Host "██████████████████████████████████████████████████████████████" -ForegroundColor Magenta
        Write-Host "█                                                            █" -ForegroundColor Magenta
        Write-Host "█  CONTRACT ADDRESS (WRITE ON BOARD):                       █" -ForegroundColor Magenta
        Write-Host "█                                                            █" -ForegroundColor Magenta  
        Write-Host "█  $posAddr  █" -ForegroundColor White -BackgroundColor DarkMagenta
        Write-Host "█                                                            █" -ForegroundColor Magenta
        Write-Host "█  Saved to: CONTRACT_ADDRESS.txt & deployment.json         █" -ForegroundColor Cyan
        Write-Host "█                                                            █" -ForegroundColor Magenta
        Write-Host "██████████████████████████████████████████████████████████████" -ForegroundColor Magenta
    } 
    else {
        Write-Host "Could not extract contract address. Check deployment output above." -ForegroundColor Red
    }

    # 3. Start ngrok if requested
    $rpcUrl = "http://$($ipAddr):8545"
    if ($UseNgrok) {
        if ($hasNgrok) {
            Write-Host ""
            Write-Host "[3/4] Starting ngrok for remote RPC access..." -ForegroundColor Green
            Start-Process powershell -ArgumentList "-NoExit", "-Command", `
                "Write-Host 'NGROK RPC TUNNEL' -ForegroundColor Cyan; Write-Host 'Copy the HTTPS URL shown below and share with students' -ForegroundColor Yellow; ngrok http 8545"
            Start-Sleep -Seconds 3
            Write-Host "Open the ngrok window to view the HTTPS URL for students." -ForegroundColor Yellow
            $rpcUrl = "<See ngrok window for HTTPS URL>"
        } else {
            Write-Host ""
            Write-Host "[3/4] Ngrok not found. Students will use your local IP for RPC." -ForegroundColor Yellow
            Write-Host "TIP: Install ngrok from https://ngrok.com/download for remote students" -ForegroundColor Cyan
        }
    } else {
        Write-Host ""
        Write-Host "[3/4] Skipping ngrok (use -UseNgrok flag to enable)" -ForegroundColor Gray
        if ($hasNgrok) {
            Write-Host "TIP: Run with -UseNgrok to expose your lab to remote students" -ForegroundColor Cyan
        }
    }

    # 4. Create instructor config and start frontend
    Write-Host ""
    Write-Host "[4/4] Starting instructor dashboard..." -ForegroundColor Green

    # Create instructor info file
    @{
        role = "instructor"
        contractAddress = $posAddr
        rpcUrl = $rpcUrl
        localIp = $ipAddr
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    } | ConvertTo-Json | Out-File -FilePath "instructor-config.json" -Force

    # Final Instructions
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Yellow
    Write-Host "INSTRUCTOR SETUP COMPLETE" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "WRITE ON BOARD FOR STUDENTS:" -ForegroundColor Magenta
    Write-Host "  Contract Address: $posAddr" -ForegroundColor Yellow
    if ($UseNgrok) {
        Write-Host "  RPC URL: [see ngrok window]" -ForegroundColor Yellow
    } else {
        Write-Host "  RPC URL: http://$($ipAddr):8545" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Students should run:" -ForegroundColor Cyan
    Write-Host "  .\start-lab.ps1 -Mode student" -ForegroundColor White
    Write-Host ""
    Write-Host "FILES CREATED:" -ForegroundColor Gray
    Write-Host "  CONTRACT_ADDRESS.txt  - Contract address only" -ForegroundColor Gray
    Write-Host "  deployment.json       - Full deployment details" -ForegroundColor Gray
    Write-Host "  instructor-config.json - Instructor configuration" -ForegroundColor Gray
    Write-Host "==================================================" -ForegroundColor Yellow

    Write-Host "`nOpening Instructor Dashboard in your browser..."
    Start-Process "http://localhost:5173/?mode=instructor"
    npm run web
}

# ============================================================================
# STUDENT MODE
# ============================================================================
function Start-StudentMode {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "   STUDENT MODE - BLOCKCHAIN LEARNER" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan

    $configPath = "student-config.json"

    # Load previous configuration if exists
    if (Test-Path $configPath) {
        Write-Host "Loading previous configuration..." -ForegroundColor Gray
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            if (-not $ContractAddress) { $script:ContractAddress = $config.contractAddress }
            if (-not $RpcUrl) { $script:RpcUrl = $config.rpcUrl }
        } catch {
            Write-Host "Warning: could not read previous config. Continuing..." -ForegroundColor Yellow
        }
    }

    # Prompt for contract address if not provided
    if (-not $ContractAddress) {
        Write-Host ""
        Write-Host "Enter the Contract Address from your instructor (ex: 0x1234...)" -ForegroundColor Yellow
        $script:ContractAddress = Read-Host "Contract Address"
    }

    # Prompt for RPC URL if not provided
    if (-not $RpcUrl) {
        Write-Host ""
        Write-Host "Enter the RPC URL from your instructor." -ForegroundColor Yellow
        Write-Host "Examples:" -ForegroundColor Gray
        Write-Host "  http://INSTRUCTOR_IP:8545" -ForegroundColor Gray
        Write-Host "  https://your-rpc.ngrok-free.app" -ForegroundColor Gray
        $script:RpcUrl = Read-Host "RPC URL"
    }

    # Validate contract address
    if ($ContractAddress.Length -ne 42 -or (-not $ContractAddress.StartsWith("0x"))) {
        Write-Host "Invalid contract address. Must start with 0x and be 42 characters." -ForegroundColor Red
        exit 1
    }

    # Validate RPC URL
    if (-not $RpcUrl.StartsWith("http")) {
        Write-Host "Invalid RPC URL. Must start with http:// or https://" -ForegroundColor Red
        exit 1
    }

    # Save configuration
    @{
        role = "student"
        contractAddress = $ContractAddress
        rpcUrl = $RpcUrl
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    } | ConvertTo-Json | Out-File -FilePath $configPath -Force

    # Test connection
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

    # Set environment variables
    $env:VITE_CONTRACT_ADDRESS = $ContractAddress
    $env:VITE_RPC_URL = $RpcUrl

    # Install dependencies if needed
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

    # Start frontend
    Write-Host ""
    Write-Host "[3/3] Starting Web3 Training Lab..." -ForegroundColor Green

    # Create student setup page that configures localStorage
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
    Write-Host "STUDENT SETUP COMPLETE" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Yellow
    Write-Host "Contract: $ContractAddress" -ForegroundColor White
    Write-Host "RPC URL: $RpcUrl" -ForegroundColor White
    Write-Host "==================================================" -ForegroundColor Yellow

    npm run web
}

# ============================================================================
# MAIN
# ============================================================================
Write-Host ""
Write-Host "==================================================" -ForegroundColor White
Write-Host "   WEB3 CLASSROOM LAB" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor White

if ($Mode -eq "instructor") {
    Start-InstructorMode
} else {
    Start-StudentMode
}
