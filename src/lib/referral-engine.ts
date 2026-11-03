/**
 * AIQX Foundation Matrix X & Referral Engine
 * Complete 14-Level Doubling Matrix, Permanent Sequential ID Network,
 * Spillover placement, Auto Crossover Split, and Treasury Slot Accounting.
 */

export const OFFICIAL_TREASURY_WALLET = '2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o';
export const GENESIS_ROOT_WALLET = 'AiqxRoot11111111111111111111111111111111111';

export interface MatrixLevelConfig {
  level: number;
  slots: number;
  directReward: number;      // 50 * 2^(level-1)
  indirectReward: number;    // 30 * 2^(level-1)
  thirdLineReward: number;   // 5 * 2^(level-1)
  slotActivationFee: number; // 15 * 2^(level-1) -> STRICTLY to Treasury
  totalPackageFee: number;   // 100 * 2^(level-1)
}

/**
 * 14-Level Doubling Matrix Specification Table
 */
export const MATRIX_LEVELS_CONFIG: MatrixLevelConfig[] = [
  { level: 1,  slots: 1,    directReward: 50,     indirectReward: 30,     thirdLineReward: 5,     slotActivationFee: 15,     totalPackageFee: 100 },
  { level: 2,  slots: 2,    directReward: 100,    indirectReward: 60,     thirdLineReward: 10,    slotActivationFee: 30,     totalPackageFee: 200 },
  { level: 3,  slots: 4,    directReward: 200,    indirectReward: 120,    thirdLineReward: 20,    slotActivationFee: 60,     totalPackageFee: 400 },
  { level: 4,  slots: 8,    directReward: 400,    indirectReward: 240,    thirdLineReward: 40,    slotActivationFee: 120,    totalPackageFee: 800 },
  { level: 5,  slots: 16,   directReward: 800,    indirectReward: 480,    thirdLineReward: 80,    slotActivationFee: 240,    totalPackageFee: 1600 },
  { level: 6,  slots: 32,   directReward: 1600,   indirectReward: 960,    thirdLineReward: 160,   slotActivationFee: 480,    totalPackageFee: 3200 },
  { level: 7,  slots: 64,   directReward: 3200,   indirectReward: 1920,   thirdLineReward: 320,   slotActivationFee: 960,    totalPackageFee: 6400 },
  { level: 8,  slots: 128,  directReward: 6400,   indirectReward: 3840,   thirdLineReward: 640,   slotActivationFee: 1920,   totalPackageFee: 12800 },
  { level: 9,  slots: 256,  directReward: 12800,  indirectReward: 7680,   thirdLineReward: 1280,  slotActivationFee: 3840,   totalPackageFee: 25600 },
  { level: 10, slots: 512,  directReward: 25600,  indirectReward: 15360,  thirdLineReward: 2560,  slotActivationFee: 7680,   totalPackageFee: 51200 },
  { level: 11, slots: 1024, directReward: 51200,  indirectReward: 30720,  thirdLineReward: 5120,  slotActivationFee: 15360,  totalPackageFee: 102400 },
  { level: 12, slots: 2048, directReward: 102400, indirectReward: 61440,  thirdLineReward: 10240, slotActivationFee: 30720,  totalPackageFee: 204800 },
  { level: 13, slots: 4096, directReward: 204800, indirectReward: 122880, thirdLineReward: 20480, slotActivationFee: 61440,  totalPackageFee: 409600 },
  { level: 14, slots: 8192, directReward: 409600, indirectReward: 245760, thirdLineReward: 40960, slotActivationFee: 122880, totalPackageFee: 819200 },
];

export function getMatrixLevelConfig(level: number): MatrixLevelConfig {
  const cfg = MATRIX_LEVELS_CONFIG.find((l) => l.level === level);
  if (!cfg) {
    throw new Error(`Invalid Matrix level: ${level}. Supported levels are 1 through 14.`);
  }
  return cfg;
}

export interface SlotTracking {
  level: number;
  totalCapacity: number;
  filledCount: number;
  occupantIds: number[];
  completedCycles: number;
}

