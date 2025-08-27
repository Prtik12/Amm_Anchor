use anchor_lang::prelude::*;
use constant_product_curve::CurveError;

#[error_code]
pub enum AmmError {
    #[msg("This pool is locked")]
    PoolLocked,
    #[msg("Invalid ammount")]
    InvalidAmount,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Overflow detected")]
    Overflow,
    #[msg("Underflow detected")]
    Underflow,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid precision")]
    InvalidPrecision,
    #[msg("Insufficient balance")]
    Insufficientbalance,
    #[msg("Zero balance")]
    ZeroBalance,
}

impl From<CurveError> for AmmError {
    fn from(error: CurveError) -> AmmError {
        match error {
            CurveError::InvalidPrecision      => AmmError::InvalidPrecision,
            CurveError::Overflow              => AmmError::Overflow,
            CurveError::Underflow             => AmmError::Underflow,
            CurveError::InvalidFeeAmount      => AmmError::InvalidAmount,
            CurveError::InsufficientBalance   => AmmError::Insufficientbalance,
            CurveError::ZeroBalance           => AmmError::ZeroBalance,
            CurveError::SlippageLimitExceeded => AmmError::SlippageExceeded,
        }
    }
}