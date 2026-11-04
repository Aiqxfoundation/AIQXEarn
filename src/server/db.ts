import fs from 'node:fs';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserRecord,
  EarningsRecord,
  SystemPoolBreakdown,
  ContributionRecord,
  OFFICIAL_TREASURY_WALLET,
  GENESIS_ROOT_WALLET,
  MATRIX_LEVELS_CONFIG,
} from '../lib/referral-engine';

export interface SystemPoolRecord {
  id: string;
  sourceWallet: string;
  fixedAmount: number;
  l2ReserveAmount: number;
  l3ReserveAmount: number;
  totalAmount: number;
  transactionSignature: string;
  timestamp: string;
}

export interface ProcessedTxRecord {
  signature: string;
  senderWallet: string;
  amount: number;
  status: string;
  createdAt: string;
  type?: 'join' | 'slot_upgrade' | 'contribution_payout';
}

export interface AppDatabase {
  getUser(wallet: string): Promise<UserRecord | null>;
  getUserById(id: number): Promise<UserRecord | null>;
  getUserByWalletOrId(val: string | number): Promise<UserRecord | null>;
  getAllUsers(): Promise<UserRecord[]>;
  createUser(user: UserRecord): Promise<UserRecord>;
  getNextUserId(): Promise<number>;
  activateUserLevel(wallet: string, level: number): Promise<UserRecord>;
  recycleSlot(wallet: string, level: number): Promise<{ user: UserRecord; cycle: number }>;
  isSignatureProcessed(signature: string): Promise<boolean>;
  recordProcessedTransaction(record: ProcessedTxRecord): Promise<void>;
  recordEarnings(earnings: EarningsRecord[]): Promise<void>;
  recordSystemPool(record: SystemPoolRecord): Promise<void>;
  getUserEarnings(wallet: string): Promise<EarningsRecord[]>;
  getUserReferrals(wallet: string): Promise<{
    l1: UserRecord[];
    l2: UserRecord[];
    l3: UserRecord[];
  }>;
  getSystemPoolBreakdown(): Promise<SystemPoolBreakdown>;
  getGlobalStats(): Promise<{
    totalUsers: number;
    totalDistributed: number;
    systemPool: SystemPoolBreakdown;
  }>;
  getContributions(): Promise<ContributionRecord[]>;
  createContribution(contribution: ContributionRecord): Promise<void>;
  updateContributionStatus(
    id: string,
    status: ContributionRecord['status'],
    grantedRewardAiqx?: number,
    transactionSignature?: string
  ): Promise<void>;
}

export const GENESIS_WALLET = GENESIS_ROOT_WALLET;

