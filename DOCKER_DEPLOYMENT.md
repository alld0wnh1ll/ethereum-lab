# Docker Deployment Guide

This guide explains how to deploy the Ethereum Lab using Docker containers.

---

## 🐳 Quick Start

### **Option 1: Docker Compose (Recommended)**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application:
- **Frontend**: http://localhost:5173
- **Blockchain RPC**: http://localhost:8545

### **Option 2: Docker Only**

```bash
# Build the image
docker build -t ethereum-lab .

# Run the container
docker run -d \
  --name ethereum-lab \
  -p 8545:8545 \
  -p 5173:5173 \
  ethereum-lab

# View logs
docker logs -f ethereum-lab

# Stop container
docker stop ethereum-lab
docker rm ethereum-lab
```

---

## 📦 What's Included

The Docker container includes:
- **Hardhat Node** - Local Ethereum blockchain (port 8545)
- **Smart Contracts** - Pre-deployed PoS simulator
- **Frontend** - Built React app served via `serve` (port 5173)
- **Automatic Setup** - Node starts, contracts deploy, frontend serves

---

## 🌐 Deployment Scenarios

### **Scenario 1: Local Classroom (Same Network)**

Students on the same network can access the instructor's container:

```bash
# Instructor runs on their machine
docker-compose up -d

# Share with students:
# - RPC URL: http://<instructor-ip>:8545
# - Frontend: http://<instructor-ip>:5173
# - Contract Address: (shown in logs)
```

### **Scenario 2: Remote Access (Internet)**

Use a reverse proxy or cloud hosting:

#### **Option A: Ngrok Tunnel**
```bash
# Start container
docker-compose up -d

# In another terminal, tunnel the RPC
ngrok http 8545

# Share ngrok HTTPS URL with students
```

#### **Option B: Cloud Deployment (AWS/Azure/DigitalOcean)**

1. Deploy container to cloud VM
2. Open ports 8545 and 5173 in firewall
3. Use VM's public IP or domain
4. Optional: Add HTTPS via Let's Encrypt

#### **Option C: Nginx Reverse Proxy (Production)**

```bash
# Start with nginx profile
docker-compose --profile production up -d

# Access via:
# - Frontend: http://localhost/
# - RPC: http://localhost/rpc
```

---

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file:

```env
# Network Configuration
HARDHAT_NETWORK=localhost
HARDHAT_CHAIN_ID=31337

# Contract Configuration
MIN_STAKE=1000000000000000000  # 1 ETH in wei

# Frontend Configuration
VITE_RPC_URL=http://localhost:8545
VITE_CONTRACT_ADDRESS=0x...
```

### **Custom Hardhat Configuration**

Edit `hardhat.config.js` before building:

```javascript
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      mining: {
        auto: true,
        interval: 12000  // 12 second blocks like mainnet
      }
    }
  }
};
```

---

## 📊 Monitoring & Logs

### **View Container Logs**
```bash
# All logs
docker-compose logs -f

# Just blockchain node
docker-compose logs -f ethereum-lab | grep hardhat

# Just frontend
docker-compose logs -f ethereum-lab | grep serve
```

### **Check Container Health**
```bash
docker ps
docker inspect ethereum-lab | grep Health
```

### **Access Container Shell**
```bash
docker exec -it ethereum-lab sh

# Inside container:
# - Check if node is running: curl http://localhost:8545
# - View contract address: cat CONTRACT_ADDRESS.txt
# - Check processes: ps aux
```

---

## 🔄 Updates & Rebuilds

### **Rebuild After Code Changes**
```bash
# Rebuild and restart
docker-compose up -d --build

# Or with Docker only
docker build -t ethereum-lab .
docker stop ethereum-lab
docker rm ethereum-lab
docker run -d --name ethereum-lab -p 8545:8545 -p 5173:5173 ethereum-lab
```

### **Update Only Frontend**
```bash
# Rebuild just the frontend
cd frontend
npm run build

# Copy to running container
docker cp dist/. ethereum-lab:/app/frontend/dist/
```

---

## 🚀 Production Deployment

### **Best Practices**

1. **Use Nginx Reverse Proxy**
   - Single entry point
   - HTTPS termination
   - Rate limiting
   - CORS configuration

2. **Persistent Storage**
   - Mount volumes for blockchain data
   - Backup contract addresses
   - Store deployment artifacts

