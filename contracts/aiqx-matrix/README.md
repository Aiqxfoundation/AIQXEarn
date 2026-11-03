# AIQX Foundation Matrix Program (AIQX Matrix X)
## 100% On-Chain, Fully Decentralized, 14-Level Doubling Matrix

### Overview
AIQX Matrix X is an institutional-grade, fully decentralized smart contract program built in **Rust** using the **Anchor Framework** on the **Solana** blockchain.

- **Token**: AIQX SPL Token (6 Decimals, Fixed 4,500,000 Total Supply)
- **Official Mint**: `AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD`
- **Official Treasury Wallet**: `2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o`
- **Initial Joining Fee**: 100 AIQX (Level 1)
- **Total Levels**: 14 Doubling Levels

---

### Strict Treasury Rule
- **STRICT RULE**: The Treasury wallet (`2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o`) receives **ONLY slot activation fees**.
- **ZERO COMMISSIONS TO TREASURY**: No direct, indirect, third-line, or crossover commissions may be diverted to the Treasury. Every slot activation fee transfers directly to this address.

---

### 14-Level Doubling Matrix Compensation Matrix

| Level | Slots Capacity | Direct (50%) | Indirect (30%) | Third Line (5%) | Slot Fee (Treasury 15%) | Total Package (AIQX) |
|---|---|---|---|---|---|---|
| **L1** | 1 | 50 | 30 | 5 | 15 | **100** |
| **L2** | 2 | 100 | 60 | 10 | 30 | **200** |
| **L3** | 4 | 200 | 120 | 20 | 60 | **400** |
| **L4** | 8 | 400 | 240 | 40 | 120 | **800** |
| **L5** | 16 | 800 | 480 | 80 | 240 | **1,600** |
| **L6** | 32 | 1,600 | 960 | 160 | 480 | **3,200** |
| **L7** | 64 | 3,200 | 1,920 | 320 | 960 | **6,400** |
| **L8** | 128 | 6,400 | 3,840 | 640 | 1,920 | **12,800** |
| **L9** | 256 | 12,800 | 7,680 | 1,280 | 3,840 | **25,600** |
| **L10** | 512 | 25,600 | 15,360 | 2,560 | 7,680 | **51,200** |
| **L11** | 1,024 | 51,200 | 30,720 | 5,120 | 15,360 | **102,400** |
| **L12** | 2,048 | 102,400 | 61,440 | 10,240 | 30,720 | **204,800** |
| **L13** | 4,096 | 204,800 | 122,880 | 20,480 | 61,440 | **409,600** |
| **L14** | 8,192 | 409,600 | 245,760 | 40,960 | 122,880 | **819,200** |

---

### Permanent Sequential ID System
- First member = **ID 1 (ROOT)**.
- Second member = **ID 2 under ID 1**.
- Third member = **ID 3**.
- Every member receives a permanent sequential ID that is immutable and never reused.
- Referral URL format: `https://yourdomain.com/?ref=2` or `/join?ref=2`.

---

### Auto Crossover & Commission Split
When a downline activates a higher level than their upline:
1. Upline 1 (if active for that level) receives **40%**.
2. Upline 2 (if active) receives **30%**.
3. Upline 3 (if active) receives **20%**.
4. Unallocated Reserve (**10%**) flows to the highest active qualified sponsor.

---

### Mainnet Deployment Instructions
1. Configure deployer keypair with sufficient SOL (~2.5 SOL for program buffer rent):
   ```bash
   solana config set --url https://api.mainnet-beta.solana.com
   ```
2. Build verified binary:
   ```bash
   anchor build --verifiable
   ```
3. Deploy to Solana Mainnet:
   ```bash
   bash scripts/deploy-mainnet.sh
   ```
