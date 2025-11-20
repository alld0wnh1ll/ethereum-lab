#!/bin/sh
set -e

echo "Starting Ethereum Lab Container..."

# Start Hardhat node in background
echo "Starting Hardhat blockchain node on port 8545..."
npx hardhat node --hostname 0.0.0.0 &
HARDHAT_PID=$!

# Wait for node to be ready
echo "Waiting for blockchain node to start..."
for i in $(seq 1 30); do
  if curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo "✓ Blockchain node is ready!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# Deploy contracts
echo "Deploying smart contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Extract contract address and save
CONTRACT_ADDR=$(cat CONTRACT_ADDRESS.txt 2>/dev/null || echo "")
if [ -n "$CONTRACT_ADDR" ]; then
  echo "✓ Contract deployed at: $CONTRACT_ADDR"
  export VITE_CONTRACT_ADDRESS=$CONTRACT_ADDR
else
  echo "⚠ Warning: Could not find contract address"
fi

# Start frontend server
echo "Starting frontend on port 5173..."
serve -s frontend/dist -l 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "✓ Ethereum Lab is running!"
echo "=========================================="
echo "Blockchain RPC: http://localhost:8545"
echo "Frontend: http://localhost:5173"
echo "Contract Address: $CONTRACT_ADDR"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?

