# GitHub Pages Deployment Guide

This guide shows how to deploy the Ethereum Lab frontend to GitHub Pages for free hosting.

---

## 🚀 One-Time Setup

### **Step 1: Enable GitHub Pages**

1. Go to your GitHub repo: `https://github.com/nicholas-harrell_usma/ethereum_lab`
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Click **Save**

### **Step 2: Configure Base Path (If Using Project Pages)**

If your repo URL will be `username.github.io/ethereum_lab` (not a custom domain):

```bash
# Add to frontend/.env
VITE_BASE_PATH=/ethereum_lab
```

If using a custom domain or `username.github.io`, leave it as `/`.

### **Step 3: Push the Workflow**

The workflow file is already created at `.github/workflows/deploy.yml`. Just push it:

```bash
git add .github/workflows/deploy.yml
git add frontend/vite.config.js
git commit -m "Add GitHub Pages deployment"
git push origin main
```

---

## 📦 Automatic Deployment

Once set up, **every push to main** automatically:
1. Builds the frontend
2. Deploys to GitHub Pages
3. Updates your live site

Check deployment status:
- Go to **Actions** tab in GitHub
- See build progress
- Site updates in ~2 minutes

---

## 🌐 Accessing Your Site

**Your URL will be:**
- `https://nicholas-harrell-usma.github.io/ethereum_lab/` (project pages)
- OR `https://yourdomain.com` (if using custom domain)

**Students visit this URL and:**
1. Enter the RPC URL you provide
2. Enter the contract address
3. Start using the lab!

---

## 🔗 RPC Endpoint Options

GitHub Pages hosts the frontend, but you still need an RPC endpoint:

### **Option 1: Local + Tunnel (Classroom)**
```bash
# On your machine
npx hardhat node --hostname 0.0.0.0

# Tunnel it
cloudflared tunnel --url http://localhost:8545
# Share the HTTPS URL with students
```

### **Option 2: Docker on Cloud VM**
```bash
# Deploy to AWS/Azure/DigitalOcean
docker-compose up -d

# Share: http://YOUR_VM_IP:8545
```

### **Option 3: Codespaces (Per-Student)**
- Each student opens repo in Codespaces
- Gets their own blockchain + terminal
- No shared RPC needed

---

## 📝 Student Instructions

Add this to your GitHub repo README:

```markdown
## For Students

### Quick Start (No Installation)
1. Visit: https://nicholas-harrell-usma.github.io/ethereum_lab/
2. Get RPC URL and Contract Address from instructor
3. Enter them in the "Connection Setup" section
4. Click "Request 5 ETH" to get started!

### CLI Labs (Requires Setup)
1. Click "Open in GitHub Codespaces" button
2. Wait for environment to load
3. Run: `npx hardhat node`
4. Follow CLI Labs instructions on the website
```

---

## 🔄 Updating the Site

```bash
# Make changes to frontend/src/
# Commit and push
git add .
git commit -m "Update frontend"
git push origin main

# GitHub Actions automatically rebuilds and deploys
# Check Actions tab for progress
```

---

## 🎨 Custom Domain (Optional)

1. Buy a domain (e.g., `ethereum-lab.com`)
2. In GitHub Settings → Pages:
   - Add custom domain
   - Enable HTTPS
3. Update DNS records:
   ```
   CNAME → nicholas-harrell-usma.github.io
   ```

---

## 🐛 Troubleshooting

### **Site Not Updating**
- Check Actions tab for build errors
- Clear browser cache (Ctrl+Shift+R)
- Verify workflow ran successfully

### **404 Error**
- Check base path in `vite.config.js`
- Verify GitHub Pages is enabled
- Check repo is public (or you have GitHub Pro)

### **Assets Not Loading**
- Verify `base` path in vite.config.js matches your URL structure
- Check browser console for 404s
- Ensure all assets are in `frontend/public/`

### **RPC Connection Fails**
- Verify RPC URL is HTTPS (GitHub Pages is HTTPS, can't call HTTP)
- Check CORS is enabled on RPC endpoint
- Use tunnel (ngrok/cloudflared) for local RPC

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────┐
│  GitHub Pages (Static Hosting)         │
│  https://username.github.io/repo        │
│  - Hosts: HTML, CSS, JS, images         │
│  - Free, fast CDN                       │
│  - HTTPS included                       │
└─────────────────┬───────────────────────┘
                  │
                  │ Students enter RPC URL
                  ↓
┌─────────────────────────────────────────┐
│  Instructor's RPC Endpoint              │
│  - Hardhat node (local or cloud)        │
│  - Exposed via tunnel or public IP      │
│  - Handles all blockchain operations    │
└─────────────────────────────────────────┘
```

---

## 💰 Cost

**GitHub Pages:**
- ✅ FREE for public repos
- ✅ 100GB bandwidth/month
- ✅ Unlimited builds
- ✅ Custom domain support

**RPC Endpoint:**
- Free if running locally
- ~$5-10/month for cloud VM (DigitalOcean, AWS)
- Free with Codespaces (60 hours/month for students)

---

## 🎓 Instructor Workflow

### **Before Class:**
```bash
# 1. Start blockchain (local or cloud)
docker-compose up -d

# 2. Get contract address
docker logs ethereum-lab | grep "PoS Simulator"

# 3. Expose RPC (if local)
cloudflared tunnel --url http://localhost:8545

# 4. Share with students:
#    - Frontend: https://nicholas-harrell-usma.github.io/ethereum_lab/
#    - RPC URL: https://your-tunnel-url.com
#    - Contract: 0x...
```

### **During Class:**
- Students visit GitHub Pages URL
- Enter your RPC URL and contract address
- Everyone connects to your blockchain
- Monitor via Instructor Dashboard

### **After Class:**
- Stop the blockchain: `docker-compose down`
- Students can still access the site anytime
- Next class: start fresh blockchain or reuse

---

## 🔐 Security Notes

- GitHub Pages sites are public (anyone can access)
- RPC endpoint should be password-protected for production
- Use firewall rules to limit RPC access to classroom IPs
- Test ETH has no value - safe for learning

---

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Static Deployment](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)