export interface UserRecord {
  id?: number;                  // Sequential permanent user ID (1, 2, 3...)
  wallet: string;
  sponsorId?: number | null;    // Permanent Sponsor ID (who invited them)
  matrixParentId?: number | null;// Matrix placement parent ID for spillover
  upline1: string | null;       // Sponsor wallet
  upline2: string | null;       // 2nd line sponsor wallet
  upline3: string | null;       // 3rd line sponsor wallet
  joinTime: string;
  joinSignature: string;
  activeLevels?: number[];      // Levels activated (e.g. [1], [1, 2, 3])
  slotRecords?: Record<number, SlotTracking>; // Slots per level
  directReferralsCount?: number;
  totalTeamCount?: number;
}

export interface ReferralDistribution {
  l1Wallet: string;
  l1Amount: number; // Direct reward
  l2Wallet: string; // L2 wallet or system/treasury
  l2Amount: number; // Indirect reward
  l2IsSystemReserve: boolean;
  l3Wallet: string; // L3 wallet or system/treasury
  l3Amount: number; // 3rd line reward
  l3IsSystemReserve: boolean;
  systemWallet: string;
  systemBaseAmount: number; // 15 AIQX slot activation fee to Treasury
  totalSystemAmount: number;
  totalAmount: number; // 100 AIQX for level 1
}

export interface LevelUpgradeDistribution {
  level: number;
  payerWallet: string;
  totalAmount: number;
  treasuryWallet: string;
  slotActivationFee: number;
  recipients: Array<{
    wallet: string;
    userId?: number;
    tier: 'direct' | 'indirect' | 'third_line' | 'crossover_split' | 'unallocated_reserve';
    amount: number;
    percentage?: number;
    isCrossover: boolean;
  }>;
}

export interface EarningsRecord {
  id: string;
  wallet: string;           // Recipient wallet
  sourceWallet: string;     // Paying downline
  sourceUserId?: number;
  level: number;            // 1 through 14, or 0 for pool
  amount: number;
  transactionSignature: string;
  timestamp: string;
  category:
    | 'l1_reward'
    | 'l2_reward'
    | 'l3_reward'
    | 'slot_fee_treasury'
    | 'crossover_split'
    | 'contribution_grant'
    | 'system_fixed'
    | 'system_l2_reserve'
    | 'system_l3_reserve';
  notes?: string;
}

export interface SystemPoolBreakdown {
  totalSystemPool: number;
  fixedAdminAllocation: number; // Sum of 15 AIQX allocations
  level2Reserve: number;        // Sum of unallocated L2
  level3Reserve: number;        // Sum of unallocated L3
  totalTreasurySlotFees?: number;
}

export interface ContributionRecord {
  id: string;
  title: string;
  category:
    | 'Smart Contract Development'
    | 'Frontend Development'
    | 'Bug Reporting'
    | 'Security Research'
    | 'Documentation & Guides'
    | 'Community Education'
    | 'Ecosystem Adoption'
    | 'Verified Technical Contributions';
  contributorWallet: string;
  contributorUserId?: number;
  description: string;
  proofUrl: string;
  requestedRewardAiqx: number;
  grantedRewardAiqx?: number;
  status: 'submitted' | 'under_review' | 'verified' | 'rewarded' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  transactionSignature?: string;
}

export const JOINING_FEE_AIQX = 100;
export const L1_ALLOCATION_AIQX = 50;
export const L2_ALLOCATION_AIQX = 30;
export const L3_ALLOCATION_AIQX = 5;
export const SYSTEM_FIXED_ALLOCATION_AIQX = 15;

/**
 * Validates a Solana Base58 public key format
 */
export function isValidSolanaAddress(address: string | undefined | null): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(trimmed);
}

/**
 * Calculates Level 1 Distribution (Backwards compatible with 100 AIQX join)
 */
