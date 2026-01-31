/**
 * ClawdX Solana Integration
 * 
 * Complete infrastructure for the $CLAWD AI Economy token.
 * 
 * Modules:
 * - wallet.ts: Phantom-compatible wallet generation and management
 * - pump-fun.ts: pump.fun bonding curve integration
 * - token-launch.ts: Full launch orchestration
 * - faucet-collector.ts: Bootstrap funding via faucets
 * 
 * @author ClawdX Team
 * @version 1.0.0
 */

export * from './wallet';
export * from './pump-fun';
export * from './token-launch';
export * from './faucet-collector';

// Re-export main classes as defaults
export { ClawdXWalletManager } from './wallet';
export { PumpFunLauncher } from './pump-fun';
export { TokenLaunchOrchestrator, CLAWD_TOKEN_CONFIG } from './token-launch';
export { FaucetCollector, FaucetStrategy } from './faucet-collector';
