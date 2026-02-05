# Docker Deployment Guide

This guide explains how to deploy the Ethereum Immersive Trainer using Docker.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB RAM available for Docker

## Quick Start (Instructor Mode)

```bash
# Build and run
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

Once running:
- **Frontend**: http://localhost:5173
- **Blockchain RPC**: http://localhost:8545

## Deployment Modes

### 1. Instructor Mode (Default)

Runs a full blockchain node with deployed contracts. Use this on the instructor's machine.

```bash
docker-compose up --build
```

**What it does:**
- Starts a Hardhat blockchain node
- Deploys the PoS Simulator contract
- Serves the frontend web application
- Provides RPC endpoint for students to connect

**After startup, you'll see:**
```
╔════════════════════════════════════════════════════════════╗
║  ✓ INSTRUCTOR NODE IS RUNNING                              ║
╠════════════════════════════════════════════════════════════╣
║  Blockchain RPC:    http://localhost:8545                  ║
║  Frontend:          http://localhost:5173                  ║
║  CONTRACT ADDRESS:  0x...                                  ║
╚════════════════════════════════════════════════════════════╝
```

### 2. Student Mode

Runs only the frontend, connecting to an instructor's blockchain.

```bash
# Set instructor's IP and run
INSTRUCTOR_RPC_URL=http://<instructor-ip>:8545 docker-compose -f docker-compose.student.yml up --build
```

Or create a `.env` file:
```env
INSTRUCTOR_RPC_URL=http://192.168.1.100:8545
CONTRACT_ADDRESS=0x...
```

Then run:
```bash
docker-compose -f docker-compose.student.yml up --build
```

## Sharing with Students

### Find Your IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Linux/Mac:**
```bash
hostname -I   # Linux
ifconfig      # Mac
```

### Share This Information

Give students:
1. **RPC URL**: `http://<your-ip>:8545`
2. **Frontend URL**: `http://<your-ip>:5173`
3. **Contract Address**: Shown in startup output

Students can either:
- Open `http://<your-ip>:5173` directly in their browser
- Run their own student container connecting to your RPC

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODE` | `instructor` | `instructor` or `student` |
| `RPC_PORT` | `8545` | Blockchain RPC port |
| `FRONTEND_PORT` | `5173` | Frontend web server port |
| `INSTRUCTOR_RPC_URL` | - | (Student mode) Instructor's RPC URL |
| `CONTRACT_ADDRESS` | - | Pre-configure contract address |

### Custom Ports

```yaml
# In docker-compose.yml
ports:
  - "9545:8545"    # Map RPC to port 9545
  - "3000:5173"    # Map frontend to port 3000
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache

# Check container status
docker-compose ps

# Execute command in running container
docker-compose exec ethereum-trainer bash
```

## Accessing CLI Labs

The CLI labs are included in the Docker image. To use them:

```bash
# Enter the container
docker-compose exec ethereum-trainer bash

# Navigate to CLI labs
cd /app/scripts/cli-labs/standalone

# Run interactive CLI
node interactive.js
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Ensure ports aren't in use
netstat -an | grep 8545
netstat -an | grep 5173
```

### Students can't connect

1. **Check firewall**: Ensure ports 8545 and 5173 are open
2. **Check network**: Students must be on the same network or have network access
3. **Verify IP**: Make sure you're sharing the correct IP address

**Windows Firewall:**
```powershell
# Allow ports through firewall (run as admin)
netsh advfirewall firewall add rule name="Ethereum Trainer RPC" dir=in action=allow protocol=tcp localport=8545
netsh advfirewall firewall add rule name="Ethereum Trainer Frontend" dir=in action=allow protocol=tcp localport=5173
```

**Linux:**
```bash
sudo ufw allow 8545
sudo ufw allow 5173
```

### Blockchain state lost after restart

By default, blockchain state persists via Docker volumes. If you want a fresh start:

```bash
docker-compose down -v
docker-compose up --build
```

### Out of memory

Add resource limits to `docker-compose.yml`:

```yaml
services:
  ethereum-trainer:
    deploy:
      resources:
        limits:
          memory: 4G
```

## Production Deployment

For production deployment (e.g., cloud server):

1. **Use HTTPS** - Put behind a reverse proxy (nginx, traefik)
2. **Set resource limits** - Prevent runaway memory usage
3. **Enable restart policy** - Already set to `unless-stopped`
4. **Monitor logs** - Use Docker logging drivers

### Example with Nginx Proxy

```yaml
# docker-compose.prod.yml
services:
  ethereum-trainer:
    build: .
    environment:
      - MODE=instructor
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - ethereum-trainer
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                         │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Hardhat Node    │    │     Frontend (serve)          │  │
│  │  (Blockchain)    │    │     React Web App             │  │
│  │                  │    │                                │  │
│  │  Port: 8545      │    │     Port: 5173                │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Smart Contracts                          │  │
│  │  - PoSSimulator (main training contract)             │  │
│  │  - Student-deployed contracts                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Ensure Docker has adequate resources allocated
