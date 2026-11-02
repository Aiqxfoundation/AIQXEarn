import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase, GENESIS_WALLET, AppDatabase } from './src/server/db';
import {
  calculateDistribution,
  resolveUplineHierarchy,
  validateRegistrationPreconditions,
  isValidSolanaAddress,
  UserRecord,
  EarningsRecord,
} from './src/lib/referral-engine';
import { SolanaVerifier } from './src/server/solana-verifier';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Configuration
const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
const TOKEN_MINT = process.env.TOKEN_MINT || process.env.NEXT_PUBLIC_TOKEN_MINT || 'AiqxMint11111111111111111111111111111111111';
const SYSTEM_WALLET = process.env.SYSTEM_WALLET || process.env.NEXT_PUBLIC_SYSTEM_WALLET || 'SysAiqx111111111111111111111111111111111111';
const IS_DEV = process.env.NODE_ENV !== 'production';

const db: AppDatabase = getDatabase();
const verifier = new SolanaVerifier(RPC_URL, TOKEN_MINT, SYSTEM_WALLET);

// Ensure Genesis user exists in DB
(async () => {
  try {
    const genesis = await db.getUser(GENESIS_WALLET);
    if (!genesis) {
      await db.createUser({
        wallet: GENESIS_WALLET,
        upline1: null,
        upline2: null,
        upline3: null,
        joinTime: new Date('2025-01-01T00:00:00Z').toISOString(),
        joinSignature: 'GENESIS_BOOTSTRAP_INITIAL_SIGNATURE',
      });
      console.log(`[AIQX Init] Genesis wallet registered: ${GENESIS_WALLET}`);
    }
  } catch (err) {
    console.error('[AIQX Init] Error initializing Genesis wallet:', err);
  }
})();

// API: Public Config
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    rpcUrl: RPC_URL,
    tokenMint: TOKEN_MINT,
    systemWallet: SYSTEM_WALLET,
    genesisWallet: GENESIS_WALLET,
    totalTokenSupply: 4500000,
    decimals: 6,
    joiningFee: 100,
    network: RPC_URL.includes('mainnet') ? 'mainnet-beta' : 'devnet',
  });
});

