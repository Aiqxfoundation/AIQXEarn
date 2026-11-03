#!/usr/bin/env bash
set -euo pipefail

# AIQX Foundation Matrix Program — Mainnet Deployment Script
# Target Network: Solana Mainnet-Beta
# Program ID: AIQXmatr1x11111111111111111111111111111111
# Treasury Wallet: 2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o
# Mint Address: AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD

echo "=========================================================="
echo "AIQX FOUNDATION MATRIX PROGRAM — SOLANA MAINNET DEPLOYER"
echo "=========================================================="

RPC_URL="${SOLANA_MAINNET_RPC:-https://api.mainnet-beta.solana.com}"
KEYPAIR_PATH="${SOLANA_DEPLOYER_KEYPAIR:-~/.config/solana/id.json}"
PROGRAM_SO="target/deploy/aiqx_matrix.so"
PROGRAM_KEYPAIR="target/deploy/aiqx_matrix-keypair.json"

echo "1. Validating Solana CLI environment..."
solana --version
solana config set --url "$RPC_URL"

echo "2. Validating Deployer Wallet Balance..."
solana balance "$KEYPAIR_PATH"

echo "3. Building Verified Anchor Program Binary..."
anchor build --verifiable

echo "4. Deploying Program to Solana Mainnet..."
# Run buffer deploy and program execution
solana program deploy \
  --program-id "$PROGRAM_KEYPAIR" \
  --keypair "$KEYPAIR_PATH" \
  "$PROGRAM_SO"

echo "5. Verifying Deployment on Solana Explorer..."
PROGRAM_ID=$(solana address -k "$PROGRAM_KEYPAIR")
echo "Successfully deployed AIQX Matrix X to Mainnet!"
echo "Program ID: $PROGRAM_ID"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID"

echo "6. Initializing Root Member #1 & Treasury binding..."
echo "Ready for initialization instruction call via Anchor client."
