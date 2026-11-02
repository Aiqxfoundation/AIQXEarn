import fs from 'node:fs';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRecord, EarningsRecord, SystemPoolBreakdown } from '../lib/referral-engine';

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
}

export interface AppDatabase {
  getUser(wallet: string): Promise<UserRecord | null>;
  getAllUsers(): Promise<UserRecord[]>;
  createUser(user: UserRecord): Promise<void>;
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
}

// Default Genesis Wallet for initial community bootstrap
export const GENESIS_WALLET = 'AiqxRoot11111111111111111111111111111111111';

// Local Persistent Store Implementation
class LocalFileDatabase implements AppDatabase {
  private filePath: string;
  private data: {
    users: Record<string, UserRecord>;
    earnings: EarningsRecord[];
    systemPool: SystemPoolRecord[];
    processedSignatures: Record<string, ProcessedTxRecord>;
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
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing local store, initializing fresh store:', e);
    }

    // Default seed with genesis root
    const initial = {
      users: {
        [GENESIS_WALLET]: {
          wallet: GENESIS_WALLET,
          upline1: null,
          upline2: null,
          upline3: null,
          joinTime: new Date('2025-01-01T00:00:00Z').toISOString(),
          joinSignature: 'GENESIS_BOOTSTRAP_INITIAL_SIGNATURE',
        },
      },
      earnings: [] as EarningsRecord[],
      systemPool: [] as SystemPoolRecord[],
      processedSignatures: {} as Record<string, ProcessedTxRecord>,
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave = this.data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write local database to disk:', e);
    }
  }

  async getUser(wallet: string): Promise<UserRecord | null> {
    return this.data.users[wallet] || null;
  }

  async getAllUsers(): Promise<UserRecord[]> {
    return Object.values(this.data.users);
  }

  async createUser(user: UserRecord): Promise<void> {
    this.data.users[user.wallet] = user;
    this.saveData();
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
}

// Supabase Database Implementation
class SupabaseDatabaseAdapter implements AppDatabase {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async getUser(wallet: string): Promise<UserRecord | null> {
    const { data, error } = await this.client
      .from('users')
      .select('wallet, upline1, upline2, upline3, join_time, join_signature')
      .eq('wallet', wallet)
      .maybeSingle();

    if (error || !data) return null;
    return {
      wallet: data.wallet,
      upline1: data.upline1,
      upline2: data.upline2,
      upline3: data.upline3,
      joinTime: data.join_time,
      joinSignature: data.join_signature,
    };
  }

  async getAllUsers(): Promise<UserRecord[]> {
    const { data, error } = await this.client
      .from('users')
      .select('wallet, upline1, upline2, upline3, join_time, join_signature');
    if (error || !data) return [];
    return data.map((d) => ({
      wallet: d.wallet,
      upline1: d.upline1,
      upline2: d.upline2,
      upline3: d.upline3,
      joinTime: d.join_time,
      joinSignature: d.join_signature,
    }));
  }

  async createUser(user: UserRecord): Promise<void> {
    const { error } = await this.client.from('users').insert({
      wallet: user.wallet,
      upline1: user.upline1,
      upline2: user.upline2,
      upline3: user.upline3,
      join_time: user.joinTime,
      join_signature: user.joinSignature,
    });
    if (error) {
      throw new Error(`Failed to insert user into Supabase: ${error.message}`);
    }
  }

  async isSignatureProcessed(signature: string): Promise<boolean> {
    const { data } = await this.client
      .from('processed_transactions')
      .select('signature')
      .eq('signature', signature)
      .maybeSingle();
    return Boolean(data);
  }

  async recordProcessedTransaction(record: ProcessedTxRecord): Promise<void> {
    await this.client.from('processed_transactions').insert({
      signature: record.signature,
      sender_wallet: record.senderWallet,
      amount: record.amount,
      status: record.status,
      created_at: record.createdAt,
    });
  }

  async recordEarnings(records: EarningsRecord[]): Promise<void> {
    if (records.length === 0) return;
    const payload = records.map((r) => ({
      wallet: r.wallet,
      source_wallet: r.sourceWallet,
      level: r.level,
      amount: r.amount,
      transaction_signature: r.transactionSignature,
      category: r.category,
      timestamp: r.timestamp,
    }));
    const { error } = await this.client.from('earnings').insert(payload);
    if (error) {
      throw new Error(`Failed to insert earnings into Supabase: ${error.message}`);
    }
  }

  async recordSystemPool(record: SystemPoolRecord): Promise<void> {
    const { error } = await this.client.from('system_pool').insert({
      source_wallet: record.sourceWallet,
      fixed_amount: record.fixedAmount,
      l2_reserve_amount: record.l2ReserveAmount,
      l3_reserve_amount: record.l3ReserveAmount,
      total_amount: record.totalAmount,
      transaction_signature: record.transactionSignature,
      timestamp: record.timestamp,
    });
    if (error) {
      throw new Error(`Failed to insert system pool into Supabase: ${error.message}`);
    }
  }

  async getUserEarnings(wallet: string): Promise<EarningsRecord[]> {
    const { data } = await this.client
      .from('earnings')
      .select('id, wallet, source_wallet, level, amount, transaction_signature, category, timestamp')
      .eq('wallet', wallet)
      .order('timestamp', { ascending: false });

    if (!data) return [];
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
  }

  async getUserReferrals(wallet: string): Promise<{
    l1: UserRecord[];
    l2: UserRecord[];
    l3: UserRecord[];
  }> {
    const [q1, q2, q3] = await Promise.all([
      this.client.from('users').select('*').eq('upline1', wallet),
      this.client.from('users').select('*').eq('upline2', wallet),
      this.client.from('users').select('*').eq('upline3', wallet),
    ]);

    const map = (list: any[] | null): UserRecord[] =>
      (list || []).map((d) => ({
        wallet: d.wallet,
        upline1: d.upline1,
        upline2: d.upline2,
        upline3: d.upline3,
        joinTime: d.join_time,
        joinSignature: d.join_signature,
      }));

    return {
      l1: map(q1.data),
      l2: map(q2.data),
      l3: map(q3.data),
    };
  }

  async getSystemPoolBreakdown(): Promise<SystemPoolBreakdown> {
    const { data } = await this.client
      .from('system_pool')
      .select('fixed_amount, l2_reserve_amount, l3_reserve_amount, total_amount');

    let fixedAdminAllocation = 0;
    let level2Reserve = 0;
    let level3Reserve = 0;
    let totalSystemPool = 0;

    if (data) {
      for (const row of data) {
        fixedAdminAllocation += Number(row.fixed_amount) || 0;
        level2Reserve += Number(row.l2_reserve_amount) || 0;
        level3Reserve += Number(row.l3_reserve_amount) || 0;
        totalSystemPool += Number(row.total_amount) || 0;
      }
    }

    return {
      fixedAdminAllocation,
      level2Reserve,
      level3Reserve,
      totalSystemPool,
    };
  }

  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalDistributed: number;
    systemPool: SystemPoolBreakdown;
  }> {
    const { count: usersCount } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { data: earningsData } = await this.client
      .from('earnings')
      .select('amount');

    let totalDistributed = 0;
    if (earningsData) {
      for (const row of earningsData) {
        totalDistributed += Number(row.amount) || 0;
      }
    }

    const systemPool = await this.getSystemPoolBreakdown();
    return {
      totalUsers: usersCount || 0,
      totalDistributed,
      systemPool,
    };
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
