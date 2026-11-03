import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  ReferralDistribution,
  LevelUpgradeDistribution,
  OFFICIAL_TREASURY_WALLET,
  GENESIS_ROOT_WALLET,
} from './referral-engine';

export interface AppConfig {
  rpcUrl: string;
  tokenMint: string;
  systemWallet: string;
  treasuryWallet: string;
  genesisWallet: string;
  totalTokenSupply: number;
  decimals: number;
  joiningFee: number;
  network: 'mainnet-beta' | 'devnet';
  programName?: string;
  totalSlots?: number;
  totalLevels?: number;
}

export const OFFICIAL_AIQX_MINT = 'AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD';
export { OFFICIAL_TREASURY_WALLET };
export const RAYDIUM_SWAP_BUY_URL = 'https://raydium.io/swap/?inputMint=sol&outputMint=AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD';
export const RAYDIUM_SWAP_SELL_URL = 'https://raydium.io/swap/?inputMint=AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD&outputMint=sol';
export const DEXSCREENER_URL = 'https://dexscreener.com/solana/AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD';
export const GECKOTERMINAL_URL = 'https://www.geckoterminal.com/solana/tokens/AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD';

export const DEFAULT_CONFIG: AppConfig = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  tokenMint: OFFICIAL_AIQX_MINT,
  systemWallet: OFFICIAL_TREASURY_WALLET,
  treasuryWallet: OFFICIAL_TREASURY_WALLET,
  genesisWallet: GENESIS_ROOT_WALLET,
  totalTokenSupply: 4500000,
  decimals: 6,
  joiningFee: 100,
  network: 'mainnet-beta',
  programName: 'AIQX Independent Slots Matrix',
  totalSlots: 12,
  totalLevels: 12,
};

/**
 * Shortens a Solana Base58 public key for clean display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '--';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Builds Solana Explorer link for address or transaction
 */
export function getExplorerUrl(
  identifier: string,
  type: 'tx' | 'address' | 'token' = 'address',
  network: 'mainnet-beta' | 'devnet' = 'mainnet-beta'
): string {
  const base = `https://explorer.solana.com/${type}/${identifier}`;
  return network === 'devnet' ? `${base}?cluster=devnet` : base;
}

/**
 * Fetches native SOL balance for a given wallet
 */
export async function fetchSolBalance(
  connection: Connection,
  walletAddress: string
): Promise<number> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return Number(balance) / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn('[Solana] Failed to fetch SOL balance:', err);
    return 0;
  }
}

/**
 * Fetches AIQX SPL Token balance for a given wallet
 */
export async function fetchTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMintAddress: string,
  decimals = 6
): Promise<number> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(tokenMintAddress);
    const ata = getAssociatedTokenAddressSync(
      mintPubkey,
      walletPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenAccount = await connection.getTokenAccountBalance(ata);
    return tokenAccount.value.uiAmount || 0;
  } catch {
    return 0;
  }
}

/**
 * Creates an atomic Solana SPL Token transaction that distributes the 100 AIQX joining fee:
 * - Creates recipient ATAs if they don't already exist (idempotent instruction)
 * - Transfers 50 AIQX to L1
 * - Transfers 30 AIQX to L2 (or Treasury/System if L2 is absent)
 * - Transfers 5 AIQX to L3 (or Treasury/System if L3 is absent)
 * - Transfers 15 AIQX Slot Activation Fee STRICTLY to Treasury Wallet
 */
export async function createAtomicJoiningTransaction(params: {
  connection: Connection;
  joiningWallet: PublicKey;
  tokenMint: PublicKey;
  distribution: ReferralDistribution;
  treasuryWallet?: string;
  decimals?: number;
}): Promise<Transaction> {
  const {
    connection,
    joiningWallet,
    tokenMint,
    distribution,
    treasuryWallet = OFFICIAL_TREASURY_WALLET,
    decimals = 6,
  } = params;
  const transaction = new Transaction();

  // Sender's Associated Token Account
  const senderAta = getAssociatedTokenAddressSync(
    tokenMint,
    joiningWallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const addTransfer = (recipientAddress: string, aiqxAmount: number) => {
    if (aiqxAmount <= 0) return;
    const recipientPubkey = new PublicKey(recipientAddress);
    const recipientAta = getAssociatedTokenAddressSync(
      tokenMint,
      recipientPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    transaction.add(
      createAssociatedTokenAccountIdempotentInstruction(
        joiningWallet,
        recipientAta,
        recipientPubkey,
        tokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    const rawAmount = BigInt(Math.round(aiqxAmount * (10 ** decimals)));
    transaction.add(
      createTransferInstruction(
        senderAta,
        recipientAta,
        joiningWallet,
        rawAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  };

  // Add L1 transfer (50 AIQX)
  addTransfer(distribution.l1Wallet, distribution.l1Amount);

  // Add L2 transfer (30 AIQX to L2 or Treasury reserve)
  addTransfer(distribution.l2Wallet, distribution.l2Amount);

  // Add L3 transfer (5 AIQX to L3 or Treasury reserve)
  addTransfer(distribution.l3Wallet, distribution.l3Amount);

  // Add Slot Activation Fee (15 AIQX)
  if (distribution.slotActivationAmount > 0) {
    addTransfer(treasuryWallet, distribution.slotActivationAmount);
  }

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = joiningWallet;

  return transaction;
}

/**
 * Creates an atomic Solana SPL Token transaction for Matrix Level upgrade (Levels 2-14):
 * - Slot activation fee transfers strictly to Treasury (2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o)
 * - Commission amounts transfer directly to qualified uplines or crossover split recipients
 */
export async function createAtomicLevelUpgradeTransaction(params: {
  connection: Connection;
  payerWallet: PublicKey;
  tokenMint: PublicKey;
  distribution: LevelUpgradeDistribution;
  decimals?: number;
}): Promise<Transaction> {
  const { connection, payerWallet, tokenMint, distribution, decimals = 6 } = params;
  const transaction = new Transaction();

  const senderAta = getAssociatedTokenAddressSync(
    tokenMint,
    payerWallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const addTransfer = (recipientAddress: string, aiqxAmount: number) => {
    if (aiqxAmount <= 0) return;
    const recipientPubkey = new PublicKey(recipientAddress);
    const recipientAta = getAssociatedTokenAddressSync(
      tokenMint,
      recipientPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    transaction.add(
      createAssociatedTokenAccountIdempotentInstruction(
        payerWallet,
        recipientAta,
        recipientPubkey,
        tokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    const rawAmount = BigInt(Math.round(aiqxAmount * (10 ** decimals)));
    transaction.add(
      createTransferInstruction(
        senderAta,
        recipientAta,
        payerWallet,
        rawAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  };

  // 1. Slot Activation Fee -> STRICTLY to Treasury Wallet
  addTransfer(distribution.treasuryWallet, distribution.slotActivationFee);

  // 2. Commission distributions to eligible uplines / crossover split recipients
  for (const r of distribution.recipients) {
    addTransfer(r.wallet, r.amount);
  }

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payerWallet;

  return transaction;
}
