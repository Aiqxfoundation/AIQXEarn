import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistribution,
  calculateSlotRecyclingDistribution,
  findEligibleUplineForLevel,
  getTop3DownlineLeaders,
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

test('Mechanism 1: Initial Joining (100 AIQX) - 50 Direct, 30 Indirect, 5 Third, 15 Slot Activation, 0 Treasury', () => {
  const dist = calculateDistribution(WALLET_L1, WALLET_L2, WALLET_L3, TREASURY);
  assert.equal(dist.l1Amount, 50);
  assert.equal(dist.l1Wallet, WALLET_L1);

  assert.equal(dist.l2Amount, 30);
  assert.equal(dist.l2Wallet, WALLET_L2);
  assert.equal(dist.l2IsSystemReserve, false);

  assert.equal(dist.l3Amount, 5);
  assert.equal(dist.l3Wallet, WALLET_L3);
  assert.equal(dist.l3IsSystemReserve, false);

  assert.equal(dist.slotActivationAmount, 15);
  // STRICT RULE: Treasury gets 0 from initial joining!
  assert.equal(dist.treasuryAmount, 0);
  assert.equal(dist.totalAmount, 100);
});

test('Mechanism 1: Initial Joining when upline 2 & 3 missing - Treasury still gets 0 AIQX', () => {
  const dist = calculateDistribution(WALLET_L1, null, null, TREASURY, WALLET_L1);
  assert.equal(dist.l1Amount, 50);
  assert.equal(dist.l1Wallet, WALLET_L1);

  assert.equal(dist.l2Amount, 30);
  assert.equal(dist.l3Amount, 5);
  assert.equal(dist.slotActivationAmount, 15);
  assert.equal(dist.treasuryAmount, 0); // Treasury ALWAYS gets 0 from initial joining!
  assert.equal(dist.totalAmount, 100);
});

test('5-Slot Independent System Math Table Verification', () => {
  assert.equal(MATRIX_LEVELS_CONFIG.length, 5);

  // Slot 1: 3 spots total (2 direct + 1 recycling), Package Fee: 100 AIQX
  const s1 = getMatrixLevelConfig(1);
  assert.equal(s1.slots, 3);
  assert.equal(s1.directSpots, 2);
  assert.equal(s1.recyclingSpots, 1);
  assert.equal(s1.totalPackageFee, 100);

  // Slot 2: 4 spots total (3 direct + 1 recycling), Package Fee: 200 AIQX
  const s2 = getMatrixLevelConfig(2);
  assert.equal(s2.slots, 4);
  assert.equal(s2.directSpots, 3);
  assert.equal(s2.recyclingSpots, 1);
  assert.equal(s2.totalPackageFee, 200);

  // Slot 3: 5 spots total (4 direct + 1 recycling: 3 Top + 2 Bottom), Package Fee: 400 AIQX
  const s3 = getMatrixLevelConfig(3);
  assert.equal(s3.slots, 5);
  assert.equal(s3.directSpots, 4);
  assert.equal(s3.recyclingSpots, 1);
  assert.equal(s3.totalPackageFee, 400);

  // Slot 4: 6 spots total (5 direct + 1 recycling: 2 Top + 4 Bottom), Package Fee: 800 AIQX
  const s4 = getMatrixLevelConfig(4);
  assert.equal(s4.slots, 6);
  assert.equal(s4.directSpots, 5);
  assert.equal(s4.recyclingSpots, 1);
  assert.equal(s4.totalPackageFee, 800);

  // Slot 5: 7 spots total (6 direct + 1 recycling: 4 Top + 3 Bottom), Package Fee: 1,600 AIQX
  const s5 = getMatrixLevelConfig(5);
  assert.equal(s5.slots, 7);
  assert.equal(s5.directSpots, 6);
  assert.equal(s5.recyclingSpots, 1);
  assert.equal(s5.totalPackageFee, 1600);
});