// Local Persistent Store Implementation with 14-Level Matrix & ID Tracking
class LocalFileDatabase implements AppDatabase {
  private filePath: string;
  private data: {
    users: Record<string, UserRecord>;
    earnings: EarningsRecord[];
    systemPool: SystemPoolRecord[];
    processedSignatures: Record<string, ProcessedTxRecord>;
    contributions: ContributionRecord[];
    nextUserId: number;
  };

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'aiqx-store.json');
    this.data = this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.contributions) parsed.contributions = [];
        if (!parsed.nextUserId) {
          const maxId = Object.values(parsed.users || {}).reduce(
            (max: number, u: any) => Math.max(max, u.id || 0),
            0
          );
          parsed.nextUserId = maxId + 1;
        }

        // Ensure Root has ID 1 and all 12 slots active
        if (parsed.users && parsed.users[GENESIS_WALLET]) {
          parsed.users[GENESIS_WALLET].id = 1;
          parsed.users[GENESIS_WALLET].activeLevels = Array.from({ length: 12 }, (_, i) => i + 1);
        }

        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing local store, initializing fresh store:', e);
    }

    // Default Seed with Genesis Root Member (ID 1)
    const initial = {
      users: {
        [GENESIS_WALLET]: {
          id: 1,
          wallet: GENESIS_WALLET,
          sponsorId: null,
          matrixParentId: null,
          upline1: null,
          upline2: null,
          upline3: null,
          joinTime: new Date('2025-01-01T00:00:00Z').toISOString(),
          joinSignature: 'GENESIS_BOOTSTRAP_INITIAL_SIGNATURE',
          activeLevels: Array.from({ length: 5 }, (_, i) => i + 1),
          slotRecords: {
            1: { level: 1, totalCapacity: 3, filledCount: 0, occupantIds: [], completedCycles: 0 },
          },
        },
      },
      earnings: [] as EarningsRecord[],
      systemPool: [] as SystemPoolRecord[],
      processedSignatures: {} as Record<string, ProcessedTxRecord>,
      contributions: this.getDefaultContributions(),
      nextUserId: 2,
    };
    this.saveData(initial);
    return initial;
  }

  private getDefaultContributions(): ContributionRecord[] {
    return [
      {
        id: 'contrib_1',
        title: 'Solana Matrix X Anchor Smart Contract',
        category: 'Smart Contract Development',
        contributorWallet: '2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o',
        contributorUserId: 1,
        description: 'Complete 14-level doubling matrix Solana program in Rust with atomic SPL token settlement and Treasury verification.',
        proofUrl: 'https://github.com/Aiqxfoundation/AIQXEarn',
        requestedRewardAiqx: 5000,
        grantedRewardAiqx: 5000,
        status: 'rewarded',
        submittedAt: '2026-10-15T10:00:00Z',
        reviewedAt: '2026-10-16T12:00:00Z',
        transactionSignature: 'sig_genesis_dev_grant_001',
      },
      {
        id: 'contrib_2',
        title: 'Institutional UI & Interactive Matrix Grid',
        category: 'Frontend Development',
        contributorWallet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        description: 'Responsive trading dashboard, live GeckoTerminal candlestick chart integration, and visual matrix network tree.',
        proofUrl: 'https://github.com/Aiqxfoundation/AIQXEarn/pull/1',
        requestedRewardAiqx: 2500,
        grantedRewardAiqx: 2500,
        status: 'rewarded',
        submittedAt: '2026-10-20T14:30:00Z',
        reviewedAt: '2026-10-21T09:15:00Z',
        transactionSignature: 'sig_genesis_frontend_grant_002',
      },
      {
        id: 'contrib_3',
        title: 'Comprehensive Security Audit & Reentrancy Analysis',
        category: 'Security Research',
        contributorWallet: '9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSkYd16G92',
        description: 'Formal verification of SPL token transfer accounts, PDA authority validation, and crossover overflow resistance.',
        proofUrl: 'https://solana.fm/address/2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o',
        requestedRewardAiqx: 3500,
        grantedRewardAiqx: 3500,
        status: 'verified',
        submittedAt: '2026-10-28T08:00:00Z',
        reviewedAt: '2026-10-29T16:00:00Z',
      },
    ];
  }

  private saveData(dataToSave = this.data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write local database to disk:', e);
    }
  }

  async getNextUserId(): Promise<number> {
    const next = this.data.nextUserId || 2;
    this.data.nextUserId = next + 1;
    this.saveData();
    return next;
  }

  async getUser(wallet: string): Promise<UserRecord | null> {
    return this.data.users[wallet] || null;
  }

  async getUserById(id: number): Promise<UserRecord | null> {
    for (const u of Object.values(this.data.users)) {
      if (u.id === id) return u;
    }
    return null;
  }

  async getUserByWalletOrId(val: string | number): Promise<UserRecord | null> {
    if (typeof val === 'number' || /^\d+$/.test(String(val))) {
      return this.getUserById(Number(val));
    }
    return this.getUser(String(val));
  }

  async getAllUsers(): Promise<UserRecord[]> {
    return Object.values(this.data.users);
  }

  async createUser(user: UserRecord): Promise<UserRecord> {
    if (!user.id) {
      user.id = await this.getNextUserId();
    }
    if (!user.activeLevels) {
      user.activeLevels = [1];
    }
    if (!user.slotRecords) {
      user.slotRecords = {
        1: { level: 1, totalCapacity: 3, filledCount: 0, occupantIds: [], completedCycles: 0 },
      };
    }

    this.data.users[user.wallet] = user;

    // Update parent matrix slot tracking
    if (user.matrixParentId) {
      const parent = await this.getUserById(user.matrixParentId);
      if (parent && parent.slotRecords && parent.slotRecords[1]) {
        parent.slotRecords[1].filledCount += 1;
        parent.slotRecords[1].occupantIds.push(user.id);
        this.data.users[parent.wallet] = parent;
      }
    }

    this.saveData();
    return user;
  }

  async activateUserLevel(wallet: string, level: number): Promise<UserRecord> {
    const user = this.data.users[wallet];
    if (!user) {
      throw new Error(`User with wallet ${wallet} not found`);
    }

    const levels = new Set(user.activeLevels || [1]);
    levels.add(level);
    user.activeLevels = Array.from(levels).sort((a, b) => a - b);

    if (!user.slotRecords) user.slotRecords = {};
    const cfg = MATRIX_LEVELS_CONFIG.find((l) => l.level === level);
    const capacity = cfg ? cfg.slots : Math.pow(2, level - 1);

    if (!user.slotRecords[level]) {
      user.slotRecords[level] = {
        level,
        totalCapacity: capacity,
        filledCount: 0,
        occupantIds: [],
        completedCycles: 0,
      };
    }

    this.data.users[wallet] = user;
    this.saveData();
    return user;
  }

  async recycleSlot(wallet: string, level: number): Promise<{ user: UserRecord; cycle: number }> {
    const user = this.data.users[wallet];
    if (!user) {
      throw new Error(`User with wallet ${wallet} not found`);
    }

    if (!user.slotRecords) user.slotRecords = {};
    const cfg = MATRIX_LEVELS_CONFIG.find((l) => l.level === level);
    const capacity = cfg ? cfg.slots : Math.pow(2, level - 1);

    const prev = user.slotRecords[level] || {
      level,
      totalCapacity: capacity,
      filledCount: 0,
      occupantIds: [],
      completedCycles: 0,
    };

    const newCycles = (prev.completedCycles || 0) + 1;
    user.slotRecords[level] = {
      level,
      totalCapacity: capacity,
      filledCount: 0, // NEW slot of SAME LEVEL opens with filledCount 0
      occupantIds: [],
      completedCycles: newCycles,
    };

    this.data.users[wallet] = user;
    this.saveData();
    return { user, cycle: newCycles };
  }

  async isSignatureProcessed(signature: string): Promise<boolean> {
    return Boolean(this.data.processedSignatures[signature]);
  }

  async recordProcessedTransaction(record: ProcessedTxRecord): Promise<void> {
    this.data.processedSignatures[record.signature] = record;
    this.saveData();
  }

  async recordEarnings(records: EarningsRecord[]): Promise<void> {
    this.data.earnings.push(...records);
    this.saveData();
  }

  async recordSystemPool(record: SystemPoolRecord): Promise<void> {
    this.data.systemPool.push(record);
    this.saveData();
  }

  async getUserEarnings(wallet: string): Promise<EarningsRecord[]> {
    return this.data.earnings.filter((e) => e.wallet === wallet);
  }

  async getUserReferrals(wallet: string): Promise<{
    l1: UserRecord[];
    l2: UserRecord[];
    l3: UserRecord[];
  }> {
    const all = Object.values(this.data.users);
    const l1 = all.filter((u) => u.upline1 === wallet);
    const l2 = all.filter((u) => u.upline2 === wallet);
    const l3 = all.filter((u) => u.upline3 === wallet);
    return { l1, l2, l3 };
  }

  async getSystemPoolBreakdown(): Promise<SystemPoolBreakdown> {
    let fixedAdminAllocation = 0;
    let level2Reserve = 0;
    let level3Reserve = 0;
    let totalSystemPool = 0;

    for (const pool of this.data.systemPool) {
      fixedAdminAllocation += Number(pool.fixedAmount) || 0;
      level2Reserve += Number(pool.l2ReserveAmount) || 0;
      level3Reserve += Number(pool.l3ReserveAmount) || 0;
      totalSystemPool += Number(pool.totalAmount) || 0;
    }

    return {
      fixedAdminAllocation,
      level2Reserve,
      level3Reserve,
      totalSystemPool,
      totalTreasurySlotFees: fixedAdminAllocation,
    };
  }

  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalDistributed: number;
    systemPool: SystemPoolBreakdown;
  }> {
    const totalUsers = Object.keys(this.data.users).length;
    let totalDistributed = 0;
    for (const earn of this.data.earnings) {
      totalDistributed += Number(earn.amount) || 0;
    }

    const systemPool = await this.getSystemPoolBreakdown();
    return {
      totalUsers,
      totalDistributed,
      systemPool,
    };
  }

  async getContributions(): Promise<ContributionRecord[]> {
    return this.data.contributions || [];
  }

  async createContribution(contribution: ContributionRecord): Promise<void> {
    if (!this.data.contributions) this.data.contributions = [];
    this.data.contributions.unshift(contribution);
    this.saveData();
  }

  async updateContributionStatus(
    id: string,
    status: ContributionRecord['status'],
    grantedRewardAiqx?: number,
    transactionSignature?: string
  ): Promise<void> {
    const c = this.data.contributions.find((item) => item.id === id);
    if (c) {
      c.status = status;
      c.reviewedAt = new Date().toISOString();
      if (grantedRewardAiqx != null) c.grantedRewardAiqx = grantedRewardAiqx;
      if (transactionSignature != null) c.transactionSignature = transactionSignature;
      this.saveData();
    }
  }
}

