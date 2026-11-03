import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistribution,
  calculateMatrixLevelDistribution,
  calculateMatrixSpilloverPlacement,
  getMatrixLevelConfig,
  MATRIX_LEVELS_CONFIG,
  OFFICIAL_TREASURY_WALLET,
  resolveUplineHierarchy,
  validateRegistrationPreconditions,
  isValidSolanaAddress,
  UserRecord,
} from './referral-engine';

const SYS_WALLET = 'Sys999999999999999999999999999999999999999';
const TREASURY = OFFICIAL_TREASURY_WALLET;
const WALLET_L1 = 'User11111111111111111111111111111111111111';
const WALLET_L2 = 'User22222222222222222222222222222222222222';
const WALLET_L3 = 'User33333333333333333333333333333333333333';
const WALLET_NEW = 'User44444444444444444444444444444444444444';

test('validates valid and invalid Solana addresses correctly', () => {
  assert.equal(isValidSolanaAddress(SYS_WALLET), true);
  assert.equal(isValidSolanaAddress(TREASURY), true);
  assert.equal(isValidSolanaAddress('short'), false);
  assert.equal(isValidSolanaAddress('0OIl'), false); // contains non-base58 0, O, I, l
  assert.equal(isValidSolanaAddress(''), false);
  assert.equal(isValidSolanaAddress(null), false);
});

test('Scenario 1: Full referral chain (L1, L2, L3 all exist)', () => {
  const dist = calculateDistribution(WALLET_L1, WALLET_L2, WALLET_L3, TREASURY);
  assert.equal(dist.l1Amount, 50);
  assert.equal(dist.l1Wallet, WALLET_L1);

  assert.equal(dist.l2Amount, 30);
  assert.equal(dist.l2Wallet, WALLET_L2);
  assert.equal(dist.l2IsSystemReserve, false);

  assert.equal(dist.l3Amount, 5);
  assert.equal(dist.l3Wallet, WALLET_L3);
  assert.equal(dist.l3IsSystemReserve, false);

  assert.equal(dist.systemBaseAmount, 15);
  assert.equal(dist.totalSystemAmount, 15);
  assert.equal(dist.totalAmount, 100);
});

test('Scenario 2: Only L1 exists, L2 and L3 missing -> Treasury gets 50 AIQX', () => {
  const dist = calculateDistribution(WALLET_L1, null, null, TREASURY);
  assert.equal(dist.l1Amount, 50);
  assert.equal(dist.l1Wallet, WALLET_L1);

  assert.equal(dist.l2Amount, 30);
  assert.equal(dist.l2Wallet, TREASURY);
  assert.equal(dist.l2IsSystemReserve, true);

  assert.equal(dist.l3Amount, 5);
  assert.equal(dist.l3Wallet, TREASURY);
  assert.equal(dist.l3IsSystemReserve, true);

  assert.equal(dist.totalSystemAmount, 50); // 15 base + 30 L2 reserve + 5 L3 reserve
  assert.equal(dist.totalAmount, 100);
});

test('14-Level Doubling Matrix Math Table Verification', () => {
  assert.equal(MATRIX_LEVELS_CONFIG.length, 14);

  // L1: 1 slot, Direct: 50, Indirect: 30, 3rd: 5, Slot Fee: 15, Total: 100
  const l1 = getMatrixLevelConfig(1);
  assert.equal(l1.slots, 1);
  assert.equal(l1.directReward, 50);
  assert.equal(l1.indirectReward, 30);
  assert.equal(l1.thirdLineReward, 5);
  assert.equal(l1.slotActivationFee, 15);
  assert.equal(l1.totalPackageFee, 100);

  // L2: 2 slots, Direct: 100, Indirect: 60, 3rd: 10, Slot Fee: 30, Total: 200
  const l2 = getMatrixLevelConfig(2);
  assert.equal(l2.slots, 2);
  assert.equal(l2.directReward, 100);
  assert.equal(l2.indirectReward, 60);
  assert.equal(l2.thirdLineReward, 10);
  assert.equal(l2.slotActivationFee, 30);
  assert.equal(l2.totalPackageFee, 200);

  // L14: 8,192 slots, Direct: 409,600, Indirect: 245,760, 3rd: 40,960, Slot Fee: 122,880, Total: 819,200
  const l14 = getMatrixLevelConfig(14);
  assert.equal(l14.slots, 8192);
  assert.equal(l14.directReward, 409600);
  assert.equal(l14.indirectReward, 245760);
  assert.equal(l14.thirdLineReward, 40960);
  assert.equal(l14.slotActivationFee, 122880);
  assert.equal(l14.totalPackageFee, 819200);
});

test('Auto Crossover Split: Qualified vs Unqualified Uplines', () => {
  // Scenario: Downline activates Level 6 (3,200 AIQX total package: 480 slot fee + 2,720 commission pool)
  // Upline 1 is Level 3 (unqualified)
  // Upline 2 is Level 6 (qualified)
  // Upline 3 is Level 6 (qualified)
  const dist = calculateMatrixLevelDistribution({
    level: 6,
    payerWallet: WALLET_NEW,
    upline1: { wallet: WALLET_L1, id: 2, activeLevels: [1, 2, 3] },
    upline2: { wallet: WALLET_L2, id: 3, activeLevels: [1, 2, 3, 4, 5, 6] },
    upline3: { wallet: WALLET_L3, id: 4, activeLevels: [1, 2, 3, 4, 5, 6] },
    treasuryWallet: TREASURY,
    rootWallet: 'Root11111111111111111111111111111111111',
  });

  // Strict Treasury rule: Slot fee is strictly 480 AIQX
  assert.equal(dist.slotActivationFee, 480);
  assert.equal(dist.treasuryWallet, TREASURY);

  // Commission pool = 1600 + 960 + 160 = 2,720 AIQX
  // Upline 2 gets 30% = 816 AIQX
  const u2 = dist.recipients.find((r) => r.wallet === WALLET_L2);
  assert.ok(u2);
  assert.equal(u2?.amount, 816);

  // Upline 3 gets 20% = 544 AIQX
  const u3 = dist.recipients.find((r) => r.wallet === WALLET_L3);
  assert.ok(u3);
  assert.equal(u3?.amount, 544);

  // Remainder flows to highest qualified sponsor (WALLET_L2)
  const unallocated = dist.recipients.find((r) => r.tier === 'unallocated_reserve');
  assert.ok(unallocated);
  assert.equal(unallocated?.wallet, WALLET_L2);
});

test('Spillover breadth-first placement', () => {
  const users: UserRecord[] = [
    { wallet: 'W1', id: 1, upline1: null, upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'W2', id: 2, matrixParentId: 1, sponsorId: 1, upline1: 'W1', upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'W3', id: 3, matrixParentId: 1, sponsorId: 1, upline1: 'W1', upline2: null, upline3: null, joinTime: '', joinSignature: '' },
  ];

  // Node 1 has 2 children (Node 2 and Node 3), next placement must spill over under Node 2
  const nextParent = calculateMatrixSpilloverPlacement(1, users);
  assert.equal(nextParent, 2);
});
