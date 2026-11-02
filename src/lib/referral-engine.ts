/**
 * AIQX Referral & Distribution Engine
 * Pure logic for 3-level referral resolution, allocation splitting, and validation.
 */

export interface ReferralDistribution {
  l1Wallet: string;
  l1Amount: number; // 50 AIQX
  l2Wallet: string; // L2 wallet or systemWallet if not available
  l2Amount: number; // 30 AIQX
  l2IsSystemReserve: boolean;
  l3Wallet: string; // L3 wallet or systemWallet if not available
  l3Amount: number; // 5 AIQX
  l3IsSystemReserve: boolean;
  systemWallet: string;
  systemBaseAmount: number; // 15 AIQX
  totalSystemAmount: number; // 15 + (missing L2 ? 30 : 0) + (missing L3 ? 5 : 0)
  totalAmount: number; // 100 AIQX
}

export interface UserRecord {
  wallet: string;
  upline1: string | null;
  upline2: string | null;
  upline3: string | null;
  joinTime: string;
  joinSignature: string;
}

export interface EarningsRecord {
  id: string;
  wallet: string; // Recipient wallet
  sourceWallet: string; // Registered user who paid
  level: 1 | 2 | 3 | 0; // 0 for System Pool
  amount: number;
  transactionSignature: string;
  timestamp: string;
  category: 'l1_reward' | 'l2_reward' | 'l3_reward' | 'system_fixed' | 'system_l2_reserve' | 'system_l3_reserve';
}

export interface SystemPoolBreakdown {
  totalSystemPool: number;
  fixedAdminAllocation: number; // Sum of 15 AIQX allocations
  level2Reserve: number; // Sum of missing L2 allocations (30 each)
  level3Reserve: number; // Sum of missing L3 allocations (5 each)
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
  // Solana Base58 public keys are between 32 and 44 characters, base58 encoded
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(trimmed);
}

/**
 * Calculates the exact 3-level distribution of the 100 AIQX joining fee.
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
 * Validates registration preconditions to prevent self-referrals, loops, and duplicate registrations.
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
