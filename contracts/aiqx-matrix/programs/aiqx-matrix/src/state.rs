use anchor_lang::prelude::*;

/// Global Program Protocol State
#[account]
pub struct ProgramState {
    /// Authority who deployed (for decentralized governance migrations)
    pub authority: Pubkey,
    /// Official AIQX SPL Token Mint
    pub token_mint: Pubkey,
    /// Official Protocol Treasury Wallet (2SSHcFVHfiCdxYUyBwBWzULaAjQbixujKZCSKwwT8n1o)
    pub treasury_wallet: Pubkey,
    /// Root Genesis User Address
    pub root_wallet: Pubkey,
    /// Total registered members counter
    pub total_members: u64,
    /// Total AIQX distributed to members
    pub total_distributed: u64,
    /// Total slot activation fees sent to Treasury
    pub total_treasury_collected: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl ProgramState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1;
}

/// On-Chain User Account (PDA: ["user", user_wallet])
#[account]
pub struct UserAccount {
    /// Unique permanent sequential ID (1 = Root, 2 = 2nd member, ...)
    pub user_id: u64,
    /// Member Solana Wallet
    pub wallet: Pubkey,
    /// Permanent Sponsor User ID
    pub sponsor_id: u64,
    /// Sponsor Wallet Address
    pub sponsor_wallet: Pubkey,
    /// Matrix placement parent ID for spillover
    pub matrix_parent_id: u64,
    /// Registration Unix timestamp
    pub registration_timestamp: i64,
    /// Bitmap of active levels (bit 1 = L1 active, bit 2 = L2, up to bit 14 = L14)
    pub active_levels_mask: u16,
    /// Total personal referrals count
    pub direct_referrals_count: u32,
    /// Direct commission received (in atomic token units)
    pub direct_earnings: u64,
    /// Indirect commission received
    pub indirect_earnings: u64,
    /// Third line commission received
    pub third_line_earnings: u64,
    /// Crossover commission received
    pub crossover_earnings: u64,
    /// Total commission received
    pub total_earnings: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl UserAccount {
    pub const LEN: usize = 8 + 8 + 32 + 8 + 32 + 8 + 8 + 2 + 4 + 8 + 8 + 8 + 8 + 8 + 1;

    pub fn is_level_active(&self, level: u8) -> bool {
        if level < 1 || level > 14 {
            return false;
        }
        (self.active_levels_mask & (1 << (level - 1))) != 0
    }

    pub fn activate_level(&mut self, level: u8) {
        if level >= 1 && level <= 14 {
            self.active_levels_mask |= 1 << (level - 1);
        }
    }
}

/// On-Chain Slot Record for a given Level (PDA: ["slot", user_id, level])
#[account]
pub struct LevelSlotRecord {
    pub user_id: u64,
    pub level: u8,
    pub capacity: u32,
    pub filled_count: u32,
    pub cycles_completed: u32,
    pub bump: u8,
}

impl LevelSlotRecord {
    pub const LEN: usize = 8 + 8 + 1 + 4 + 4 + 4 + 1;
}

/// 14-Level Doubling Matrix Math Constants
pub struct MatrixMath;

impl MatrixMath {
    /// Level 1: 50 AIQX, Level 2: 100 AIQX, ..., Level 14: 409,600 AIQX
    pub fn direct_reward(level: u8) -> u64 {
        50u64 * (1u64 << (level - 1))
    }

    /// Level 1: 30 AIQX, Level 2: 60 AIQX, ..., Level 14: 245,760 AIQX
    pub fn indirect_reward(level: u8) -> u64 {
        30u64 * (1u64 << (level - 1))
    }

    /// Level 1: 5 AIQX, Level 2: 10 AIQX, ..., Level 14: 40,960 AIQX
    pub fn third_line_reward(level: u8) -> u64 {
        5u64 * (1u64 << (level - 1))
    }

    /// STRICT RULE: Slot activation fee goes directly to Treasury
    /// Level 1: 15 AIQX, Level 2: 30 AIQX, ..., Level 14: 122,880 AIQX
    pub fn slot_activation_fee(level: u8) -> u64 {
        15u64 * (1u64 << (level - 1))
    }

    /// Total Level package: 100 * 2^(level-1)
    pub fn total_package_fee(level: u8) -> u64 {
        100u64 * (1u64 << (level - 1))
    }

    /// Doubling capacity: Level 1 = 1, Level 2 = 2, Level 3 = 4, ..., Level 14 = 8,192
    pub fn slot_capacity(level: u8) -> u32 {
        1u32 << (level - 1)
    }
}