3. **Security**
   - Don't expose port 8545 directly to internet
   - Use firewall rules
   - Implement authentication if needed
   - Use HTTPS for all external access

4. **Scaling**
   - Run multiple frontend replicas
   - Use load balancer
   - Single blockchain node (state consistency)

### **Example Production Setup**

```bash
# 1. Build for production
docker-compose --profile production build

# 2. Start with nginx
docker-compose --profile production up -d

# 3. Configure domain (optional)
# Point DNS to your server IP
# Update nginx.conf with your domain
# Add SSL certificate (Let's Encrypt)

# 4. Monitor
docker-compose logs -f
```

---

## 🐛 Troubleshooting

### **Container Won't Start**
```bash
# Check logs
docker logs ethereum-lab

# Common issues:
# - Port 8545 already in use: Stop local Hardhat node
# - Port 5173 in use: Stop local Vite dev server
# - Build failed: Check Docker build logs
```

### **Can't Connect to RPC**
```bash
# Test RPC from host
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test from inside container
docker exec ethereum-lab curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### **Frontend Not Loading**
```bash
# Check if frontend is built
docker exec ethereum-lab ls -la /app/frontend/dist

# Check serve process
docker exec ethereum-lab ps aux | grep serve

# Restart frontend only
docker exec ethereum-lab pkill serve
docker exec ethereum-lab serve -s frontend/dist -l 5173 &
```

### **Contract Not Deployed**
```bash
# Check contract address
docker exec ethereum-lab cat CONTRACT_ADDRESS.txt

# Manually redeploy
docker exec ethereum-lab npx hardhat run scripts/deploy.js --network localhost
```

---

## 📋 Docker Commands Cheat Sheet

```bash
# Build
docker-compose build
docker build -t ethereum-lab .

# Start
docker-compose up -d
docker run -d -p 8545:8545 -p 5173:5173 ethereum-lab

# Stop
docker-compose down
docker stop ethereum-lab

# Logs
docker-compose logs -f
docker logs -f ethereum-lab

# Shell Access
docker exec -it ethereum-lab sh

# Remove Everything
docker-compose down -v
docker rmi ethereum-lab

# Rebuild from Scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🌍 Exposing to Internet

### **Option 1: Cloudflare Tunnel (Recommended)**

```bash
# Install cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Start container
docker-compose up -d

# Create tunnel
cloudflared tunnel --url http://localhost:8545

# Share the HTTPS URL with students
```

### **Option 2: Ngrok**

```bash
# Start container
docker-compose up -d

# Tunnel RPC
ngrok http 8545

# Tunnel Frontend (optional)
ngrok http 5173
```

### **Option 3: Cloud VM with Public IP**

Deploy to AWS, Azure, or DigitalOcean:
1. Launch VM with Docker installed
2. Clone repo and run `docker-compose up -d`
3. Configure firewall to allow ports 8545, 5173
4. Share public IP with students

---

## 🔒 Security Notes

- **Development Only**: This setup is for educational environments
- **No Authentication**: RPC and frontend are publicly accessible
- **Test ETH Only**: No real value at risk
- **Production**: Add authentication, HTTPS, rate limiting, and monitoring

---

## 📝 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `HARDHAT_NETWORK` | localhost | Network to deploy to |
| `VITE_RPC_URL` | http://localhost:8545 | RPC endpoint for frontend |
| `VITE_CONTRACT_ADDRESS` | (auto) | PoS contract address |
| `PORT` | 5173 | Frontend port |
| `RPC_PORT` | 8545 | Blockchain RPC port |

---

## 🎓 Instructor Workflow

1. **Start Container**:
   ```bash
   docker-compose up -d
   ```

2. **Get Contract Address**:
   ```bash
   docker logs ethereum-lab | grep "PoS Simulator deployed"
   # Or: docker exec ethereum-lab cat CONTRACT_ADDRESS.txt
   ```

3. **Share with Students**:
   - RPC URL: http://YOUR_IP:8545 (or ngrok URL)
   - Contract Address: 0x...
   - Frontend: http://YOUR_IP:5173

4. **Monitor Activity**:
   - Access instructor dashboard: http://localhost:5173?mode=instructor
   - View logs: `docker-compose logs -f`

5. **Reset/Restart**:
   ```bash
   docker-compose restart
   ```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Hardhat Docker Guide](https://hardhat.org/hardhat-runner/docs/guides/docker)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

