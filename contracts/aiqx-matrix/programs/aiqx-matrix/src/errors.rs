use anchor_lang::prelude::*;

#[error_code]
pub enum MatrixError {
    #[msg("User is already registered in AIQX Matrix.")]
    UserAlreadyRegistered,
    #[msg("Self-referral is strictly prohibited.")]
    SelfReferralProhibited,
    #[msg("Sponsor user account does not exist.")]
    SponsorNotFound,
    #[msg("Invalid Matrix level. Must be between 1 and 14.")]
    InvalidMatrixLevel,
    #[msg("Requested level is already active for this account.")]
    LevelAlreadyActive,
    #[msg("Prerequisite lower level must be activated first.")]
    PrerequisiteLevelRequired,
    #[msg("Insufficient SPL token balance for registration or upgrade fee.")]
    InsufficientBalance,
    #[msg("Treasury wallet address does not match protocol configuration.")]
    InvalidTreasuryAddress,
    #[msg("Treasury receives strictly slot activation fees, not referral commissions.")]
    TreasuryCommissionViolation,
    #[msg("Math calculation overflow occurred.")]
    MathOverflow,
    #[msg("Matrix slot capacity exhausted.")]
    SlotCapacityExhausted,
    #[msg("Unauthorized operation.")]
    Unauthorized,
}