test('Auto Crossover Split: Qualified vs Unqualified Uplines', () => {
  // Scenario: Downline activates Level 5 (1,600 AIQX total package: 240 slot fee + 1,360 commission pool)
  // Upline 1 is Level 3 (unqualified)
  // Upline 2 is Level 5 (qualified)
  // Upline 3 is Level 5 (qualified)
  const dist = calculateMatrixLevelDistribution({
    level: 5,
    payerWallet: WALLET_NEW,
    upline1: { wallet: WALLET_L1, id: 2, activeLevels: [1, 2, 3] },
    upline2: { wallet: WALLET_L2, id: 3, activeLevels: [1, 2, 3, 4, 5] },
    upline3: { wallet: WALLET_L3, id: 4, activeLevels: [1, 2, 3, 4, 5] },
    treasuryWallet: TREASURY,
    rootWallet: 'Root11111111111111111111111111111111111',
  });

  // Strict Treasury rule: Slot fee is strictly 240 AIQX
  assert.equal(dist.slotActivationFee, 240);
  assert.equal(dist.treasuryWallet, TREASURY);

  // Commission pool = 800 + 480 + 80 = 1,360 AIQX
  // Upline 2 gets 30% = 408 AIQX
  const u2 = dist.recipients.find((r) => r.wallet === WALLET_L2);
  assert.ok(u2);
  assert.equal(u2?.amount, 408);

  // Upline 3 gets 20% = 272 AIQX
  const u3 = dist.recipients.find((r) => r.wallet === WALLET_L3);
  assert.ok(u3);
  assert.equal(u3?.amount, 272);

  // Remainder flows to highest qualified sponsor (WALLET_L2)
  const unallocated = dist.recipients.find((r) => r.tier === 'unallocated_reserve');
  assert.ok(unallocated);
  assert.equal(unallocated?.wallet, WALLET_L2);
});

test('Spillover breadth-first placement with 3-wide tree branch capacity', () => {
  const users: UserRecord[] = [
    { wallet: 'W1', id: 1, upline1: null, upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'W2', id: 2, matrixParentId: 1, sponsorId: 1, upline1: 'W1', upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'W3', id: 3, matrixParentId: 1, sponsorId: 1, upline1: 'W1', upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'W4', id: 4, matrixParentId: 1, sponsorId: 1, upline1: 'W1', upline2: null, upline3: null, joinTime: '', joinSignature: '' },
  ];

  // Node 1 has 3 children (Node 2, 3, 4), so next placement spills over under Node 2
  const nextParent = calculateMatrixSpilloverPlacement(1, users);
  assert.equal(nextParent, 2);
});