// API: Global Platform Stats
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await db.getGlobalStats();
    res.json({
      success: true,
      stats: {
        totalRegisteredUsers: stats.totalUsers,
        totalAiqxDistributed: stats.totalDistributed,
        totalSupply: 4500000,
        network: RPC_URL.includes('mainnet') ? 'Solana Mainnet' : 'Solana Devnet',
        systemPool: stats.systemPool,
      },
    });
  } catch (error: any) {
    console.error('[API /stats] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Resolve Referral Hierarchy & Distribution
app.get('/api/referral/resolve', async (req: Request, res: Response) => {
  try {
    const referralWallet = req.query.referral as string;
    const joiningWallet = req.query.joining as string;

    if (!referralWallet) {
      return res.status(400).json({ success: false, error: 'referral wallet query param is required' });
    }

    if (!isValidSolanaAddress(referralWallet)) {
      return res.status(400).json({ success: false, error: 'Invalid Solana address format for referral' });
    }

    const refUser = await db.getUser(referralWallet);
    if (!refUser) {
      return res.status(404).json({
        success: false,
        error: `Referral wallet (${referralWallet}) is not registered in AIQX. Please verify the address or use the community Genesis sponsor.`,
      });
    }

    // Check joining wallet conditions if provided
    let isExisting = false;
    if (joiningWallet && isValidSolanaAddress(joiningWallet)) {
      const existing = await db.getUser(joiningWallet);
      isExisting = Boolean(existing);

      const check = validateRegistrationPreconditions({
        joiningWallet,
        referralWallet,
        isExistingUser: isExisting,
        systemWallet: SYSTEM_WALLET,
      });

      if (!check.valid) {
        return res.status(400).json({ success: false, error: check.error, isExistingUser: isExisting });
      }
    }

    const hierarchy = {
      upline1: refUser.wallet,
      upline2: refUser.upline1,
      upline3: refUser.upline2,
    };

    const distribution = calculateDistribution(
      hierarchy.upline1,
      hierarchy.upline2,
      hierarchy.upline3,
      SYSTEM_WALLET
    );

    res.json({
      success: true,
      referralUser: {
        wallet: refUser.wallet,
        joinTime: refUser.joinTime,
      },
      hierarchy,
      distribution,
      isExistingUser: isExisting,
    });
  } catch (error: any) {
    console.error('[API /referral/resolve] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: User Dashboard Data
app.get('/api/user/:wallet', async (req: Request, res: Response) => {
  try {
    const wallet = req.params.wallet;
    if (!isValidSolanaAddress(wallet)) {
      return res.status(400).json({ success: false, error: 'Invalid Solana wallet address' });
    }

    const user = await db.getUser(wallet);
    if (!user) {
      return res.json({
        success: true,
        registered: false,
        user: null,
      });
    }

    const [earnings, referrals] = await Promise.all([
      db.getUserEarnings(wallet),
      db.getUserReferrals(wallet),
    ]);

    let l1Earnings = 0;
    let l2Earnings = 0;
    let l3Earnings = 0;

    for (const earn of earnings) {
      if (earn.level === 1) l1Earnings += Number(earn.amount);
      if (earn.level === 2) l2Earnings += Number(earn.amount);
      if (earn.level === 3) l3Earnings += Number(earn.amount);
    }

    const totalEarnings = l1Earnings + l2Earnings + l3Earnings;

    res.json({
      success: true,
      registered: true,
      user,
      earnings: {
        l1Earnings,
        l2Earnings,
        l3Earnings,
        totalEarnings,
        history: earnings,
      },
      referrals: {
        l1Count: referrals.l1.length,
        l2Count: referrals.l2.length,
        l3Count: referrals.l3.length,
        totalNetworkCount: referrals.l1.length + referrals.l2.length + referrals.l3.length,
        tree: referrals,
      },
    });
  } catch (error: any) {
    console.error('[API /user/:wallet] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Join Verification and Registration
app.post('/api/join/verify-and-register', async (req: Request, res: Response) => {
  try {
    const { signature, joiningWallet, referralWallet } = req.body;

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ success: false, error: 'Transaction signature is required' });
    }
    if (!isValidSolanaAddress(joiningWallet)) {
      return res.status(400).json({ success: false, error: 'Valid joining wallet is required' });
    }
    if (!isValidSolanaAddress(referralWallet)) {
      return res.status(400).json({ success: false, error: 'Valid referral wallet is required' });
    }

    // 1. Prevent duplicate transaction processing (Idempotency)
    const isProcessed = await db.isSignatureProcessed(signature);
    if (isProcessed) {
      return res.status(409).json({
        success: false,
        error: 'This transaction signature has already been processed and registered.',
      });
    }

    // 2. Prevent duplicate user registration
    const existingUser = await db.getUser(joiningWallet);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'This wallet is already registered in the AIQX platform.',
      });
    }

    // 3. Validate Preconditions
    const preCheck = validateRegistrationPreconditions({
      joiningWallet,
      referralWallet,
      isExistingUser: false,
      systemWallet: SYSTEM_WALLET,
    });
    if (!preCheck.valid) {
      return res.status(400).json({ success: false, error: preCheck.error });
    }

    // 4. Resolve Sponsor and Upline Hierarchy
    const sponsor = await db.getUser(referralWallet);
    if (!sponsor) {
      return res.status(400).json({
        success: false,
        error: `Referral wallet ${referralWallet} is not registered. Cannot register under an unverified sponsor.`,
      });
    }

    const upline1 = sponsor.wallet;
    const upline2 = sponsor.upline1 || null;
    const upline3 = sponsor.upline2 || null;

    const distribution = calculateDistribution(upline1, upline2, upline3, SYSTEM_WALLET);

    // 5. Verify Real On-Chain SPL Token Transaction
    const verification = await verifier.verifyJoiningTransaction({
      signature,
      joiningWallet,
      expectedDistribution: distribution,
    });

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: `Transaction verification failed: ${verification.error}`,
      });
    }

    const nowIso = new Date().toISOString();

    // 6. Record Processed Transaction (Idempotency lock)
    await db.recordProcessedTransaction({
      signature,
      senderWallet: joiningWallet,
      amount: 100,
      status: 'confirmed',
      createdAt: nowIso,
    });

    // 7. Register the User
    const newUser: UserRecord = {
      wallet: joiningWallet,
      upline1,
      upline2,
      upline3,
      joinTime: nowIso,
      joinSignature: signature,
    };
    await db.createUser(newUser);

    // 8. Record Earnings Records
    const earningsToRecord: EarningsRecord[] = [];

    // Level 1 Reward (50 AIQX)
    earningsToRecord.push({
      id: `${signature}_l1`,
      wallet: upline1,
      sourceWallet: joiningWallet,
      level: 1,
      amount: 50,
      transactionSignature: signature,
      timestamp: nowIso,
      category: 'l1_reward',
    });

    // Level 2 Reward (30 AIQX if upline2 exists)
    if (upline2 && !distribution.l2IsSystemReserve) {
      earningsToRecord.push({
        id: `${signature}_l2`,
        wallet: upline2,
        sourceWallet: joiningWallet,
        level: 2,
        amount: 30,
        transactionSignature: signature,
        timestamp: nowIso,
        category: 'l2_reward',
      });
    }

    // Level 3 Reward (5 AIQX if upline3 exists)
    if (upline3 && !distribution.l3IsSystemReserve) {
      earningsToRecord.push({
        id: `${signature}_l3`,
        wallet: upline3,
        sourceWallet: joiningWallet,
        level: 3,
        amount: 5,
        transactionSignature: signature,
        timestamp: nowIso,
        category: 'l3_reward',
      });
    }

    await db.recordEarnings(earningsToRecord);

    // 9. Update System Pool Accounting
    const l2Reserve = distribution.l2IsSystemReserve ? 30 : 0;
    const l3Reserve = distribution.l3IsSystemReserve ? 5 : 0;
    const totalSystemPoolCredit = 15 + l2Reserve + l3Reserve;

    await db.recordSystemPool({
      id: `${signature}_pool`,
      sourceWallet: joiningWallet,
      fixedAmount: 15,
      l2ReserveAmount: l2Reserve,
      l3ReserveAmount: l3Reserve,
      totalAmount: totalSystemPoolCredit,
      transactionSignature: signature,
      timestamp: nowIso,
    });

    console.log(`[AIQX Join] User ${joiningWallet} successfully registered with upline ${upline1}. Tx: ${signature}`);

    res.json({
      success: true,
      message: 'User successfully registered and rewards recorded.',
      user: newUser,
      distribution,
    });
  } catch (error: any) {
    console.error('[API /join/verify-and-register] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal registration error' });
  }
});

// Full-stack Vite dev middleware integration
async function startServer() {
  if (IS_DEV) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AIQX Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AIQX Server] Failed to start server:', err);
  process.exit(1);
});
