use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub mod errors;
pub mod state;

use errors::MatrixError;
use state::*;

declare_id!("AIQXmatr1x11111111111111111111111111111111");

#[program]
pub mod aiqx_matrix {
    use super::*;

    /// 1. Initialize Protocol State (Seeds Genesis Root User with ID 1)
    pub fn initialize(
        ctx: Context<Initialize>,
        token_mint: Pubkey,
        treasury_wallet: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.authority = ctx.accounts.authority.key();
        state.token_mint = token_mint;
        state.treasury_wallet = treasury_wallet;
        state.root_wallet = ctx.accounts.authority.key();
        state.total_members = 1; // Root is member #1
        state.total_distributed = 0;
        state.total_treasury_collected = 0;
        state.bump = ctx.bumps.program_state;

        // Initialize Root User with ID 1 and all 14 active levels
        let root_user = &mut ctx.accounts.root_user;
        root_user.user_id = 1;
        root_user.wallet = ctx.accounts.authority.key();
        root_user.sponsor_id = 0;
        root_user.sponsor_wallet = Pubkey::default();
        root_user.matrix_parent_id = 0;
        root_user.registration_timestamp = Clock::get()?.unix_timestamp;
        root_user.active_levels_mask = 0x3FFF; // All 14 bits set
        root_user.direct_referrals_count = 0;
        root_user.direct_earnings = 0;
        root_user.indirect_earnings = 0;
        root_user.third_line_earnings = 0;
        root_user.crossover_earnings = 0;
        root_user.total_earnings = 0;
        root_user.bump = ctx.bumps.root_user;

        msg!("AIQX Matrix X Protocol Initialized. Root ID 1 Created.");
        Ok(())
    }

    /// 2. Single-Transaction Registration (100 AIQX: 50 L1, 30 L2, 5 L3, 15 Treasury)
    pub fn register_user(
        ctx: Context<RegisterUser>,
        sponsor_id: u64,
        matrix_parent_id: u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        let decimals_multiplier = 1_000_000u64; // 6 decimals

        require!(
            ctx.accounts.new_user.wallet != ctx.accounts.sponsor_account.wallet,
            MatrixError::SelfReferralProhibited
        );

        let new_user_id = state.total_members + 1;
        state.total_members = new_user_id;

        // 1. Transfer 50 AIQX to Direct Sponsor (L1)
        let l1_amount = MatrixMath::direct_reward(1) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.upline1_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            l1_amount,
        )?;
        ctx.accounts.sponsor_account.direct_earnings += l1_amount;
        ctx.accounts.sponsor_account.total_earnings += l1_amount;
        ctx.accounts.sponsor_account.direct_referrals_count += 1;

        // 2. Transfer 30 AIQX to Indirect Upline (L2)
        let l2_amount = MatrixMath::indirect_reward(1) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.upline2_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            l2_amount,
        )?;

        // 3. Transfer 5 AIQX to Third Line Upline (L3)
        let l3_amount = MatrixMath::third_line_reward(1) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.upline3_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            l3_amount,
        )?;

        // 4. STRICT RULE: Transfer 15 AIQX Slot Activation Fee to Treasury Wallet
        let slot_fee = MatrixMath::slot_activation_fee(1) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            slot_fee,
        )?;
        state.total_treasury_collected += slot_fee;
        state.total_distributed += (l1_amount + l2_amount + l3_amount);

        // Populate On-Chain Member Record
        let new_user = &mut ctx.accounts.new_user;
        new_user.user_id = new_user_id;
        new_user.wallet = ctx.accounts.payer.key();
        new_user.sponsor_id = sponsor_id;
        new_user.sponsor_wallet = ctx.accounts.sponsor_account.wallet;
        new_user.matrix_parent_id = matrix_parent_id;
        new_user.registration_timestamp = Clock::get()?.unix_timestamp;
        new_user.active_levels_mask = 1; // Level 1 activated
        new_user.direct_referrals_count = 0;
        new_user.direct_earnings = 0;
        new_user.indirect_earnings = 0;
        new_user.third_line_earnings = 0;
        new_user.crossover_earnings = 0;
        new_user.total_earnings = 0;
        new_user.bump = ctx.bumps.new_user;

        msg!(
            "AIQX Matrix User Registered. User ID: {}, Sponsor ID: {}, Parent: {}",
            new_user_id,
            sponsor_id,
            matrix_parent_id
        );
        Ok(())
    }

    /// 3. Activate Level (Levels 2 through 14) with Automatic Crossover Split
    pub fn activate_level(ctx: Context<ActivateLevel>, target_level: u8) -> Result<()> {
        require!(
            target_level >= 2 && target_level <= 14,
            MatrixError::InvalidMatrixLevel
        );

        let user = &mut ctx.accounts.user_account;
        require!(
            !user.is_level_active(target_level),
            MatrixError::LevelAlreadyActive
        );

        let decimals_multiplier = 1_000_000u64;
        let slot_fee = MatrixMath::slot_activation_fee(target_level) * decimals_multiplier;
        let commission_total = (MatrixMath::direct_reward(target_level)
            + MatrixMath::indirect_reward(target_level)
            + MatrixMath::third_line_reward(target_level))
            * decimals_multiplier;

        // 1. STRICT RULE: Transfer Slot Activation Fee directly to Treasury
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            slot_fee,
        )?;

        // 2. Transfer Direct Commission to eligible upline or crossover split recipient
        let direct_amt = MatrixMath::direct_reward(target_level) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.recipient1_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            direct_amt,
        )?;

        // 3. Transfer Indirect Commission
        let indirect_amt = MatrixMath::indirect_reward(target_level) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.recipient2_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            indirect_amt,
        )?;

        // 4. Transfer Third Line Commission
        let third_line_amt = MatrixMath::third_line_reward(target_level) * decimals_multiplier;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.recipient3_token_account.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            third_line_amt,
        )?;

        let state = &mut ctx.accounts.program_state;
        state.total_treasury_collected += slot_fee;
        state.total_distributed += commission_total;

        // Activate Level on User Account
        user.activate_level(target_level);

        msg!(
            "AIQX Matrix Level {} Activated for User ID: {}. Slot Fee: {} AIQX.",
            target_level,
            user.user_id,
            MatrixMath::slot_activation_fee(target_level)
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ProgramState::LEN,
        seeds = [b"state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(
        init,
        payer = authority,
        space = UserAccount::LEN,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub root_user: Account<'info, UserAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        init,
        payer = payer,
        space = UserAccount::LEN,
        seeds = [b"user", payer.key().as_ref()],
        bump
    )]
    pub new_user: Account<'info, UserAccount>,

    #[account(mut)]
    pub sponsor_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub upline1_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub upline2_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub upline3_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateLevel<'info> {
    #[account(
        mut,
        seeds = [b"state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [b"user", payer.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub payer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient1_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient2_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient3_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
