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
  slotActivationFee: number; // 15 * 2^(level-1)
  totalPackageFee: number;   // 100 * 2^(level-1)
}

/**
 * 14-Level Doubling Matrix Specification Table
 * Capacity doubles at each level: L1=1, L2=2, L3=4, L4=8 ... L14=8192
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
  id?: number;                  // Sequential permanent user ID (1 = Root, 2 = 2nd member...)
  wallet: string;
  sponsorId?: number | null;    // Permanent Sponsor ID (who invited them)
  matrixParentId?: number | null;// Matrix placement parent ID for spillover
  upline1: string | null;       // Sponsor wallet
  upline2: string | null;       // 2nd line sponsor wallet
  upline3: string | null;       // 3rd line sponsor wallet
  joinTime: string;
  joinSignature: string;
  activeLevels?: number[];      // Levels activated (e.g. [1], [1, 2])
  slotRecords?: Record<number, SlotTracking>; // Slots per level
  directReferralsCount?: number;
  totalTeamCount?: number;
}

/**
 * MECHANISM 1: Initial Joining (100 AIQX)
 * - 50 AIQX Direct Referral
 * - 30 AIQX Indirect Referral
 * - 5 AIQX Third Line
 * - 15 AIQX Slot Activation
 * - Treasury gets 0 AIQX. Fixed for all new entries.
 */
export interface ReferralDistribution {
  l1Wallet: string;
  l1Amount: number; // 50 AIQX
  l2Wallet: string; // 30 AIQX or root/reserve
  l2Amount: number;
  l2IsSystemReserve: boolean;
  l3Wallet: string; // 5 AIQX or root/reserve
  l3Amount: number;
  l3IsSystemReserve: boolean;
  slotActivationAmount: number; // 15 AIQX
  treasuryAmount: number;       // 0 AIQX (Treasury receives ZERO from initial joining)
  treasuryWallet: string;
  totalAmount: number;          // 100 AIQX
}

/**
 * MECHANISM 2: Same-Level Recycling (100 AIQX)
 * - Trigger: When an existing slot completes, it opens a NEW slot of the SAME LEVEL
 * - 50 AIQX to Eligible Upline (nearest qualified upline with same level active)
 * - 10 AIQX to Treasury wallet (2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o)
 * - 40 AIQX to Top 3 Leaders in user's OWN downline (Rank 1: 20, Rank 2: 12, Rank 3: 8)
 */
export interface SlotRecycleDistribution {
  level: number;
  recyclingUserWallet: string;
  recyclingUserId?: number;
  totalRecycleFee: number; // 100 AIQX
  // a) 50 AIQX to Eligible Upline
  eligibleUpline: {
    wallet: string;
    userId?: number;
    amount: number; // 50 AIQX
    isCrossover: boolean;
  };
  // b) 10 AIQX to Treasury wallet
  treasury: {
    wallet: string;
    amount: number; // 10 AIQX
  };
  // c) 40 AIQX to Top 3 Leaders in user's downline
  downlineLeaders: Array<{
    rank: 1 | 2 | 3;
    wallet: string;
    userId?: number;
    teamCount: number;
    percentage: number; // 50%, 30%, 20%
    amount: number;     // 20, 12, 8 AIQX
    isFallback?: boolean;
  }>;
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
  sourceWallet: string;     // Paying member
  sourceUserId?: number;
  level: number;            // 1 through 14
  amount: number;
  transactionSignature: string;
  timestamp: string;
  category:
    | 'l1_reward'            // Direct 50 AIQX
    | 'l2_reward'            // Indirect 30 AIQX
    | 'l3_reward'            // Third Line 5 AIQX
    | 'crossover_split'      // Upward Crossover to qualified upline
    | 'upline_recycle'       // 50 AIQX from downline same-level slot recycling
    | 'downline_leader_reward'// 20, 12, or 8 AIQX from upline slot recycling pool
    | 'slot_fee_treasury'    // Treasury 10 AIQX from slot recycling
    | 'contribution_grant'   // Community contribution reward
    | 'system_fixed';
  notes?: string;
}

