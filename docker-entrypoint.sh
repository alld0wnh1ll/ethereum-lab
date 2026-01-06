#!/bin/bash
set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ETHEREUM IMMERSIVE TRAINER                             ║"
echo "║     Interactive Blockchain Learning Environment            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Default values
MODE="${MODE:-instructor}"
RPC_PORT="${RPC_PORT:-8545}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

echo "Mode: $MODE"
echo ""

# ============================================
# INSTRUCTOR MODE
# Runs blockchain node + deploys contracts + serves frontend
# ============================================
if [ "$MODE" = "instructor" ]; then
    echo "🎓 Starting INSTRUCTOR mode..."
    echo "   - Blockchain node will run on port $RPC_PORT"
    echo "   - Frontend will run on port $FRONTEND_PORT"
    echo ""
    
    # Start Hardhat node in background
    echo "⛓️  Starting Hardhat blockchain node..."
    npx hardhat node --hostname 0.0.0.0 --port $RPC_PORT &
    HARDHAT_PID=$!
    
    # Wait for node to be ready
    echo "   Waiting for blockchain node to start..."
    for i in $(seq 1 30); do
        if curl -s -X POST http://localhost:$RPC_PORT \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
            echo "   ✓ Blockchain node is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "   ✗ Failed to start blockchain node!"
            exit 1
        fi
        echo "   Attempt $i/30..."
        sleep 2
    done
    
    # Deploy contracts
    echo ""
    echo "📜 Deploying smart contracts..."
    npx hardhat run scripts/deploy.js --network localhost
    
    # Read and export contract address
    if [ -f "CONTRACT_ADDRESS.txt" ]; then
        CONTRACT_ADDRESS=$(head -1 CONTRACT_ADDRESS.txt | tr -d '\r\n')
        export CONTRACT_ADDRESS
        
        # Also save to a web-accessible location
        mkdir -p /app/frontend/dist/api
        echo "{\"contractAddress\":\"$CONTRACT_ADDRESS\",\"rpcUrl\":\"http://localhost:$RPC_PORT\"}" > /app/frontend/dist/api/config.json
        echo "$CONTRACT_ADDRESS" > /app/frontend/dist/contract-address.txt
        
        echo "   ✓ Contract deployed!"
    else
        echo "   ⚠ Warning: Could not find contract address file"
    fi
    
    # Start frontend server
    echo ""
    echo "🌐 Starting frontend server..."
    serve -s /app/frontend/dist -l $FRONTEND_PORT &
    FRONTEND_PID=$!
    
    # Print success banner
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✓ INSTRUCTOR NODE IS RUNNING                              ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                                                            ║"
    echo "║  Blockchain RPC:    http://localhost:$RPC_PORT                  ║"
    echo "║  Frontend:          http://localhost:$FRONTEND_PORT                  ║"
    echo "║                                                            ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  CONTRACT ADDRESS:                                         ║"
    echo "║  $CONTRACT_ADDRESS  ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                                                            ║"
    echo "║  📋 SHARE WITH STUDENTS:                                   ║"
    echo "║     RPC URL: http://<your-ip>:$RPC_PORT                         ║"
    echo "║     Contract: $CONTRACT_ADDRESS  ║"
    echo "║                                                            ║"
    echo "║  📄 Contract address also available at:                    ║"
    echo "║     http://localhost:$FRONTEND_PORT/contract-address.txt        ║"
    echo "║     http://localhost:$FRONTEND_PORT/api/config.json             ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
# ============================================
# STUDENT MODE  
# Only serves frontend, connects to instructor's blockchain
# ============================================
elif [ "$MODE" = "student" ]; then
    echo "📚 Starting STUDENT mode..."
    
    # Check for required instructor connection info
    if [ -z "$INSTRUCTOR_RPC_URL" ]; then
        echo ""
        echo "⚠️  INSTRUCTOR_RPC_URL not set!"
        echo "   Students need to connect to instructor's blockchain."
        echo ""
        echo "   Set environment variable:"
        echo "   INSTRUCTOR_RPC_URL=http://<instructor-ip>:8545"
        echo ""
        INSTRUCTOR_RPC_URL="http://localhost:8545"
    fi
    
    echo "   - Connecting to: $INSTRUCTOR_RPC_URL"
    echo "   - Frontend will run on port $FRONTEND_PORT"
    echo ""
    
    # Create config for student to connect to instructor
    mkdir -p /app/frontend/dist/api
    echo "{\"rpcUrl\":\"$INSTRUCTOR_RPC_URL\",\"contractAddress\":\"$CONTRACT_ADDRESS\",\"mode\":\"student\"}" > /app/frontend/dist/api/config.json
    
    # Start frontend server
    echo "🌐 Starting frontend server..."
    serve -s /app/frontend/dist -l $FRONTEND_PORT &
    FRONTEND_PID=$!
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✓ STUDENT CLIENT IS RUNNING                               ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                                                            ║"
    echo "║  Frontend:          http://localhost:$FRONTEND_PORT                  ║"
    echo "║  Instructor RPC:    $INSTRUCTOR_RPC_URL"
    echo "║                                                            ║"
    echo "║  Open browser to: http://localhost:$FRONTEND_PORT                   ║"
    echo "║  Then enter the instructor's contract address              ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Press Ctrl+C to stop"
    
else
    echo "❌ Unknown mode: $MODE"
    echo "   Valid modes: instructor, student"
    exit 1
fi

# Keep container running
wait
