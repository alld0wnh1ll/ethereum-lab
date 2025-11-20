# 🚀 Web3 Training Lab - Quick Start Guide

## 🎓 For Instructors

### Local Network Setup (Same Room)
```powershell
.\start-lab-instructor.ps1
```
- Write the Contract Address on the board
- Share your local IP address (shown in terminal)
- Students connect using: `http://YOUR-IP:8545`

### Remote Setup (Online Class)
```powershell
.\start-lab-instructor.ps1 -UseNgrok
```
- Write the Contract Address on the board
- Share the ngrok HTTPS URL (from ngrok window)
- Students connect using the ngrok URL

### What You Get:
- Full blockchain node running locally
- Deployed smart contracts
- Instructor dashboard at `http://localhost:5173/?mode=instructor`
- Real-time view of all student activity

---

## 📚 For Students

### Setup (One Command!)
```powershell
.\start-lab-student.ps1
```

You'll be prompted for:
1. **Contract Address** - Get this from your instructor (on the board)
2. **RPC URL** - Get this from your instructor:
   - Local class: `http://instructor-ip:8545`
   - Online class: `https://something.ngrok-free.dev`

### What You Get:
- Your own local frontend at `http://localhost:5173`
- Connected to instructor's blockchain
- Auto-generated wallet for each browser tab
- Full access to all lab features

---

## 🎯 Key Benefits of This Approach

### For Instructors:
- ✅ You control the blockchain
- ✅ See all student activity in real-time
- ✅ No need to manage student installations
- ✅ Works locally or remotely

### For Students:
- ✅ One script to run everything
- ✅ No complex setup
- ✅ Works on any computer with Node.js
- ✅ Connects to shared classroom blockchain

---

## 📋 Prerequisites

Both instructors and students need:
- Node.js (v18+)
- Git (to clone the repo)
- Web browser

Only instructors need (optional):
- ngrok (for remote classes)

---

## 🆘 Troubleshooting

### Students Can't Connect
1. Check the RPC URL is correct
2. Ensure instructor's firewall allows port 8545
3. Try using instructor's IP instead of hostname

### "Contract Address Invalid"
- Must be exactly 42 characters
- Must start with "0x"
- Copy it exactly from the board

### Frontend Won't Start
```powershell
# Reinstall dependencies
npm install

# Then try again
.\start-lab-student.ps1
```

---

## 📖 Architecture

```
INSTRUCTOR MACHINE          STUDENT MACHINES
┌─────────────────┐        ┌──────────────┐
│ Blockchain Node │◄──────►│ Frontend #1  │
│ (port 8545)     │        └──────────────┘
│                 │        ┌──────────────┐
│ Smart Contracts │◄──────►│ Frontend #2  │
│                 │        └──────────────┘
│ Instructor      │        ┌──────────────┐
│ Dashboard       │◄──────►│ Frontend #3  │
└─────────────────┘        └──────────────┘
```

Everyone runs the frontend locally, but they all connect to the instructor's blockchain!