export interface SystemPoolBreakdown {
  totalSystemPool: number;
  fixedAdminAllocation: number;
  level2Reserve: number;
  level3Reserve: number;
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
export const SLOT_ACTIVATION_FEE_AIQX = 15;
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
 * Calculates Level 1 Initial Joining Distribution (100 AIQX)
 * - 50 AIQX Direct Referral (Upline 1)
 * - 30 AIQX Indirect Referral (Upline 2)
 * - 5 AIQX Third Line (Upline 3)
 * - 15 AIQX Slot Activation (Member's Level 1 Slot Activation Reserve)
 * - Treasury gets 0 AIQX. Fixed for all new entries.
 */
export function calculateDistribution(
  l1Wallet: string,
  l2Wallet: string | null | undefined,
  l3Wallet: string | null | undefined,
  treasuryWallet: string = OFFICIAL_TREASURY_WALLET,
  rootWallet: string = GENESIS_ROOT_WALLET
): ReferralDistribution {
  if (!isValidSolanaAddress(l1Wallet)) {
    throw new Error('Valid Level 1 referral wallet address is required');
  }

  const hasL2 = Boolean(l2Wallet && isValidSolanaAddress(l2Wallet) && l2Wallet !== treasuryWallet && l2Wallet !== l1Wallet);
  const hasL3 = Boolean(l3Wallet && isValidSolanaAddress(l3Wallet) && l3Wallet !== treasuryWallet && l3Wallet !== l1Wallet && l3Wallet !== l2Wallet);

  const l1Amount = L1_ALLOCATION_AIQX; // 50
  const l2Amount = L2_ALLOCATION_AIQX; // 30
  const l3Amount = L3_ALLOCATION_AIQX; // 5
  const slotActivationAmount = SLOT_ACTIVATION_FEE_AIQX; // 15

  // If Upline 2 or 3 is missing, reward routes to Root Sponsor / active upline, NEVER Treasury
  const targetL2Wallet = hasL2 ? (l2Wallet as string) : (isValidSolanaAddress(rootWallet) ? rootWallet : l1Wallet);
  const targetL3Wallet = hasL3 ? (l3Wallet as string) : (isValidSolanaAddress(rootWallet) ? rootWallet : l1Wallet);

  const totalAmount = l1Amount + l2Amount + l3Amount + slotActivationAmount;
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
    slotActivationAmount,
    treasuryAmount: 0, // STRICT: Treasury receives 0 from initial joining
    treasuryWallet,
    totalAmount,
  };
}

/**
 * Traverses upward step-by-step through the sponsor chain to find the nearest
 * qualified upline who has the target level open.
 * "Amount goes upward until it finds qualified upline. Upline must open that level to earn."
 */
export function findEligibleUplineForLevel(
  userWallet: string,
  targetLevel: number,
  allUsers: UserRecord[],
  rootWallet: string = GENESIS_ROOT_WALLET
): { wallet: string; userId?: number; isCrossover: boolean } {
  const userMap = new Map<string, UserRecord>();
  const idMap = new Map<number, UserRecord>();
  for (const u of allUsers) {
    userMap.set(u.wallet, u);
    if (u.id != null) idMap.set(u.id, u);
  }

  const currentUser = userMap.get(userWallet);
  if (!currentUser) {
    return { wallet: rootWallet, userId: 1, isCrossover: false };
  }

  // First step: direct sponsor
  let currentUplineWallet = currentUser.upline1;
  let isCrossover = false;

  while (currentUplineWallet) {
    const uplineUser = userMap.get(currentUplineWallet);
    if (!uplineUser) break;

    const isQualified = Boolean(uplineUser.activeLevels && uplineUser.activeLevels.includes(targetLevel));
    if (isQualified) {
      return {
        wallet: uplineUser.wallet,
        userId: uplineUser.id,
        isCrossover,
      };
    }

    // Unqualified! Income crossovers and moves upward to next sponsor in chain
    isCrossover = true;
    currentUplineWallet = uplineUser.upline1 || null;
  }

  // If no upline up the hierarchy has this level open, reaches Genesis Root
  return {
    wallet: rootWallet,
    userId: 1,
    isCrossover: true,
  };
}

/**
 * Picks Top 3 leaders from user's OWN downline:
 * - Score = Total members in their 3 lines. More members = higher rank.
 * - Distribution: Rank 1 = 50% (20 AIQX), Rank 2 = 30% (12 AIQX), Rank 3 = 20% (8 AIQX)
 * - Fallback: If 3 lines are incomplete, reward goes to active users in downline bringing members.
 *   No AIQX is burned. Exactly 3 allocations summing to 40 AIQX.
 */
export function getTop3DownlineLeaders(
  userWallet: string,
  allUsers: UserRecord[],
  fallbackWallet: string = GENESIS_ROOT_WALLET
): Array<{
  rank: 1 | 2 | 3;
  wallet: string;
  userId?: number;
  teamCount: number;
  percentage: number;
  amount: number;
  isFallback?: boolean;
}> {
  // 1. Identify members in user's downline (L1, L2, L3)
  const direct = allUsers.filter((u) => u.upline1 === userWallet);
  const indirect = allUsers.filter((u) => u.upline2 === userWallet);
  const thirdLine = allUsers.filter((u) => u.upline3 === userWallet);

  const downlineMembersMap = new Map<string, UserRecord>();
  for (const m of [...direct, ...indirect, ...thirdLine]) {
    if (m.wallet !== userWallet) {
      downlineMembersMap.set(m.wallet, m);
    }
  }

  const downlineList = Array.from(downlineMembersMap.values());

  // 2. Score each downline member by total members in their 3 lines
  const scoredMembers = downlineList.map((m) => {
    const mDirect = allUsers.filter((u) => u.upline1 === m.wallet).length;
    const mIndirect = allUsers.filter((u) => u.upline2 === m.wallet).length;
    const mThird = allUsers.filter((u) => u.upline3 === m.wallet).length;
    const score = mDirect + mIndirect + mThird;
    return {
      user: m,
      score,
    };
  });

  // Sort by score descending, then by earlier join time
  scoredMembers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.user.id || 999999) - (b.user.id || 999999);
  });

  const top3: Array<{
    rank: 1 | 2 | 3;
    wallet: string;
    userId?: number;
    teamCount: number;
    percentage: number;
    amount: number;
    isFallback?: boolean;
  }> = [];

  const rankSpecs: Array<{ rank: 1 | 2 | 3; percentage: number; amount: number }> = [
    { rank: 1, percentage: 50, amount: 20 },
    { rank: 2, percentage: 30, amount: 12 },
    { rank: 3, percentage: 20, amount: 8 },
  ];

  for (let i = 0; i < 3; i++) {
    const spec = rankSpecs[i];
    if (i < scoredMembers.length) {
      const item = scoredMembers[i];
      top3.push({
        rank: spec.rank,
        wallet: item.user.wallet,
        userId: item.user.id,
        teamCount: item.score,
        percentage: spec.percentage,
        amount: spec.amount,
        isFallback: false,
      });
    } else {
      // Fallback: If 3 lines are incomplete, reward goes to available active member or fallback wallet
      // No AIQX is burned!
      const fallbackTarget = scoredMembers.length > 0 ? scoredMembers[0] : null;
      top3.push({
        rank: spec.rank,
        wallet: fallbackTarget ? fallbackTarget.user.wallet : fallbackWallet,
        userId: fallbackTarget ? fallbackTarget.user.id : 1,
        teamCount: fallbackTarget ? fallbackTarget.score : 0,
        percentage: spec.percentage,
        amount: spec.amount,
        isFallback: true,
      });
    }
  }

  return top3;
}

