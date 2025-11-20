# 🚀 Deployment Checklist for alld0wnh1ll/ethereum-lab

Follow these exact steps to deploy your Ethereum Lab to GitHub Pages.

---

## ✅ Step-by-Step Setup

### **1. Commit All Changes**

```bash
# Make sure you're in the project root
cd C:\Users\nicholas.harrell\Desktop\Projects\blockchain_web

# Stage all files
git add .

# Commit
git commit -m "Prepare for GitHub Pages deployment"

# Push to GitHub
git push origin main
```

### **2. Enable GitHub Pages**

1. Go to: **https://github.com/alld0wnh1ll/ethereum-lab/settings/pages**

2. Under "Build and deployment":
   - **Source**: Select **"GitHub Actions"** (NOT "Deploy from a branch")
   
3. Click **Save**

4. That's it! The workflow will run automatically.

### **3. Wait for Deployment (2-3 minutes)**

1. Go to: **https://github.com/alld0wnh1ll/ethereum-lab/actions**

2. You'll see a workflow running: **"Deploy to GitHub Pages"**

3. Click on it to watch progress:
   - ✓ Build (compiles frontend)
   - ✓ Deploy (uploads to Pages)

4. When complete, you'll see: **"Deployment successful"**

### **4. Access Your Site**

Your live site is now at:

**🌐 https://alld0wnh1ll.github.io/ethereum-lab/**

Test it:
- Open the URL in your browser
- You should see the Ethereum Lab intro page
- Navigate through the tabs (Orientation, Basics, etc.)

---

## 🔗 Setting Up RPC for Students

Students need an RPC endpoint to interact with the blockchain. Here are your options:

### **Option A: Local + Cloudflare Tunnel (Recommended for Class)**

```bash
# Terminal 1: Start blockchain
npx hardhat node --hostname 0.0.0.0

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Expose via tunnel
cloudflared tunnel --url http://localhost:8545
```

You'll get output like:
```
Your quick Tunnel has been created! Visit it at:
https://abc-123-def.trycloudflare.com
```

**Share with students:**
- Frontend: https://alld0wnh1ll.github.io/ethereum-lab/
- RPC URL: https://abc-123-def.trycloudflare.com
- Contract: 0x... (from deployment output)

### **Option B: Docker Container on Cloud**

```bash
# Deploy to DigitalOcean/AWS/Azure
docker-compose up -d

# Get public IP
curl ifconfig.me

# Share with students:
# - RPC URL: http://YOUR_PUBLIC_IP:8545
# - Contract: (from docker logs)
```

### **Option C: Each Student Uses Codespaces**

Students click "Open in Codespaces" button:
- Each gets their own blockchain
- No shared RPC needed
- Perfect for individual work

---

## 📝 Instructions for Students

Add this to your course materials:

```
🌐 Ethereum Lab Access

Web Interface (No Installation):
→ https://alld0wnh1ll.github.io/ethereum-lab/

Setup Instructions:
1. Visit the URL above
2. Navigate to "Live Network" tab
3. Enter the RPC URL: [INSTRUCTOR PROVIDES]
4. Enter Contract Address: [INSTRUCTOR PROVIDES]
5. Click "Request 5 ETH" to start!

For CLI Labs:
→ Click "Open in GitHub Codespaces" button on the repo
→ Wait for environment to load (~30 seconds)
→ Run: npx hardhat node
→ Follow instructions in the "CLI Labs" tab
```

---

## 🔄 Updating the Site

Every time you push to `main`, GitHub automatically rebuilds and deploys:

```bash
# Make changes to frontend/src/App.jsx or other files
git add .
git commit -m "Update features"
git push origin main

# Check deployment: https://github.com/alld0wnh1ll/ethereum-lab/actions
# Site updates in ~2 minutes
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Site loads: https://alld0wnh1ll.github.io/ethereum-lab/
- [ ] All tabs work (Intro, Basics, Explore, Learn, Practice, Live, CLI Labs)
- [ ] Images load (PoS diagram)
- [ ] Can enter RPC URL and contract address
- [ ] Codespaces button works
- [ ] GitPod button works

---

## 🐛 Troubleshooting

### **Site shows 404**
- Verify GitHub Pages is enabled (Settings → Pages)
- Check source is set to "GitHub Actions"
- Wait 2-3 minutes after first push
- Check Actions tab for build errors

### **Site loads but assets missing**
- Verify `base: '/ethereum-lab/'` in vite.config.js
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors

### **Workflow fails**
- Go to Actions tab
- Click failed workflow
- Read error message
- Common issues:
  - Node version mismatch
  - Missing dependencies
  - TypeScript errors

### **RPC connection fails from GitHub Pages**
- GitHub Pages uses HTTPS
- Your RPC must also be HTTPS (use cloudflared tunnel)
- HTTP RPC won't work (browser blocks mixed content)

---

## 📊 Your Final Architecture

```
Students → https://alld0wnh1ll.github.io/ethereum-lab/ (GitHub Pages)
              ↓
         Enter RPC URL
              ↓
         https://your-tunnel.com (Cloudflare Tunnel)
              ↓
         http://localhost:8545 (Your Hardhat Node)
```

**Benefits:**
- ✅ Frontend hosted for free
- ✅ Always online
- ✅ Fast global CDN
- ✅ Automatic updates on push
- ✅ HTTPS included
- ✅ No server costs

**You only need to:**
- Run Hardhat node when teaching
- Expose it via tunnel
- Share the tunnel URL with students

---

## 🎓 Class Day Workflow

**Before Class (5 minutes):**
```bash
# Start blockchain
npx hardhat node --hostname 0.0.0.0

# Deploy contracts (new terminal)
npx hardhat run scripts/deploy.js --network localhost

# Tunnel it (new terminal)
cloudflared tunnel --url http://localhost:8545

# Note the tunnel URL and contract address
```

**Share with Students:**
```
🌐 Lab URL: https://alld0wnh1ll.github.io/ethereum-lab/
🔗 RPC URL: https://abc-123.trycloudflare.com
📝 Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**After Class:**
- Close terminals (Ctrl+C)
- Tunnel stops automatically
- GitHub Pages stays online for students to review

---

## 🎉 Next Steps

1. Push all changes to GitHub
2. Enable GitHub Pages in repo settings
3. Wait 2-3 minutes
4. Visit https://alld0wnh1ll.github.io/ethereum-lab/
5. Share with students!

Your Ethereum Lab is now **globally accessible** with zero hosting costs! 🚀