// Supabase Database Implementation with Matrix & Sequential ID Support
class SupabaseDatabaseAdapter implements AppDatabase {
  private client: SupabaseClient;
  private localFallback: LocalFileDatabase;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
    this.localFallback = new LocalFileDatabase();
  }

  async getNextUserId(): Promise<number> {
    try {
      const { count } = await this.client.from('users').select('*', { count: 'exact', head: true });
      return (count || 0) + 1;
    } catch {
      return this.localFallback.getNextUserId();
    }
  }

  async getUser(wallet: string): Promise<UserRecord | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('wallet', wallet)
        .maybeSingle();

      if (error || !data) return this.localFallback.getUser(wallet);
      return {
        id: data.id,
        wallet: data.wallet,
        sponsorId: data.sponsor_id,
        matrixParentId: data.matrix_parent_id,
        upline1: data.upline1,
        upline2: data.upline2,
        upline3: data.upline3,
        joinTime: data.join_time,
        joinSignature: data.join_signature,
        activeLevels: data.active_levels || [1],
        slotRecords: data.slot_records,
      };
    } catch {
      return this.localFallback.getUser(wallet);
    }
  }

  async getUserById(id: number): Promise<UserRecord | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return this.localFallback.getUserById(id);
      return {
        id: data.id,
        wallet: data.wallet,
        sponsorId: data.sponsor_id,
        matrixParentId: data.matrix_parent_id,
        upline1: data.upline1,
        upline2: data.upline2,
        upline3: data.upline3,
        joinTime: data.join_time,
        joinSignature: data.join_signature,
        activeLevels: data.active_levels || [1],
        slotRecords: data.slot_records,
      };
    } catch {
      return this.localFallback.getUserById(id);
    }
  }

  async getUserByWalletOrId(val: string | number): Promise<UserRecord | null> {
    if (typeof val === 'number' || /^\d+$/.test(String(val))) {
      return this.getUserById(Number(val));
    }
    return this.getUser(String(val));
  }

  async getAllUsers(): Promise<UserRecord[]> {
    try {
      const { data, error } = await this.client.from('users').select('*');
      if (error || !data) return this.localFallback.getAllUsers();
      return data.map((d) => ({
        id: d.id,
        wallet: d.wallet,
        sponsorId: d.sponsor_id,
        matrixParentId: d.matrix_parent_id,
        upline1: d.upline1,
        upline2: d.upline2,
        upline3: d.upline3,
        joinTime: d.join_time,
        joinSignature: d.join_signature,
        activeLevels: d.active_levels || [1],
        slotRecords: d.slot_records,
      }));
    } catch {
      return this.localFallback.getAllUsers();
    }
  }

  async createUser(user: UserRecord): Promise<UserRecord> {
    try {
      if (!user.id) {
        user.id = await this.getNextUserId();
      }
      const { error } = await this.client.from('users').insert({
        id: user.id,
        wallet: user.wallet,
        sponsor_id: user.sponsorId,
        matrix_parent_id: user.matrixParentId,
        upline1: user.upline1,
        upline2: user.upline2,
        upline3: user.upline3,
        join_time: user.joinTime,
        join_signature: user.joinSignature,
        active_levels: user.activeLevels || [1],
      });
      if (error) {
        return this.localFallback.createUser(user);
      }
      return user;
    } catch {
      return this.localFallback.createUser(user);
    }
  }

  async activateUserLevel(wallet: string, level: number): Promise<UserRecord> {
    return this.localFallback.activateUserLevel(wallet, level);
  }

  async recycleSlot(wallet: string, level: number): Promise<{ user: UserRecord; cycle: number }> {
    return this.localFallback.recycleSlot(wallet, level);
  }

  async isSignatureProcessed(signature: string): Promise<boolean> {
    try {
      const { data } = await this.client
        .from('processed_transactions')
        .select('signature')
        .eq('signature', signature)
        .maybeSingle();
      return Boolean(data);
    } catch {
      return this.localFallback.isSignatureProcessed(signature);
    }
  }

  async recordProcessedTransaction(record: ProcessedTxRecord): Promise<void> {
    try {
      await this.client.from('processed_transactions').insert({
        signature: record.signature,
        sender_wallet: record.senderWallet,
        amount: record.amount,
        status: record.status,
        created_at: record.createdAt,
      });
    } catch {
      await this.localFallback.recordProcessedTransaction(record);
    }
  }

  async recordEarnings(records: EarningsRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      const payload = records.map((r) => ({
        wallet: r.wallet,
        source_wallet: r.sourceWallet,
        level: r.level,
        amount: r.amount,
        transaction_signature: r.transactionSignature,
        category: r.category,
        timestamp: r.timestamp,
      }));
      await this.client.from('earnings').insert(payload);
    } catch {
      await this.localFallback.recordEarnings(records);
    }
  }

  async recordSystemPool(record: SystemPoolRecord): Promise<void> {
    try {
      await this.client.from('system_pool').insert({
        source_wallet: record.sourceWallet,
        fixed_amount: record.fixedAmount,
        l2_reserve_amount: record.l2ReserveAmount,
        l3_reserve_amount: record.l3ReserveAmount,
        total_amount: record.totalAmount,
        transaction_signature: record.transactionSignature,
        timestamp: record.timestamp,
      });
    } catch {
      await this.localFallback.recordSystemPool(record);
    }
  }

  async getUserEarnings(wallet: string): Promise<EarningsRecord[]> {
    try {
      const { data } = await this.client
        .from('earnings')
        .select('*')
        .eq('wallet', wallet)
        .order('timestamp', { ascending: false });

      if (!data) return this.localFallback.getUserEarnings(wallet);
      return data.map((d) => ({
        id: d.id,
        wallet: d.wallet,
        sourceWallet: d.source_wallet,
        level: d.level,
        amount: Number(d.amount),
        transactionSignature: d.transaction_signature,
        category: d.category,
        timestamp: d.timestamp,
      }));
    } catch {
      return this.localFallback.getUserEarnings(wallet);
    }
  }

  async getUserReferrals(wallet: string): Promise<{
    l1: UserRecord[];
    l2: UserRecord[];
    l3: UserRecord[];
  }> {
    return this.localFallback.getUserReferrals(wallet);
  }

  async getSystemPoolBreakdown(): Promise<SystemPoolBreakdown> {
    return this.localFallback.getSystemPoolBreakdown();
  }

  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalDistributed: number;
    systemPool: SystemPoolBreakdown;
  }> {
    return this.localFallback.getGlobalStats();
  }

  async getContributions(): Promise<ContributionRecord[]> {
    return this.localFallback.getContributions();
  }

  async createContribution(contribution: ContributionRecord): Promise<void> {
    return this.localFallback.createContribution(contribution);
  }

  async updateContributionStatus(
    id: string,
    status: ContributionRecord['status'],
    grantedRewardAiqx?: number,
    transactionSignature?: string
  ): Promise<void> {
    return this.localFallback.updateContributionStatus(id, status, grantedRewardAiqx, transactionSignature);
  }
}

// Factory to export initialized database
let dbInstance: AppDatabase;

export function getDatabase(): AppDatabase {
  if (dbInstance) return dbInstance;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    console.log('[AIQX DB] Connected to Supabase PostgreSQL database.');
    dbInstance = new SupabaseDatabaseAdapter(supabaseUrl, supabaseKey);
  } else {
    console.log('[AIQX DB] Using Persistent Local JSON Store (ready for Supabase migration).');
    dbInstance = new LocalFileDatabase();
  }

  return dbInstance;
}
