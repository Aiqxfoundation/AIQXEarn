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
import { ReferralDistribution } from './referral-engine';

export interface AppConfig {
  rpcUrl: string;
  tokenMint: string;
  systemWallet: string;
  genesisWallet: string;
  totalTokenSupply: number;
  decimals: number;
  joiningFee: number;
  network: 'mainnet-beta' | 'devnet';
}

export const DEFAULT_CONFIG: AppConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  tokenMint: 'AiqxMint11111111111111111111111111111111111',
  systemWallet: 'SysAiqx111111111111111111111111111111111111',
  genesisWallet: 'AiqxRoot11111111111111111111111111111111111',
  totalTokenSupply: 4500000,
  decimals: 6,
  joiningFee: 100,
  network: 'devnet',
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
  type: 'tx' | 'address',
  network: 'mainnet-beta' | 'devnet' = 'devnet'
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
    return balance / LAMPORTS_PER_SOL;
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
  } catch (err: any) {
    // If account doesn't exist or has 0 balance, return 0
    return 0;
  }
}

/**
 * Creates an atomic Solana SPL Token transaction that distributes the 100 AIQX joining fee:
 * - Creates recipient ATAs if they don't already exist (idempotent instruction)
 * - Transfers 50 AIQX to L1
 * - Transfers 30 AIQX to L2 (or System if L2 is absent)
 * - Transfers 5 AIQX to L3 (or System if L3 is absent)
 * - Transfers 15 AIQX to System Wallet
 */
export async function createAtomicJoiningTransaction(params: {
  connection: Connection;
  joiningWallet: PublicKey;
  tokenMint: PublicKey;
  distribution: ReferralDistribution;
  decimals?: number;
}): Promise<Transaction> {
  const { connection, joiningWallet, tokenMint, distribution, decimals = 6 } = params;
  const transaction = new Transaction();

  // Multiplier for 6 decimals (1 AIQX = 1,000,000 base units)
  const multiplier = BigInt(10 ** decimals);

  // Sender's Associated Token Account
  const senderAta = getAssociatedTokenAddressSync(
    tokenMint,
    joiningWallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Helper to ensure recipient ATA and add transfer instruction
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

    // 1. Ensure recipient ATA exists (will not fail if already exists)
    transaction.add(
      createAssociatedTokenAccountIdempotentInstruction(
        joiningWallet, // Payer of account creation rent
        recipientAta, // Associated token account
        recipientPubkey, // Account owner
        tokenMint, // Mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    // 2. Transfer SPL tokens
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

  // Add L2 transfer (30 AIQX to L2 or System)
  addTransfer(distribution.l2Wallet, distribution.l2Amount);

  // Add L3 transfer (5 AIQX to L3 or System)
  addTransfer(distribution.l3Wallet, distribution.l3Amount);

  // Add System Base transfer (15 AIQX)
  addTransfer(distribution.systemWallet, distribution.systemBaseAmount);

  // Set latest blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = joiningWallet;

  return transaction;
}