export function calculateDistribution(
  l1Wallet: string,
  l2Wallet: string | null | undefined,
  l3Wallet: string | null | undefined,
  systemWallet: string
): ReferralDistribution {
  if (!isValidSolanaAddress(l1Wallet)) {
    throw new Error('Valid Level 1 referral wallet address is required');
  }
  if (!isValidSolanaAddress(systemWallet)) {
    throw new Error('Valid System wallet address is required');
  }

  const hasL2 = Boolean(l2Wallet && isValidSolanaAddress(l2Wallet) && l2Wallet !== systemWallet && l2Wallet !== l1Wallet);
  const hasL3 = Boolean(l3Wallet && isValidSolanaAddress(l3Wallet) && l3Wallet !== systemWallet && l3Wallet !== l1Wallet && l3Wallet !== l2Wallet);

  const l1Amount = L1_ALLOCATION_AIQX;
  const l2Amount = L2_ALLOCATION_AIQX;
  const l3Amount = L3_ALLOCATION_AIQX;
  const systemBaseAmount = SYSTEM_FIXED_ALLOCATION_AIQX;

  const targetL2Wallet = hasL2 ? (l2Wallet as string) : systemWallet;
  const targetL3Wallet = hasL3 ? (l3Wallet as string) : systemWallet;

  let totalSystemAmount = systemBaseAmount;
  if (!hasL2) totalSystemAmount += l2Amount;
  if (!hasL3) totalSystemAmount += l3Amount;

  const totalAmount = l1Amount + (hasL2 ? l2Amount : 0) + (hasL3 ? l3Amount : 0) + totalSystemAmount;

  if (totalAmount !== JOINING_FEE_AIQX) {
    throw new Error(`Integrity error: Total distribution (${totalAmount}) does not match joining fee (${JOINING_FEE_AIQX})`);
  }

  return {
    l1Wallet,
    l1Amount,
    l2Wallet: targetL2Wallet,
    l2Amount,
    l2IsSystemReserve: !hasL2,
    l3Wallet: targetL3Wallet,
    l3Amount,
    l3IsSystemReserve: !hasL3,
    systemWallet,
    systemBaseAmount,
    totalSystemAmount,
    totalAmount,
  };
}

/**
 * Calculates distribution for any of the 14 Matrix Levels, accounting for
 * active level qualification and automatic crossover commission splits.
 *
 * STRICT RULE: Treasury receives ONLY slot activation fees.
 * No referral commissions or crossover commissions are sent to Treasury.
 */
export function calculateMatrixLevelDistribution(params: {
  level: number;
  payerWallet: string;
  upline1: { wallet: string; id?: number; activeLevels: number[] } | null;
  upline2: { wallet: string; id?: number; activeLevels: number[] } | null;
  upline3: { wallet: string; id?: number; activeLevels: number[] } | null;
  treasuryWallet: string;
  rootWallet: string;
}): LevelUpgradeDistribution {
  const { level, payerWallet, upline1, upline2, upline3, treasuryWallet, rootWallet } = params;
  const cfg = getMatrixLevelConfig(level);

  const slotActivationFee = cfg.slotActivationFee;
  const commissionPool = cfg.directReward + cfg.indirectReward + cfg.thirdLineReward;

  const u1Qualified = Boolean(upline1 && upline1.activeLevels.includes(level));
  const u2Qualified = Boolean(upline2 && upline2.activeLevels.includes(level));
  const u3Qualified = Boolean(upline3 && upline3.activeLevels.includes(level));

  const recipients: LevelUpgradeDistribution['recipients'] = [];

  // If all active uplines are qualified for this level, standard distribution applies
  if (u1Qualified && u2Qualified && u3Qualified) {
    recipients.push({
      wallet: upline1!.wallet,
      userId: upline1?.id,
      tier: 'direct',
      amount: cfg.directReward,
      isCrossover: false,
    });
    recipients.push({
      wallet: upline2!.wallet,
      userId: upline2?.id,
      tier: 'indirect',
      amount: cfg.indirectReward,
      isCrossover: false,
    });
    recipients.push({
      wallet: upline3!.wallet,
      userId: upline3?.id,
      tier: 'third_line',
      amount: cfg.thirdLineReward,
      isCrossover: false,
    });
  } else {
    // AUTO CROSSOVER & COMMISSION SPLIT (Section 8 of Master Specification):
    // Recipient shares: Upline 1: 40%, Upline 2: 30%, Upline 3: 20%, Unallocated Reserve: 10%
    const shares = [
      { upline: upline1, qualified: u1Qualified, pct: 0.40, label: 'direct' as const },
      { upline: upline2, qualified: u2Qualified, pct: 0.30, label: 'indirect' as const },
      { upline: upline3, qualified: u3Qualified, pct: 0.20, label: 'third_line' as const },
    ];

    let allocatedCommission = 0;
    const qualifiedEligibleUplines: Array<{ wallet: string; id?: number; share: number; pct: number }> = [];

    for (const item of shares) {
      if (item.upline && item.qualified) {
        const amt = Math.floor(commissionPool * item.pct);
        allocatedCommission += amt;
        recipients.push({
          wallet: item.upline.wallet,
          userId: item.upline.id,
          tier: 'crossover_split',
          amount: amt,
          percentage: item.pct * 100,
          isCrossover: true,
        });
        qualifiedEligibleUplines.push({ wallet: item.upline.wallet, id: item.upline.id, share: amt, pct: item.pct });
      }
    }

    // Unallocated commission flows to the highest qualified sponsor or community root sponsor
    const remainder = commissionPool - allocatedCommission;
    if (remainder > 0) {
      const fallbackTarget = qualifiedEligibleUplines.length > 0 ? qualifiedEligibleUplines[0].wallet : rootWallet;
      const fallbackId = qualifiedEligibleUplines.length > 0 ? qualifiedEligibleUplines[0].id : 1;
      recipients.push({
        wallet: fallbackTarget,
        userId: fallbackId,
        tier: 'unallocated_reserve',
        amount: remainder,
        percentage: (remainder / commissionPool) * 100,
        isCrossover: true,
      });
    }
  }

  // Integrity Check: Every slot activation fee transfers directly to Treasury wallet
  return {
    level,
    payerWallet,
    totalAmount: cfg.totalPackageFee,
    treasuryWallet,
    slotActivationFee,
    recipients,
  };
}

