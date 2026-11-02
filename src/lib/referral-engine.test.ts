import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistribution,
  resolveUplineHierarchy,
  validateRegistrationPreconditions,
  isValidSolanaAddress,
  UserRecord,
} from './referral-engine';

const SYS_WALLET = 'Sys999999999999999999999999999999999999999';
const WALLET_L1 = 'User11111111111111111111111111111111111111';
const WALLET_L2 = 'User22222222222222222222222222222222222222';
const WALLET_L3 = 'User33333333333333333333333333333333333333';
const WALLET_NEW = 'User44444444444444444444444444444444444444';

test('validates valid and invalid Solana addresses correctly', () => {
  assert.equal(isValidSolanaAddress(SYS_WALLET), true);
  assert.equal(isValidSolanaAddress('short'), false);
  assert.equal(isValidSolanaAddress('0OIl'), false); // contains non-base58 0, O, I, l
  assert.equal(isValidSolanaAddress(''), false);
  assert.equal(isValidSolanaAddress(null), false);
});

test('Scenario 1: Full referral chain (L1, L2, L3 all exist)', () => {
  const dist = calculateDistribution(WALLET_L1, WALLET_L2, WALLET_L3, SYS_WALLET);
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

test('Scenario 2: Only L1 exists, L2 and L3 missing -> System gets 50 AIQX', () => {
  const dist = calculateDistribution(WALLET_L1, null, null, SYS_WALLET);
  assert.equal(dist.l1Amount, 50);
  assert.equal(dist.l1Wallet, WALLET_L1);

  assert.equal(dist.l2Amount, 30);
  assert.equal(dist.l2Wallet, SYS_WALLET);
  assert.equal(dist.l2IsSystemReserve, true);

  assert.equal(dist.l3Amount, 5);
  assert.equal(dist.l3Wallet, SYS_WALLET);
  assert.equal(dist.l3IsSystemReserve, true);

  assert.equal(dist.totalSystemAmount, 50); // 15 base + 30 L2 reserve + 5 L3 reserve
  assert.equal(dist.totalAmount, 100);
});

test('Scenario 3: L1 and L2 exist, L3 missing -> System gets 20 AIQX', () => {
  const dist = calculateDistribution(WALLET_L1, WALLET_L2, null, SYS_WALLET);
  assert.equal(dist.l1Amount, 50);
  assert.equal(dist.l1Wallet, WALLET_L1);

  assert.equal(dist.l2Amount, 30);
  assert.equal(dist.l2Wallet, WALLET_L2);
  assert.equal(dist.l2IsSystemReserve, false);

  assert.equal(dist.l3Amount, 5);
  assert.equal(dist.l3Wallet, SYS_WALLET);
  assert.equal(dist.l3IsSystemReserve, true);

  assert.equal(dist.totalSystemAmount, 20); // 15 base + 5 L3 reserve
  assert.equal(dist.totalAmount, 100);
});

test('Scenario: Hierarchy resolution from stored database records', () => {
  const mockDb: Record<string, UserRecord> = {
    [WALLET_L3]: {
      wallet: WALLET_L3,
      upline1: null,
      upline2: null,
      upline3: null,
      joinTime: new Date().toISOString(),
      joinSignature: 'sig3',
    },
    [WALLET_L2]: {
      wallet: WALLET_L2,
      upline1: WALLET_L3,
      upline2: null,
      upline3: null,
      joinTime: new Date().toISOString(),
      joinSignature: 'sig2',
    },
    [WALLET_L1]: {
      wallet: WALLET_L1,
      upline1: WALLET_L2,
      upline2: WALLET_L3,
      upline3: null,
      joinTime: new Date().toISOString(),
      joinSignature: 'sig1',
    },
  };

  const hierarchy = resolveUplineHierarchy(WALLET_L1, (w) => mockDb[w]);
  assert.equal(hierarchy.upline1, WALLET_L1);
  assert.equal(hierarchy.upline2, WALLET_L2);
  assert.equal(hierarchy.upline3, WALLET_L3);
});

test('Scenario: Self-referral and duplicate registration prevention', () => {
  const selfRef = validateRegistrationPreconditions({
    joiningWallet: WALLET_NEW,
    referralWallet: WALLET_NEW,
    isExistingUser: false,
    systemWallet: SYS_WALLET,
  });
  assert.equal(selfRef.valid, false);
  assert.match(selfRef.error || '', /Self-referral/);

  const dup = validateRegistrationPreconditions({
    joiningWallet: WALLET_NEW,
    referralWallet: WALLET_L1,
    isExistingUser: true,
    systemWallet: SYS_WALLET,
  });
  assert.equal(dup.valid, false);
  assert.match(dup.error || '', /already registered/);

  const ok = validateRegistrationPreconditions({
    joiningWallet: WALLET_NEW,
    referralWallet: WALLET_L1,
    isExistingUser: false,
    systemWallet: SYS_WALLET,
  });
  assert.equal(ok.valid, true);
});
