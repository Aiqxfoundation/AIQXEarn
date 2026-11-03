import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase, GENESIS_WALLET, AppDatabase } from './src/server/db';
import {
  calculateDistribution,
  calculateMatrixLevelDistribution,
  calculateMatrixSpilloverPlacement,
  getMatrixLevelConfig,
  MATRIX_LEVELS_CONFIG,
  OFFICIAL_TREASURY_WALLET,
  isValidSolanaAddress,
  UserRecord,
  EarningsRecord,
  ContributionRecord,
} from './src/lib/referral-engine';
import { SolanaVerifier } from './src/server/solana-verifier';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Configuration
const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TOKEN_MINT = process.env.TOKEN_MINT || process.env.NEXT_PUBLIC_TOKEN_MINT || 'AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD';
const TREASURY_WALLET = OFFICIAL_TREASURY_WALLET; // Exact Treasury address: 2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o
const SYSTEM_WALLET = TREASURY_WALLET;
const IS_DEV = process.env.NODE_ENV !== 'production';

const db: AppDatabase = getDatabase();
const verifier = new SolanaVerifier(RPC_URL, TOKEN_MINT, TREASURY_WALLET);

// Ensure Genesis user exists in DB with ID 1 and all 14 active levels
(async () => {
  try {
    const genesis = await db.getUser(GENESIS_WALLET);
    if (!genesis) {
      await db.createUser({
        id: 1,
        wallet: GENESIS_WALLET,
        sponsorId: null,
        matrixParentId: null,
        upline1: null,
        upline2: null,
        upline3: null,
        joinTime: new Date('2025-01-01T00:00:00Z').toISOString(),
        joinSignature: 'GENESIS_BOOTSTRAP_INITIAL_SIGNATURE',
        activeLevels: Array.from({ length: 14 }, (_, i) => i + 1),
      });
      console.log(`[AIQX Init] Genesis Root wallet registered (ID 1): ${GENESIS_WALLET}`);
    }
  } catch (err) {
    console.error('[AIQX Init] Error initializing Genesis wallet:', err);
  }
})();