/**
 * Resolves the 3-level upline hierarchy given a direct referrer and a lookup function.
 */
export function resolveUplineHierarchy(
  directReferrerWallet: string,
  getUser: (wallet: string) => UserRecord | undefined | null
): { upline1: string; upline2: string | null; upline3: string | null } {
  const l1User = getUser(directReferrerWallet);
  if (!l1User) {
    throw new Error(`Referral wallet ${directReferrerWallet} is not registered`);
  }

  const upline1 = l1User.wallet;
  const upline2 = l1User.upline1 || null;
  const upline3 = l1User.upline2 || null;

  return { upline1, upline2, upline3 };
}

/**
 * Computes next placement in the doubling matrix tree (automatic spillover algorithm).
 * Breadth-first search for next open child position under sponsor.
 */
export function calculateMatrixSpilloverPlacement(
  sponsorId: number,
  allUsers: UserRecord[]
): number {
  if (allUsers.length === 0) return 1;

  // Build children map by matrixParentId
  const childrenMap = new Map<number, number[]>();
  for (const u of allUsers) {
    if (u.id != null) {
      const parent = u.matrixParentId || u.sponsorId || 1;
      const current = childrenMap.get(parent) || [];
      current.push(u.id);
      childrenMap.set(parent, current);
    }
  }

  // Breadth-First Search from sponsorId
  const queue: number[] = [sponsorId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = childrenMap.get(currentId) || [];
    // Binary matrix branch capacity per node is 2
    if (children.length < 2) {
      return currentId;
    }

    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push(childId);
      }
    }
  }

  return sponsorId;
}

/**
 * Validates registration preconditions
 */
export function validateRegistrationPreconditions(params: {
  joiningWallet: string;
  referralWallet: string;
  isExistingUser: boolean;
  systemWallet: string;
}): { valid: boolean; error?: string } {
  const { joiningWallet, referralWallet, isExistingUser, systemWallet } = params;

  if (!isValidSolanaAddress(joiningWallet)) {
    return { valid: false, error: 'Invalid joining wallet address format' };
  }
  if (!isValidSolanaAddress(referralWallet)) {
    return { valid: false, error: 'Invalid referral wallet address format' };
  }
  if (joiningWallet === referralWallet) {
    return { valid: false, error: 'Self-referral is strictly prohibited' };
  }
  if (isExistingUser) {
    return { valid: false, error: 'This wallet is already registered in AIQX' };
  }
  if (joiningWallet === systemWallet) {
    return { valid: false, error: 'System wallet cannot be registered as a standard participant' };
  }

  return { valid: true };
}
