# 🛠️ AgriChain v2.0 — Setup Instructions

Complete step-by-step guide to run AgriChain locally on your machine.

---

## ✅ Prerequisites

Before you begin, make sure you have:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | >= 18.0.0 | https://nodejs.org |
| npm | >= 9.0.0 | Comes with Node.js |
| Git | Any | https://git-scm.com |
| MetaMask | >= 11.0 | https://metamask.io (browser extension) |
| VS Code | Any | https://code.visualstudio.com (recommended) |

---

## 📥 Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/AgriChain.git
cd AgriChain
```

---

## 📦 Step 2 — Install Root Dependencies (Hardhat + Contracts)

```bash
# From the root AgriChain/ folder
npm install
```

This installs: Hardhat, OpenZeppelin, ethers.js, hardhat-gas-reporter, dotenv.

---

## 📦 Step 3 — Install Frontend Dependencies

```bash
cd src/frontend
npm install
cd ../..
```

This installs: Next.js 14, React, Wagmi v2, Viem, Tailwind CSS, TypeScript.

---

## ⛓️ Step 4 — Start the Local Hardhat Blockchain

Open **Terminal 1** and run:

```bash
npx hardhat node
```

You will see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

> ⚠️ **Keep this terminal running.** Do NOT close it.

---

## 🚀 Step 5 — Deploy Smart Contracts

Open **Terminal 2** and run:

```bash
npx hardhat run src/scripts/deploy.js --network localhost
```

Expected output:
```
Deploying Escrow.sol...      → 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deploying Reputation.sol...  → 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Deploying AgriChain.sol...   → 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✅ .env.local written to src/frontend/.env.local
✅ Deployer granted VERIFIED role
🌾 AgriChain deployment complete!
```

> This automatically creates `src/frontend/.env.local` with all contract addresses.

---

## 🖥️ Step 6 — Start the Frontend

Open **Terminal 3** and run:

```bash
cd src/frontend
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:  http://localhost:3000
✓ Ready in ~2.4s
```

Open your browser at **http://localhost:3000**

---

## 🦊 Step 7 — Configure MetaMask

### 7a. Add Hardhat Network
1. Open MetaMask → Click the network dropdown (top)
2. Click **Add Network** → **Add a network manually**
3. Fill in:
   - **Network Name:** `Hardhat Local`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `1337`
   - **Currency Symbol:** `ETH`
4. Click **Save**

### 7b. Import Test Account
1. MetaMask → Click your account icon → **Import Account**
2. Paste this private key (Hardhat Account #0):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click **Import**

> ⚠️ **IMPORTANT:** Every time you restart `npx hardhat node`, go to:
> MetaMask → Settings → Advanced → **Clear activity and nonce data**

---

## 🌾 Step 8 — Run the Full Lifecycle (Testing)

Once the app is open and MetaMask is connected:

### Assign Roles (Admin Panel)
1. Click **Admin Panel** (only visible to the deployer address)
2. To test with one wallet, add the **same address** as Farmer, Distributor, Retailer, and Consumer
3. Click **Verify User** for that address

### Register a Product (as Farmer)
1. Click **Register New Product**
2. Fill in: Farmer Name, Crop Type, Origin Location, Price (ETH), IPFS Hash (optional), Shipping Deadline
3. Click **Register** → Confirm in MetaMask

### Progress Through All 13 States
Click the product card → The action panel shows the **next available action** based on your role.
Follow the prompts through all 13 states.

**Full lifecycle = 16 confirmed transactions (~724,000 gas)**

---

## 🧪 Running Unit Tests

```bash
npx hardhat test
```

Tests cover: product registration, role guards, state transitions, escrow deposit/release, reputation ratings.

---

## 📊 Gas Report

```bash
REPORT_GAS=true npx hardhat test
```

---

## 🌐 Deploy to Polygon Amoy Testnet (Optional)

1. Get test MATIC from https://faucet.polygon.technology
2. Create `.env` in root:
   ```
   PRIVATE_KEY=your_wallet_private_key
   POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
   ```
3. Deploy:
   ```bash
   npx hardhat run src/scripts/deploy.js --network amoy
   ```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `nonce too high` error in MetaMask | MetaMask → Settings → Advanced → Clear activity and nonce data |
| `Cannot connect to network` | Make sure `npx hardhat node` is running in Terminal 1 |
| `No products showing` | Make sure you're connected as the same address that registered products |
| Frontend `.env.local` missing | Re-run `npx hardhat run src/scripts/deploy.js --network localhost` |
| MetaMask not detecting contracts | Switch MetaMask away from Hardhat network and back |
| Port 3000 in use | Run `npx kill-port 3000` then `npm run dev` again |

---

## 📁 Important File Locations

| File | Purpose |
|------|---------|
| `src/contracts/AgriChain.sol` | Core smart contract |
| `src/contracts/Escrow.sol` | Payment escrow |
| `src/contracts/Reputation.sol` | Ratings contract |
| `src/scripts/deploy.js` | Deployment script |
| `src/frontend/.env.local` | Auto-generated contract addresses |
| `src/frontend/components/ProductCard.tsx` | Product tile component |
| `src/frontend/components/ProductModal.tsx` | Action panel modal |

---

## 📞 Support

If you encounter issues not listed above, please open a GitHub Issue with:
- Your OS and Node.js version (`node --version`)
- The exact error message
- Which step you were on