test('Mechanism 2: Same-Level Slot Recycling (100 AIQX) - 50 to Eligible Upline, 10 to Treasury, 40 to Top 3 Downline Leaders', () => {
  const users: UserRecord[] = [
    { wallet: 'ROOT_WALLET', id: 1, activeLevels: [1, 2, 3, 4, 5], upline1: null, upline2: null, upline3: null, joinTime: '2025-01-01', joinSignature: '' },
    { wallet: 'SPONSOR_UNQUALIFIED', id: 2, activeLevels: [1], upline1: 'ROOT_WALLET', upline2: null, upline3: null, joinTime: '2025-01-02', joinSignature: '' },
    { wallet: 'USER_RECYCLING', id: 3, activeLevels: [1, 2], upline1: 'SPONSOR_UNQUALIFIED', upline2: 'ROOT_WALLET', upline3: null, joinTime: '2025-01-03', joinSignature: '' },
    // User 3 has downline members
    { wallet: 'DOWNLINE_A', id: 4, activeLevels: [1], upline1: 'USER_RECYCLING', upline2: 'SPONSOR_UNQUALIFIED', upline3: 'ROOT_WALLET', joinTime: '2025-01-04', joinSignature: '' },
    { wallet: 'DOWNLINE_B', id: 5, activeLevels: [1], upline1: 'USER_RECYCLING', upline2: 'SPONSOR_UNQUALIFIED', upline3: 'ROOT_WALLET', joinTime: '2025-01-05', joinSignature: '' },
    { wallet: 'DOWNLINE_C', id: 6, activeLevels: [1], upline1: 'USER_RECYCLING', upline2: 'SPONSOR_UNQUALIFIED', upline3: 'ROOT_WALLET', joinTime: '2025-01-06', joinSignature: '' },
    // Downline A brought 2 members (Score = 2)
    { wallet: 'SUB_A1', id: 7, activeLevels: [1], upline1: 'DOWNLINE_A', upline2: 'USER_RECYCLING', upline3: null, joinTime: '2025-01-07', joinSignature: '' },
    { wallet: 'SUB_A2', id: 8, activeLevels: [1], upline1: 'DOWNLINE_A', upline2: 'USER_RECYCLING', upline3: null, joinTime: '2025-01-08', joinSignature: '' },
    // Downline B brought 1 member (Score = 1)
    { wallet: 'SUB_B1', id: 9, activeLevels: [1], upline1: 'DOWNLINE_B', upline2: 'USER_RECYCLING', upline3: null, joinTime: '2025-01-09', joinSignature: '' },
  ];

  // User 3 recycles Level 2 slot
  // Direct sponsor (SPONSOR_UNQUALIFIED) only has Level 1, so Level 2 income CROSSOVERS to ROOT_WALLET
  const recycleDist = calculateSlotRecyclingDistribution({
    level: 2,
    recyclingUserWallet: 'USER_RECYCLING',
    allUsers: users,
    treasuryWallet: TREASURY,
    rootWallet: 'ROOT_WALLET',
  });

  // 1. Eligible Upline: 50 AIQX with crossover to ROOT_WALLET
  assert.equal(recycleDist.eligibleUpline.amount, 50);
  assert.equal(recycleDist.eligibleUpline.wallet, 'ROOT_WALLET');
  assert.equal(recycleDist.eligibleUpline.isCrossover, true);

  // 2. Treasury: 10 AIQX
  assert.equal(recycleDist.treasury.amount, 10);
  assert.equal(recycleDist.treasury.wallet, TREASURY);

  // 3. Top 3 Downline Leaders: 40 AIQX (Rank 1 = 20, Rank 2 = 12, Rank 3 = 8)
  assert.equal(recycleDist.downlineLeaders.length, 3);
  // Downline A has score 2 -> Rank 1 (20 AIQX)
  assert.equal(recycleDist.downlineLeaders[0].wallet, 'DOWNLINE_A');
  assert.equal(recycleDist.downlineLeaders[0].rank, 1);
  assert.equal(recycleDist.downlineLeaders[0].amount, 20);

  // Downline B has score 1 -> Rank 2 (12 AIQX)
  assert.equal(recycleDist.downlineLeaders[1].wallet, 'DOWNLINE_B');
  assert.equal(recycleDist.downlineLeaders[1].rank, 2);
  assert.equal(recycleDist.downlineLeaders[1].amount, 12);

  // Downline C has score 0 -> Rank 3 (8 AIQX)
  assert.equal(recycleDist.downlineLeaders[2].wallet, 'DOWNLINE_C');
  assert.equal(recycleDist.downlineLeaders[2].rank, 3);
  assert.equal(recycleDist.downlineLeaders[2].amount, 8);

  // Total check: 50 + 10 + 20 + 12 + 8 = 100 AIQX
  const leaderTotal = recycleDist.downlineLeaders.reduce((acc, l) => acc + l.amount, 0);
  assert.equal(leaderTotal, 40);
  assert.equal(recycleDist.eligibleUpline.amount + recycleDist.treasury.amount + leaderTotal, 100);
});

test('Crossover Logic: Upward traversal skips unqualified uplines until qualified upline is found', () => {
  const users: UserRecord[] = [
    { wallet: 'ROOT', id: 1, activeLevels: [1, 2, 3, 4], upline1: null, upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'UPLINE_A', id: 2, activeLevels: [1, 2, 3], upline1: 'ROOT', upline2: null, upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'UPLINE_B', id: 3, activeLevels: [1], upline1: 'UPLINE_A', upline2: 'ROOT', upline3: null, joinTime: '', joinSignature: '' },
    { wallet: 'USER_C', id: 4, activeLevels: [1, 2], upline1: 'UPLINE_B', upline2: 'UPLINE_A', upline3: 'ROOT', joinTime: '', joinSignature: '' },
  ];

  // USER_C triggers Level 2 recycling.
  // UPLINE_B only has Level 1 -> skips B
  // UPLINE_A has Level 2 active -> matches UPLINE_A with crossover = true
  const match = findEligibleUplineForLevel('USER_C', 2, users, 'ROOT');
  assert.equal(match.wallet, 'UPLINE_A');
  assert.equal(match.isCrossover, true);

  // USER_C triggers Level 4 recycling.
  // UPLINE_B (Level 1) -> skips
  // UPLINE_A (Level 3 max) -> skips
  // Reaches ROOT (Level 4 active)
  const matchL4 = findEligibleUplineForLevel('USER_C', 4, users, 'ROOT');
  assert.equal(matchL4.wallet, 'ROOT');
  assert.equal(matchL4.isCrossover, true);
});