/**
 * Calculates Same-Level Slot Recycling Distribution (100 AIQX)
 * Trigger: When an existing slot completes, it is marked completed and a NEW slot of the SAME LEVEL opens
 * a) 50 AIQX to Eligible Upline (nearest qualified upline with same level active via crossover)
 * b) 10 AIQX to Treasury wallet (2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o)
 * c) 40 AIQX to Top 3 Leaders in user's OWN downline (20, 12, 8 AIQX)
 */
export function calculateSlotRecyclingDistribution(params: {
  level: number;
  recyclingUserWallet: string;
  allUsers: UserRecord[];
  treasuryWallet?: string;
  rootWallet?: string;
}): SlotRecycleDistribution {
  const {
    level,
    recyclingUserWallet,
    allUsers,
    treasuryWallet = OFFICIAL_TREASURY_WALLET,
    rootWallet = GENESIS_ROOT_WALLET,
  } = params;

  const user = allUsers.find((u) => u.wallet === recyclingUserWallet);

  // a) Find Eligible Upline with crossover upward search
  const eligibleUpline = findEligibleUplineForLevel(recyclingUserWallet, level, allUsers, rootWallet);

  // b) Top 3 Leaders in user's own downline
  const downlineLeaders = getTop3DownlineLeaders(recyclingUserWallet, allUsers, rootWallet);

  // Total check: 50 + 10 + 20 + 12 + 8 = 100
  return {
    level,
    recyclingUserWallet,
    recyclingUserId: user?.id,
    totalRecycleFee: 100,
    eligibleUpline: {
      wallet: eligibleUpline.wallet,
      userId: eligibleUpline.userId,
      amount: 50,
      isCrossover: eligibleUpline.isCrossover,
    },
    treasury: {
      wallet: treasuryWallet,
      amount: 10,
    },
    downlineLeaders,
  };
}

/**
 * Calculates distribution for Manual Level Upgrade (Levels 2-14)
 * with upward crossover to qualified uplines.
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
    // Upward crossover: qualified uplines receive their tier rewards,
    // unqualified shares crossover to the qualified upline or root
    const shares = [
      { upline: upline1, qualified: u1Qualified, pct: 0.50, label: 'direct' as const },
      { upline: upline2, qualified: u2Qualified, pct: 0.30, label: 'indirect' as const },
      { upline: upline3, qualified: u3Qualified, pct: 0.20, label: 'third_line' as const },
    ];

    let allocatedCommission = 0;
    const qualifiedEligibleUplines: Array<{ wallet: string; id?: number; share: number }> = [];

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
        qualifiedEligibleUplines.push({ wallet: item.upline.wallet, id: item.upline.id, share: amt });
      }
    }

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
