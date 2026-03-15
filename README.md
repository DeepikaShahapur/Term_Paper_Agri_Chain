# 🌾 AgriChain v2.0

> **A Smart Contract-Enabled Blockchain System for Transparent Agricultural Produce Tracking**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)](https://hardhat.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Smart Contract Lifecycle](#smart-contract-lifecycle)
- [Research Paper](#research-paper)
- [Author](#author)

---

## Overview

AgriChain v2.0 is a production-ready Ethereum decentralised application (dApp) that brings **transparency, trust, and traceability** to agricultural supply chains. It connects Farmers, Distributors, Retailers, and Consumers on a shared blockchain ledger — eliminating intermediary fraud, ensuring fair pricing, and enabling end-to-end product provenance verification.

**The Problem:** Farmers receive only 20–30% of the final retail price. Consumers cannot verify product origin. Counterfeiting in agri-food supply chains costs billions annually.

**The Solution:** A 13-state smart contract lifecycle, escrow-protected payments, on-chain reputation ratings, and a QR-scannable consumer traceability interface — all on Ethereum.

---

## Features

| Feature | Description |
|---------|-------------|
| 🔄 **13-State Lifecycle** | Every supply chain stage from Farm → Distributor → Retailer → Consumer |
| 🔐 **Role-Based Access Control** | 5 roles: Owner, Farmer, Distributor, Retailer, Consumer |
| 💰 **Escrow Payments** | ETH held in custody, released only on confirmed delivery |
| ⭐ **Reputation System** | On-chain 1–5 star ratings per participant address |
| 📦 **IPFS Metadata** | Off-chain rich data (images, certificates) with on-chain hash |
| 👛 **Wallet Agnostic** | Any EIP-1193 wallet: MetaMask, Rabby, Frame |
| 📱 **QR Traceability** | `getProductBasic()` — no wallet needed for consumers |
| ⚙️ **Auto Deploy Config** | `deploy.js` writes `.env.local` automatically |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│            TIER 1 — PRESENTATION LAYER              │
│   Next.js 14  │  Tailwind CSS  │  Wagmi v2 + Viem   │
│   MetaMask (EIP-1193)  │  ProductCard  │  AdminPanel │
└──────────────────────┬──────────────────────────────┘
                       │  Ethereum Transactions (write)
                       │  readContract calls (read)
┌──────────────────────▼──────────────────────────────┐
│           TIER 2 — SMART CONTRACT LAYER             │
│  AgriChain.sol    │  Escrow.sol  │  Reputation.sol   │
│  (13-State FSM)   │ (ETH Custody)│  (1–5★ Ratings)  │
│        OpenZeppelin AccessControl + ReentrancyGuard  │
└──────────────────────┬──────────────────────────────┘
                       │  State + Events + IPFS Hash
┌──────────────────────▼──────────────────────────────┐
│            TIER 3 — DATA & NETWORK LAYER            │
│   Hardhat Local Node (dev)  │  Polygon Amoy (staging)│
│              IPFS — Off-chain Metadata Storage       │
└─────────────────────────────────────────────────────┘
```

See [`architecture.png`](architecture.png) for the full visual diagram.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend UI | Next.js 14, React 18, Tailwind CSS | Pages, routing, responsive UI |
| Web3 Client | Wagmi v2 + Viem | Contract reads/writes |
| Wallet | EIP-1193 injected (MetaMask) | Transaction signing |
| Smart Contracts | Solidity ^0.8.24 | Business logic on EVM |
| Contract Libraries | OpenZeppelin v5 | RBAC, ReentrancyGuard |
| Dev Network | Hardhat v2.22+ | Local Ethereum node |
| Public Testnet | Polygon Amoy | Staging deployment |
| Off-chain Storage | IPFS | Rich product metadata |
| Deploy Script | ethers.js | Auto env-config generation |

---

## Project Structure

```
AgriChain/
│
├── src/
│   ├── contracts/
│   │   ├── AgriChain.sol          # Core 13-state FSM contract
│   │   ├── Escrow.sol             # Payment escrow contract
│   │   └── Reputation.sol         # On-chain reputation ratings
│   ├── scripts/
│   │   └── deploy.js              # Deploy all contracts + auto write .env.local
│   ├── test/
│   │   └── AgriChain.test.js      # Mocha/Chai unit tests
│   └── frontend/
│       ├── app/
│       │   └── page.tsx           # Main application page
│       └── components/
│           ├── WalletConnect.tsx  # Wallet connection & role display
│           ├── ProductCard.tsx    # Product tile (getProductBasic)
│           ├── ProductModal.tsx   # Full detail + action panel
│           ├── RegisterProductForm.tsx  # Farmer product registration
│           └── AdminPanel.tsx     # Owner role & verification management
│
├── docs/
│   ├── AgriChain_Research_Paper.pdf   # IEEE-format research paper (7 pages)
│   ├── smart_contract_design.md       # Contract architecture & logic
│   ├── api_reference.md               # All public function reference
│   └── screenshots/                   # UI screenshots folder
│
├── README.md                  ← You are here
├── requirements.txt           # Node.js / npm dependencies
├── architecture.png           # System architecture diagram
├── demo_video_link.txt        # Link to demo walkthrough video
└── setup_instructions.md     # Full step-by-step local setup guide
```

---

## Setup Instructions

See [`setup_instructions.md`](setup_instructions.md) for the complete step-by-step guide.

**Quick Start (3 terminals):**

```bash
# Terminal 1 — Start local blockchain
npx hardhat node

# Terminal 2 — Deploy contracts
npx hardhat run src/scripts/deploy.js --network localhost

# Terminal 3 — Start frontend
cd src/frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and connect MetaMask.

---

## Smart Contract Lifecycle

```
State  0 │ Produced by Farmer          ← FARMER
State  1 │ For Sale by Farmer          ← FARMER
State  2 │ Purchased by Distributor    ← DISTRIBUTOR  (+Escrow deposit)
State  3 │ Shipped by Farmer           ← FARMER
State  4 │ Received by Distributor     ← DISTRIBUTOR  (Escrow release → Farmer)
State  5 │ Processed by Distributor    ← DISTRIBUTOR
State  6 │ Packaged by Distributor     ← DISTRIBUTOR
State  7 │ For Sale by Distributor     ← DISTRIBUTOR
State  8 │ Purchased by Retailer       ← RETAILER     (+Escrow deposit)
State  9 │ Shipped by Distributor      ← DISTRIBUTOR
State 10 │ Received by Retailer        ← RETAILER     (Escrow release → Distributor)
State 11 │ For Sale by Retailer        ← RETAILER
State 12 │ Purchased by Consumer       ← CONSUMER  ✅  Journey Complete!
```

**Gas Summary (full lifecycle):**

| Transaction | Gas Used |
|-------------|----------|
| produceItemByFarmer() | ~180,000 |
| purchaseItemByDistributor() | ~62,000 |
| shippedItemByFarmer() | ~35,000 |
| receivedItemByDistributor() | ~38,000 |
| **Total (16 transactions)** | **~724,000** |

---

## Research Paper

📄 Full IEEE-format paper available in [`docs/AgriChain_Research_Paper.pdf`](docs/TermPaper_AgriChain.pdf)

**Title:** AgriChain: A Smart Contract-Enabled Blockchain System for Transparent Agricultural Produce Tracking

**Author:** Deepika Shahapur, Department of AI & DS, Alliance University, Karnataka, India

---

## Author

**Deepika Shahapur**
Department of Artificial Intelligence and Data Science
Alliance University, Karnataka, India

---

## License

This project is licensed under the [MIT License](LICENSE).