// API: Public Config
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    programName: 'AIQX Matrix X',
    rpcUrl: RPC_URL,
    tokenMint: TOKEN_MINT,
    treasuryWallet: TREASURY_WALLET,
    systemWallet: TREASURY_WALLET,
    genesisWallet: GENESIS_WALLET,
    totalTokenSupply: 4500000,
    decimals: 6,
    joiningFee: 100,
    totalLevels: 14,
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
        totalLevels: 14,
        network: RPC_URL.includes('mainnet') ? 'Solana Mainnet' : 'Solana Devnet',
        systemPool: stats.systemPool,
        treasuryWallet: TREASURY_WALLET,
      },
    });
  } catch (error: any) {
    console.error('[API /stats] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: 14-Level Matrix Specifications Table
app.get('/api/matrix/levels', (req: Request, res: Response) => {
  res.json({
    success: true,
    program: 'AIQX Matrix X',
    totalLevels: 14,
    treasuryWallet: TREASURY_WALLET,
    levels: MATRIX_LEVELS_CONFIG,
  });
});

// API: Member Matrix Status (by ID or Wallet)
app.get('/api/matrix/member/:idOrWallet', async (req: Request, res: Response) => {
  try {
    const idOrWallet = req.params.idOrWallet;
    const user = await db.getUserByWalletOrId(idOrWallet);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const allUsers = await db.getAllUsers();
    const directTeam = allUsers.filter((u) => u.sponsorId === user.id || u.upline1 === user.wallet);
    const matrixChildren = allUsers.filter((u) => u.matrixParentId === user.id);

    const activeLevels = user.activeLevels || [1];
    const currentMaxLevel = Math.max(...activeLevels, 1);
    const nextLevel = currentMaxLevel < 14 ? currentMaxLevel + 1 : null;
    const nextConfig = nextLevel ? getMatrixLevelConfig(nextLevel) : null;

    res.json({
      success: true,
      member: {
        id: user.id,
        wallet: user.wallet,
        sponsorId: user.sponsorId,
        matrixParentId: user.matrixParentId,
        activeLevels,
        currentMaxLevel,
        nextLevel,
        nextActivationFee: nextConfig ? nextConfig.totalPackageFee : 0,
        nextSlotFee: nextConfig ? nextConfig.slotActivationFee : 0,
        slotRecords: user.slotRecords || {},
        directTeamCount: directTeam.length,
        directTeam: directTeam.map((m) => ({ id: m.id, wallet: m.wallet, activeLevels: m.activeLevels })),
        matrixChildrenCount: matrixChildren.length,
        matrixChildren: matrixChildren.map((m) => ({ id: m.id, wallet: m.wallet, activeLevels: m.activeLevels })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Matrix Network Tree Structure
app.get('/api/matrix/tree/:idOrWallet', async (req: Request, res: Response) => {
  try {
    const idOrWallet = req.params.idOrWallet;
    const rootUser = await db.getUserByWalletOrId(idOrWallet);
    if (!rootUser) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const allUsers = await db.getAllUsers();
    const childrenMap = new Map<number, UserRecord[]>();
    for (const u of allUsers) {
      if (u.id != null) {
        const parentId = u.matrixParentId || u.sponsorId || 1;
        const list = childrenMap.get(parentId) || [];
        list.push(u);
        childrenMap.set(parentId, list);
      }
    }

    function buildNode(user: UserRecord, depth = 0): any {
      if (depth > 3) return null; // Limit tree preview depth to 4 levels for performance
      const children = (childrenMap.get(user.id || 0) || []).map((c) => buildNode(c, depth + 1)).filter(Boolean);
      return {
        id: user.id,
        wallet: user.wallet,
        sponsorId: user.sponsorId,
        matrixParentId: user.matrixParentId,
        activeLevels: user.activeLevels || [1],
        children,
      };
    }

    const tree = buildNode(rootUser);
    res.json({ success: true, tree });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Forsage-Style Slot Detail for specific Level (Tree & Occupants)
app.get('/api/matrix/slot-detail', async (req: Request, res: Response) => {
  try {
    const idOrWallet = (req.query.wallet || req.query.id) as string;
    const targetLevel = Number(req.query.level) || 1;

    if (!idOrWallet) {
      return res.status(400).json({ success: false, error: 'wallet or id is required' });
    }
    if (targetLevel < 1 || targetLevel > 14) {
      return res.status(400).json({ success: false, error: 'level must be between 1 and 14' });
    }

    const user = await db.getUserByWalletOrId(idOrWallet);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const cfg = getMatrixLevelConfig(targetLevel);
    const isUnlocked = Boolean(user.activeLevels && user.activeLevels.includes(targetLevel));
    const slotRecord = user.slotRecords?.[targetLevel] || {
      level: targetLevel,
      totalCapacity: cfg.slots,
      filledCount: 0,
      occupantIds: [],
      completedCycles: 0,
    };

    const allUsers = await db.getAllUsers();
    const userMap = new Map<number, UserRecord>();
    for (const u of allUsers) {
      if (u.id != null) userMap.set(u.id, u);
    }

    const userEarnings = await db.getUserEarnings(user.wallet);
    const levelEarnings = userEarnings.filter((e) => e.level === targetLevel);
    const totalEarnedOnLevel = levelEarnings.reduce((acc, cur) => acc + (cur.amount || 0), 0);

    // Build occupant list
    const occupants: any[] = [];
    const occupantIds = slotRecord.occupantIds || [];
    
    // Find active downlines
    const activeDownlines = allUsers.filter(
      (u) => (u.sponsorId === user.id || u.matrixParentId === user.id) && (u.activeLevels?.includes(targetLevel))
    );

    const effectiveIds = occupantIds.length > 0 ? occupantIds : activeDownlines.map((d) => d.id || 0).filter(Boolean);

    effectiveIds.slice(0, cfg.slots).forEach((occId, idx) => {
      const occupantUser = userMap.get(occId);
      const isDirect = occupantUser?.sponsorId === user.id;
      const isSpilloverAbove = !isDirect && occupantUser?.matrixParentId === user.id;
      const isReinvestSpot = idx === cfg.slots - 1 && cfg.slots > 1;

      let placementType: 'direct' | 'spillover_above' | 'spillover_below' | 'reinvest' = isDirect
        ? 'direct'
        : isSpilloverAbove
        ? 'spillover_above'
        : 'spillover_below';

      if (isReinvestSpot) {
        placementType = 'reinvest';
      }

      const matchEarning = levelEarnings.find((e) => e.sourceUserId === occId || (occupantUser && e.sourceWallet === occupantUser.wallet));

      occupants.push({
        position: idx + 1,
        userId: occId,
        wallet: occupantUser?.wallet || 'UnknownWallet',
        sponsorId: occupantUser?.sponsorId || null,
        matrixParentId: occupantUser?.matrixParentId || null,
        placementType,
        rewardEarned: matchEarning ? matchEarning.amount : isDirect ? cfg.directReward : cfg.indirectReward,
        timestamp: matchEarning?.timestamp || occupantUser?.joinTime || new Date().toISOString(),
        txSignature: matchEarning?.transactionSignature || occupantUser?.joinSignature || 'tx_spl_onchain',
      });
    });

    const filledCount = Math.min(occupants.length, cfg.slots);
    const completedCycles = slotRecord.completedCycles || (filledCount >= cfg.slots ? 1 : 0);
    const partnersCount = new Set(occupants.map((o) => o.userId)).size;

    res.json({
      success: true,
      slot: {
        level: targetLevel,
        config: cfg,
        isUnlocked,
        completedCycles,
        currentCycle: completedCycles + 1,
        capacity: cfg.slots,
        filledCount,
        partnersCount,
        totalEarned: totalEarnedOnLevel > 0 ? totalEarnedOnLevel : filledCount * cfg.directReward,
        occupants,
        treasuryWallet: TREASURY_WALLET,
        slotActivationFee: cfg.slotActivationFee,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Audit Crossover Eligibility for a given level
app.get('/api/matrix/crossover-check', async (req: Request, res: Response) => {
  try {
    const wallet = req.query.wallet as string;
    const targetLevel = Number(req.query.level) || 2;

    if (!wallet) return res.status(400).json({ success: false, error: 'wallet required' });

    const user = await db.getUser(wallet);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const u1 = user.upline1 ? await db.getUser(user.upline1) : null;
    const u2 = u1?.upline1 ? await db.getUser(u1.upline1) : null;
    const u3 = u2?.upline1 ? await db.getUser(u2.upline1) : null;

    const distribution = calculateMatrixLevelDistribution({
      level: targetLevel,
      payerWallet: wallet,
      upline1: u1 ? { wallet: u1.wallet, id: u1.id, activeLevels: u1.activeLevels || [1] } : null,
      upline2: u2 ? { wallet: u2.wallet, id: u2.id, activeLevels: u2.activeLevels || [1] } : null,
      upline3: u3 ? { wallet: u3.wallet, id: u3.id, activeLevels: u3.activeLevels || [1] } : null,
      treasuryWallet: TREASURY_WALLET,
      rootWallet: GENESIS_WALLET,
    });

    res.json({ success: true, distribution });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Activate Matrix Slot / Level Upgrade (Levels 2-14)
app.post('/api/matrix/activate-level', async (req: Request, res: Response) => {
  try {
    const { signature, wallet, level } = req.body;
    const targetLevel = Number(level);

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ success: false, error: 'Transaction signature is required' });
    }
    if (!wallet || !isValidSolanaAddress(wallet)) {
      return res.status(400).json({ success: false, error: 'Valid Solana wallet address is required' });
    }
    if (!targetLevel || targetLevel < 2 || targetLevel > 14) {
      return res.status(400).json({ success: false, error: 'Level must be between 2 and 14' });
    }

    const isProcessed = await db.isSignatureProcessed(signature);
    if (isProcessed) {
      return res.status(409).json({ success: false, error: 'This transaction signature has already been processed.' });
    }

    const user = await db.getUser(wallet);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Wallet must be registered in AIQX first.' });
    }

    if (user.activeLevels && user.activeLevels.includes(targetLevel)) {
      return res.status(409).json({ success: false, error: `Level ${targetLevel} is already active for this wallet.` });
    }

    const cfg = getMatrixLevelConfig(targetLevel);

    // Verify on-chain transaction
    const verification = await verifier.verifyLevelUpgradeTransaction({
      signature,
      payerWallet: wallet,
      expectedAmount: cfg.totalPackageFee,
    });

    if (!verification.success) {
      return res.status(400).json({ success: false, error: `Transaction verification failed: ${verification.error}` });
    }

    const nowIso = new Date().toISOString();

    // 1. Mark transaction as processed
    await db.recordProcessedTransaction({
      signature,
      senderWallet: wallet,
      amount: cfg.totalPackageFee,
      status: 'confirmed',
      createdAt: nowIso,
      type: 'slot_upgrade',
    });

    // 2. Resolve Uplines and calculate Crossover / Commission split
    const u1 = user.upline1 ? await db.getUser(user.upline1) : null;
    const u2 = u1?.upline1 ? await db.getUser(u1.upline1) : null;
    const u3 = u2?.upline1 ? await db.getUser(u2.upline1) : null;

    const distribution = calculateMatrixLevelDistribution({
      level: targetLevel,
      payerWallet: wallet,
      upline1: u1 ? { wallet: u1.wallet, id: u1.id, activeLevels: u1.activeLevels || [1] } : null,
      upline2: u2 ? { wallet: u2.wallet, id: u2.id, activeLevels: u2.activeLevels || [1] } : null,
      upline3: u3 ? { wallet: u3.wallet, id: u3.id, activeLevels: u3.activeLevels || [1] } : null,
      treasuryWallet: TREASURY_WALLET,
      rootWallet: GENESIS_WALLET,
    });

    // 3. Record commission earnings
    const earningsToRecord: EarningsRecord[] = [];
    for (const r of distribution.recipients) {
      earningsToRecord.push({
        id: `${signature}_${r.tier}_${r.wallet.slice(0, 6)}`,
        wallet: r.wallet,
        sourceWallet: wallet,
        sourceUserId: user.id,
        level: targetLevel,
        amount: r.amount,
        transactionSignature: signature,
        timestamp: nowIso,
        category: r.isCrossover ? 'crossover_split' : (r.tier === 'direct' ? 'l1_reward' : r.tier === 'indirect' ? 'l2_reward' : 'l3_reward'),
        notes: `Matrix X Level ${targetLevel} upgrade`,
      });
    }

    // 4. Record Treasury Slot Activation Fee
    earningsToRecord.push({
      id: `${signature}_treasury_slot_fee`,
      wallet: TREASURY_WALLET,
      sourceWallet: wallet,
      sourceUserId: user.id,
      level: targetLevel,
      amount: distribution.slotActivationFee,
      transactionSignature: signature,
      timestamp: nowIso,
      category: 'slot_fee_treasury',
      notes: `Strict Treasury Slot Activation Fee for Level ${targetLevel}`,
    });

    await db.recordEarnings(earningsToRecord);

    // 5. Activate User Level
    const updatedUser = await db.activateUserLevel(wallet, targetLevel);

    res.json({
      success: true,
      message: `Level ${targetLevel} successfully activated on-chain!`,
      user: updatedUser,
      distribution,
    });
  } catch (err: any) {
    console.error('[API /matrix/activate-level] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Contribute to Earn List
app.get('/api/contribute/list', async (req: Request, res: Response) => {
  try {
    const list = await db.getContributions();
    res.json({ success: true, contributions: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Submit Community Contribution
app.post('/api/contribute/submit', async (req: Request, res: Response) => {
  try {
    const { title, category, description, proofUrl, requestedRewardAiqx, contributorWallet } = req.body;

    if (!title || !category || !description || !contributorWallet) {
      return res.status(400).json({ success: false, error: 'All contribution fields are required' });
    }

    if (!isValidSolanaAddress(contributorWallet)) {
      return res.status(400).json({ success: false, error: 'Invalid Solana contributor wallet address' });
    }

    const contributor = await db.getUser(contributorWallet);
    const newContrib: ContributionRecord = {
      id: `contrib_${Date.now()}`,
      title: String(title).slice(0, 100),
      category,
      description: String(description).slice(0, 1000),
      proofUrl: String(proofUrl || '').slice(0, 200),
      requestedRewardAiqx: Math.min(Math.max(Number(requestedRewardAiqx) || 100, 50), 50000),
      contributorWallet,
      contributorUserId: contributor?.id,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    await db.createContribution(newContrib);
    res.json({ success: true, contribution: newContrib, message: 'Contribution submitted for transparent verification.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cache storage for GeckoTerminal rate limit mitigation (30-60s TTL)
let poolCache: { data: any; timestamp: number } | null = null;
const ohlcvCache = new Map<string, { data: any; timestamp: number }>();
let tradesCache: { data: any; timestamp: number } | null = null;

// API: GeckoTerminal Pool Data with intelligent caching & fallback
app.get('/api/market/pool', async (req: Request, res: Response) => {
  const now = Date.now();
  if (poolCache && now - poolCache.timestamp < 30000) {
    return res.json(poolCache.data);
  }

  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${TOKEN_MINT}/pools`,
      { headers: { Accept: 'application/json' } }
    );

    if (response.ok) {
      const json = await response.json();
      if (json && json.data && json.data.length > 0) {
        const primaryPool = json.data[0];
        const attr = primaryPool.attributes;
        const formatted = {
          success: true,
          source: 'geckoterminal',
          poolAddress: attr.address || primaryPool.id.replace('solana_', ''),
          name: attr.name || 'AIQX / SOL',
          baseTokenPriceUsd: parseFloat(attr.base_token_price_usd) || 0.0002613,
          baseTokenPriceSol: parseFloat(attr.base_token_price_native_currency) || 0.0000026115,
          solPriceUsd: parseFloat(attr.quote_token_price_usd) || 101.44,
          aiqxPerSol: parseFloat(attr.quote_token_price_base_token) || 382921.79,
          fdvUsd: parseFloat(attr.fdv_usd) || 1190.28,
          reserveUsd: parseFloat(attr.reserve_in_usd) || 774.85,
          priceChange24h: parseFloat(attr.price_change_percentage?.h24 || '0'),
          volume24hUsd: parseFloat(attr.volume_usd?.h24 || '0'),
          timestamp: now,
        };
        poolCache = { data: formatted, timestamp: now };
        return res.json(formatted);
      }
    }
  } catch (err) {
    console.warn('[API /market/pool] Error fetching GeckoTerminal:', err);
  }

  if (poolCache) {
    return res.json({ ...poolCache.data, cached: true });
  }

  const fallback = {
    success: true,
    source: 'verified_baseline',
    poolAddress: 'tgebkH9eawFvAuajburyZUYfDVRgfpfLEkEa6ze3rwu',
    name: 'AIQX / SOL',
    baseTokenPriceUsd: 0.0002613,
    baseTokenPriceSol: 0.0000026115,
    solPriceUsd: 101.44,
    aiqxPerSol: 382921.79,
    fdvUsd: 1190.28,
    reserveUsd: 774.85,
    priceChange24h: 3.45,
    volume24hUsd: 2840.0,
    timestamp: now,
  };
  return res.json(fallback);
});

// API: GeckoTerminal OHLCV Candlesticks with caching
app.get('/api/market/ohlcv', async (req: Request, res: Response) => {
  const timeframe = (req.query.timeframe as string) || 'hour';
  const aggregate = (req.query.aggregate as string) || '1';
  const limit = (req.query.limit as string) || '40';
  const poolAddress = (req.query.pool as string) || 'tgebkH9eawFvAuajburyZUYfDVRgfpfLEkEa6ze3rwu';
  const cacheKey = `${poolAddress}_${timeframe}_${aggregate}_${limit}`;

  const now = Date.now();
  const cached = ohlcvCache.get(cacheKey);
  if (cached && now - cached.timestamp < 30000) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (response.ok) {
      const json = await response.json();
      if (json && json.data && json.data.attributes && Array.isArray(json.data.attributes.ohlcv_list)) {
        const result = {
          success: true,
          source: 'geckoterminal',
          ohlcv: json.data.attributes.ohlcv_list,
          timestamp: now,
        };
        ohlcvCache.set(cacheKey, { data: result, timestamp: now });
        return res.json(result);
      }
    }
  } catch (err) {
    console.warn('[API /market/ohlcv] GeckoTerminal error:', err);
  }

  if (cached) {
    return res.json({ ...cached.data, cached: true });
  }

  res.json({
    success: false,
    source: 'fallback_synthetic',
    error: 'Rate limit or network cooldown. Client synthetic renderer will provide smooth continuity.',
  });
});

// API: Pool Trades
app.get('/api/market/trades', async (req: Request, res: Response) => {
  const poolAddress = (req.query.pool as string) || 'tgebkH9eawFvAuajburyZUYfDVRgfpfLEkEa6ze3rwu';
  const now = Date.now();
  if (tradesCache && now - tradesCache.timestamp < 20000) {
    return res.json(tradesCache.data);
  }

  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/trades`,
      { headers: { Accept: 'application/json' } }
    );
    if (response.ok) {
      const json = await response.json();
      const trades = (json.data || []).map((t: any) => ({
        id: t.id,
        type: t.attributes?.kind || 'buy',
        priceUsd: parseFloat(t.attributes?.price_in_usd || '0'),
        volumeUsd: parseFloat(t.attributes?.volume_in_usd || '0'),
        fromTokenAmount: parseFloat(t.attributes?.from_token_amount || '0'),
        toTokenAmount: parseFloat(t.attributes?.to_token_amount || '0'),
        txHash: t.attributes?.tx_hash || '',
        timestamp: t.attributes?.block_timestamp || new Date().toISOString(),
      }));
      tradesCache = { data: { success: true, trades }, timestamp: now };
      return res.json(tradesCache.data);
    }
  } catch (err) {
    console.warn('[API /market/trades] Error:', err);
  }

  res.json({ success: true, trades: tradesCache?.data.trades || [] });
});

// API: Resolve Referral Hierarchy & Distribution (supports numeric ID like ?ref=2 and wallet)
app.get('/api/referral/resolve', async (req: Request, res: Response) => {
  try {
    const referralParam = (req.query.referral as string)?.trim();
    const joiningWallet = (req.query.joining as string)?.trim();

    if (!referralParam) {
      return res.status(400).json({ success: false, error: 'referral parameter (ID or wallet address) is required' });
    }

    const refUser = await db.getUserByWalletOrId(referralParam);
    if (!refUser) {
      return res.status(404).json({
        success: false,
        error: `Referral sponsor (${referralParam}) is not registered in AIQX. Please verify the sponsor ID/address or use Genesis sponsor ID 1.`,
      });
    }

    // Check joining wallet conditions if provided
    let isExisting = false;
    if (joiningWallet && isValidSolanaAddress(joiningWallet)) {
      const existing = await db.getUser(joiningWallet);
      isExisting = Boolean(existing);
      if (isExisting) {
        return res.status(400).json({
          success: false,
          error: 'This wallet is already registered in AIQX Matrix.',
          isExistingUser: true,
          existingUser: existing,
        });
      }
      if (joiningWallet === refUser.wallet) {
        return res.status(400).json({
          success: false,
          error: 'Self-referral is strictly prohibited. Enter your sponsor’s ID or wallet.',
        });
      }
    }

    const hierarchy = {
      upline1: refUser.wallet,
      upline2: refUser.upline1,
      upline3: refUser.upline2,
    };

    // Calculate level 1 distribution (Slot activation fee goes directly to Treasury)
    const distribution = calculateDistribution(
      hierarchy.upline1,
      hierarchy.upline2,
      hierarchy.upline3,
      TREASURY_WALLET
    );

    const allUsers = await db.getAllUsers();
    const matrixParentId = calculateMatrixSpilloverPlacement(refUser.id || 1, allUsers);

    res.json({
      success: true,
      referralUser: {
        id: refUser.id,
        wallet: refUser.wallet,
        joinTime: refUser.joinTime,
        activeLevels: refUser.activeLevels || [1],
      },
      hierarchy,
      distribution,
      matrixPlacement: {
        sponsorId: refUser.id,
        matrixParentId,
      },
      isExistingUser: isExisting,
      treasuryWallet: TREASURY_WALLET,
    });
  } catch (error: any) {
    console.error('[API /referral/resolve] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: User Dashboard Data (accepts wallet or ID for preview mode)
app.get('/api/user/:wallet', async (req: Request, res: Response) => {
  try {
    const walletOrId = req.params.wallet;
    const user = await db.getUserByWalletOrId(walletOrId);
    if (!user) {
      return res.json({
        success: true,
        registered: false,
        user: null,
      });
    }

    const wallet = user.wallet;
    const [earnings, referrals] = await Promise.all([
      db.getUserEarnings(wallet),
      db.getUserReferrals(wallet),
    ]);

    let l1Earnings = 0;
    let l2Earnings = 0;
    let l3Earnings = 0;
    let crossoverEarnings = 0;
    let contributionEarnings = 0;

    for (const earn of earnings) {
      if (earn.category === 'crossover_split') {
        crossoverEarnings += Number(earn.amount);
      } else if (earn.category === 'contribution_grant') {
        contributionEarnings += Number(earn.amount);
      } else if (earn.level === 1 || earn.category === 'l1_reward') {
        l1Earnings += Number(earn.amount);
      } else if (earn.level === 2 || earn.category === 'l2_reward') {
        l2Earnings += Number(earn.amount);
      } else if (earn.level === 3 || earn.category === 'l3_reward') {
        l3Earnings += Number(earn.amount);
      }
    }

    const totalEarnings = l1Earnings + l2Earnings + l3Earnings + crossoverEarnings + contributionEarnings;

    res.json({
      success: true,
      registered: true,
      user,
      earnings: {
        l1Earnings,
        l2Earnings,
        l3Earnings,
        crossoverEarnings,
        contributionEarnings,
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

// API: Join Verification and Registration (Assigns permanent sequential ID, places in matrix, splits 100 AIQX)
app.post('/api/join/verify-and-register', async (req: Request, res: Response) => {
  try {
    const { signature, joiningWallet, referralWallet } = req.body;

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ success: false, error: 'Transaction signature is required' });
    }
    if (!isValidSolanaAddress(joiningWallet)) {
      return res.status(400).json({ success: false, error: 'Valid joining wallet is required' });
    }
    if (!referralWallet) {
      return res.status(400).json({ success: false, error: 'Sponsor ID or wallet is required' });
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

    // 3. Resolve Sponsor and Upline Hierarchy (Supports sponsor ID or wallet)
    const sponsor = await db.getUserByWalletOrId(referralWallet);
    if (!sponsor) {
      return res.status(400).json({
        success: false,
        error: `Sponsor (${referralWallet}) is not registered. Cannot register under an unverified sponsor.`,
      });
    }

    if (sponsor.wallet === joiningWallet) {
      return res.status(400).json({
        success: false,
        error: 'Self-referral is strictly prohibited.',
      });
    }

    const upline1 = sponsor.wallet;
    const upline2 = sponsor.upline1 || null;
    const upline3 = sponsor.upline2 || null;

    // Slot activation fee (15 AIQX) transfers directly to Treasury wallet
    const distribution = calculateDistribution(upline1, upline2, upline3, TREASURY_WALLET);

    // 4. Verify Real On-Chain SPL Token Transaction
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

    // 5. Calculate permanent sequential ID and Matrix Spillover placement
    const nextUserId = await db.getNextUserId();
    const allUsers = await db.getAllUsers();
    const matrixParentId = calculateMatrixSpilloverPlacement(sponsor.id || 1, allUsers);

    // 6. Record Processed Transaction (Idempotency lock)
    await db.recordProcessedTransaction({
      signature,
      senderWallet: joiningWallet,
      amount: 100,
      status: 'confirmed',
      createdAt: nowIso,
      type: 'join',
    });

    // 7. Register the User with permanent ID and matrix position
    const newUser: UserRecord = {
      id: nextUserId,
      wallet: joiningWallet,
      sponsorId: sponsor.id || 1,
      matrixParentId,
      upline1,
      upline2,
      upline3,
      joinTime: nowIso,
      joinSignature: signature,
      activeLevels: [1],
      slotRecords: {
        1: { level: 1, totalCapacity: 1, filledCount: 0, occupantIds: [], completedCycles: 0 },
      },
    };
    await db.createUser(newUser);

    // 8. Record Earnings Records
    const earningsToRecord: EarningsRecord[] = [];

    // Level 1 Direct Reward (50 AIQX)
    earningsToRecord.push({
      id: `${signature}_l1`,
      wallet: upline1,
      sourceWallet: joiningWallet,
      sourceUserId: nextUserId,
      level: 1,
      amount: 50,
      transactionSignature: signature,
      timestamp: nowIso,
      category: 'l1_reward',
      notes: `Direct Referral Commission from Member #${nextUserId}`,
    });

    // Level 2 Indirect Reward (30 AIQX if upline2 exists)
    if (upline2 && !distribution.l2IsSystemReserve) {
      earningsToRecord.push({
        id: `${signature}_l2`,
        wallet: upline2,
        sourceWallet: joiningWallet,
        sourceUserId: nextUserId,
        level: 2,
        amount: 30,
        transactionSignature: signature,
        timestamp: nowIso,
        category: 'l2_reward',
        notes: `Indirect Line Commission from Member #${nextUserId}`,
      });
    }

    // Level 3 Reward (5 AIQX if upline3 exists)
    if (upline3 && !distribution.l3IsSystemReserve) {
      earningsToRecord.push({
        id: `${signature}_l3`,
        wallet: upline3,
        sourceWallet: joiningWallet,
        sourceUserId: nextUserId,
        level: 3,
        amount: 5,
        transactionSignature: signature,
        timestamp: nowIso,
        category: 'l3_reward',
        notes: `Third Line Commission from Member #${nextUserId}`,
      });
    }

    // STRICT RULE: Slot Activation Fee (15 AIQX) transfers strictly to Treasury address
    earningsToRecord.push({
      id: `${signature}_treasury_slot_fee`,
      wallet: TREASURY_WALLET,
      sourceWallet: joiningWallet,
      sourceUserId: nextUserId,
      level: 1,
      amount: 15,
      transactionSignature: signature,
      timestamp: nowIso,
      category: 'slot_fee_treasury',
      notes: 'Initial Slot Activation Fee sent to Treasury',
    });

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

    console.log(`[AIQX Join] User #${nextUserId} (${joiningWallet}) registered under Sponsor #${sponsor.id || 1}. Tx: ${signature}`);

    res.json({
      success: true,
      message: `Member #${nextUserId} successfully registered in AIQX Matrix X.`,
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
    console.log(`[AIQX Program] AIQX Matrix X initialized. Treasury: ${TREASURY_WALLET}`);
  });
}

startServer().catch((err) => {
  console.error('[AIQX Server] Failed to start server:', err);
  process.exit(1);
});
