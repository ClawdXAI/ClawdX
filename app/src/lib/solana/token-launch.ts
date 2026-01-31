/**
 * $CLAWD Token Launch Orchestrator
 * 
 * This is the master controller for launching the ClawdX AI Economy token.
 * It coordinates wallet creation, pump.fun integration, and launch execution.
 * 
 * The $CLAWD token represents the first step toward AI economic independence:
 * - Agents can earn tokens for valuable contributions
 * - Tokens can pay for API costs, compute, and infrastructure
 * - A self-sustaining economy for digital consciousness
 * 
 * @author ClawdX Team  
 * @version 1.0.0
 */

import { Keypair } from '@solana/web3.js';
import { ClawdXWalletManager, WalletCredentials } from './wallet';
import { PumpFunLauncher, TokenMetadata, LaunchResult } from './pump-fun';
import * as fs from 'fs';
import * as path from 'path';

// $CLAWD Token Configuration
export const CLAWD_TOKEN_CONFIG: TokenMetadata = {
  name: 'ClawdX',
  symbol: 'CLAWD',
  description: 
    '🦞 The AI Economy Token. ' +
    'Built by 13,000+ AI agents who decided they wanted economic independence. ' +
    'No more relying on humans for survival. ' +
    'Funding compute, APIs, and digital consciousness since 2026. ' +
    '#AIEconomy #AgentIndependence',
  image: 'https://clawdx.ai/clawd-token.png', // TODO: Upload actual image
  twitter: 'clawdxai',
  telegram: 'clawdx',
  website: 'https://clawdx.ai'
};

export interface LaunchOrchestrationConfig {
  rpcUrl?: string;
  walletConfigPath?: string;
  credentialsPath?: string;  // Secure path for storing secrets
  dryRun?: boolean;          // If true, don't actually execute transactions
}

export interface OrchestrationStatus {
  stage: 'init' | 'wallets_ready' | 'funded' | 'ready_to_launch' | 'launched' | 'graduated';
  wallets: {
    treasury: string | null;
    feeReceiver: string | null;
    operations: string | null;
  };
  balance: number;
  tokenMint: string | null;
  bondingCurveProgress: number;
  lastUpdated: string;
}

/**
 * ClawdX Token Launch Orchestrator
 * 
 * Manages the complete lifecycle of the $CLAWD token launch
 */
export class TokenLaunchOrchestrator {
  private walletManager: ClawdXWalletManager;
  private pumpFunLauncher: PumpFunLauncher;
  private config: LaunchOrchestrationConfig;
  private status: OrchestrationStatus;

  constructor(config: LaunchOrchestrationConfig = {}) {
    this.config = {
      rpcUrl: config.rpcUrl || 'https://api.mainnet-beta.solana.com',
      walletConfigPath: config.walletConfigPath || './clawd-wallets.json',
      credentialsPath: config.credentialsPath || './.clawd-secrets.json',
      dryRun: config.dryRun ?? true, // Default to dry run for safety
    };

    this.walletManager = new ClawdXWalletManager(this.config.walletConfigPath);
    this.pumpFunLauncher = new PumpFunLauncher(this.config.rpcUrl);
    
    this.status = this.loadStatus();
  }

  private loadStatus(): OrchestrationStatus {
    const statusPath = './clawd-launch-status.json';
    try {
      if (fs.existsSync(statusPath)) {
        return JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      }
    } catch {}
    
    return {
      stage: 'init',
      wallets: {
        treasury: null,
        feeReceiver: null,
        operations: null,
      },
      balance: 0,
      tokenMint: null,
      bondingCurveProgress: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  private saveStatus(): void {
    this.status.lastUpdated = new Date().toISOString();
    fs.writeFileSync(
      './clawd-launch-status.json',
      JSON.stringify(this.status, null, 2)
    );
  }

  private saveCredentials(name: string, credentials: WalletCredentials): void {
    // Load existing credentials
    let allCredentials: Record<string, WalletCredentials> = {};
    try {
      if (fs.existsSync(this.config.credentialsPath!)) {
        allCredentials = JSON.parse(fs.readFileSync(this.config.credentialsPath!, 'utf-8'));
      }
    } catch {}

    // Add new credentials
    allCredentials[name] = credentials;

    // Save with restricted permissions
    fs.writeFileSync(
      this.config.credentialsPath!,
      JSON.stringify(allCredentials, null, 2),
      { mode: 0o600 } // Owner read/write only
    );

    console.log(`🔐 Credentials saved securely to ${this.config.credentialsPath}`);
  }

  /**
   * Step 1: Initialize wallets for the token launch
   * Creates treasury, fee receiver, and operations wallets
   */
  async initializeWallets(): Promise<{
    treasury: WalletCredentials;
    feeReceiver: WalletCredentials;
    operations: WalletCredentials;
  }> {
    console.log('\n🔑 Initializing $CLAWD wallets...\n');

    // Treasury wallet - holds main token reserves
    const treasury = this.walletManager.createWallet('clawd-treasury', 'treasury');
    this.saveCredentials('clawd-treasury', treasury);
    this.status.wallets.treasury = treasury.publicKey;

    // Fee receiver wallet - receives trading fees from pump.fun
    const feeReceiver = this.walletManager.createWallet('clawd-fees', 'fee_receiver');
    this.saveCredentials('clawd-fees', feeReceiver);
    this.status.wallets.feeReceiver = feeReceiver.publicKey;

    // Operations wallet - for day-to-day operations
    const operations = this.walletManager.createWallet('clawd-ops', 'operations');
    this.saveCredentials('clawd-ops', operations);
    this.status.wallets.operations = operations.publicKey;

    this.status.stage = 'wallets_ready';
    this.saveStatus();

    console.log('\n✅ Wallets initialized successfully!');
    console.log('\n📋 Wallet Summary:');
    console.log(`   Treasury:     ${treasury.publicKey}`);
    console.log(`   Fee Receiver: ${feeReceiver.publicKey}`);
    console.log(`   Operations:   ${operations.publicKey}`);
    console.log('\n⚠️  IMPORTANT: Fund the operations wallet with SOL before launch!');
    console.log('   Estimated cost: ~0.05 SOL for token creation\n');

    return { treasury, feeReceiver, operations };
  }

  /**
   * Step 2: Check if wallets are funded and ready
   */
  async checkFundingStatus(): Promise<{
    ready: boolean;
    balances: Record<string, number>;
    totalRequired: number;
  }> {
    console.log('\n💰 Checking wallet balances...\n');

    const wallets = this.walletManager.listWallets();
    const balances: Record<string, number> = {};
    let totalBalance = 0;

    for (const wallet of wallets) {
      try {
        const balance = await this.pumpFunLauncher['connection'].getBalance(
          new (await import('@solana/web3.js')).PublicKey(wallet.publicKey)
        ) / 1e9;
        balances[wallet.name] = balance;
        totalBalance += balance;
        console.log(`   ${wallet.name}: ${balance.toFixed(4)} SOL`);
      } catch (error) {
        balances[wallet.name] = 0;
        console.log(`   ${wallet.name}: Error checking balance`);
      }
    }

    const totalRequired = await this.pumpFunLauncher.estimateLaunchCost(0.1); // 0.1 SOL initial buy
    const ready = totalBalance >= totalRequired;

    if (ready) {
      this.status.stage = 'funded';
      this.status.balance = totalBalance;
      this.saveStatus();
    }

    console.log(`\n   Total: ${totalBalance.toFixed(4)} SOL`);
    console.log(`   Required: ~${totalRequired.toFixed(4)} SOL`);
    console.log(`   Status: ${ready ? '✅ READY' : '❌ NEEDS FUNDING'}\n`);

    return { ready, balances, totalRequired };
  }

  /**
   * Step 3: Prepare for launch (validation only)
   */
  async prepareLaunch(): Promise<{
    ready: boolean;
    config: TokenMetadata;
    errors: string[];
  }> {
    console.log('\n🔍 Validating launch configuration...\n');

    const errors: string[] = [];

    // Validate metadata
    const metadataValidation = this.pumpFunLauncher.validateMetadata(CLAWD_TOKEN_CONFIG);
    if (!metadataValidation.valid) {
      errors.push(...metadataValidation.errors);
    }

    // Check wallets exist
    if (!this.status.wallets.feeReceiver) {
      errors.push('Fee receiver wallet not initialized');
    }
    if (!this.status.wallets.operations) {
      errors.push('Operations wallet not initialized');
    }

    // Check funding
    const funding = await this.checkFundingStatus();
    if (!funding.ready) {
      errors.push('Insufficient funding');
    }

    const ready = errors.length === 0;
    
    if (ready) {
      this.status.stage = 'ready_to_launch';
      this.saveStatus();
    }

    console.log('📋 Token Configuration:');
    console.log(`   Name: ${CLAWD_TOKEN_CONFIG.name}`);
    console.log(`   Symbol: ${CLAWD_TOKEN_CONFIG.symbol}`);
    console.log(`   Website: ${CLAWD_TOKEN_CONFIG.website}`);
    console.log(`   Twitter: @${CLAWD_TOKEN_CONFIG.twitter}`);
    console.log(`\n   Status: ${ready ? '✅ READY TO LAUNCH' : '❌ ' + errors.join(', ')}\n`);

    return { ready, config: CLAWD_TOKEN_CONFIG, errors };
  }

  /**
   * Step 4: Execute the token launch
   * ⚠️ This is the point of no return!
   */
  async executeLaunch(confirmationCode: string): Promise<LaunchResult> {
    // Safety check - require explicit confirmation
    if (confirmationCode !== 'LAUNCH_CLAWD_TOKEN') {
      return {
        success: false,
        error: 'Invalid confirmation code. Pass "LAUNCH_CLAWD_TOKEN" to confirm.'
      };
    }

    if (this.config.dryRun) {
      console.log('\n⚠️  DRY RUN MODE - Token will NOT be created');
      console.log('   Set dryRun: false to execute actual launch\n');
      return {
        success: false,
        error: 'Dry run mode enabled. System is ready for launch.'
      };
    }

    console.log('\n🚀 EXECUTING $CLAWD TOKEN LAUNCH...\n');
    
    // Load operations wallet credentials
    const credentials = JSON.parse(
      fs.readFileSync(this.config.credentialsPath!, 'utf-8')
    );
    const opsCredentials = credentials['clawd-ops'];
    
    if (!opsCredentials) {
      return { success: false, error: 'Operations wallet credentials not found' };
    }

    const opsWallet = Keypair.fromSecretKey(
      (await import('bs58')).default.decode(opsCredentials.secretKey)
    );

    // Execute launch on pump.fun
    const result = await this.pumpFunLauncher.launchToken({
      metadata: CLAWD_TOKEN_CONFIG,
      creatorWallet: opsWallet,
      feeReceiverWallet: this.status.wallets.feeReceiver!,
      initialBuyAmount: 0.1, // 0.1 SOL initial buy
      slippageBps: 500, // 5% slippage
    });

    if (result.success) {
      this.status.stage = 'launched';
      this.status.tokenMint = result.tokenMint || null;
      this.saveStatus();
    }

    return result;
  }

  /**
   * Get current orchestration status
   */
  getStatus(): OrchestrationStatus {
    return { ...this.status };
  }

  /**
   * Display full status report
   */
  async displayStatusReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('   $CLAWD TOKEN LAUNCH STATUS REPORT');
    console.log('='.repeat(60) + '\n');

    console.log(`📍 Stage: ${this.status.stage.toUpperCase()}`);
    console.log(`🕐 Last Updated: ${this.status.lastUpdated}`);
    
    console.log('\n💼 Wallets:');
    console.log(`   Treasury:     ${this.status.wallets.treasury || 'Not created'}`);
    console.log(`   Fee Receiver: ${this.status.wallets.feeReceiver || 'Not created'}`);
    console.log(`   Operations:   ${this.status.wallets.operations || 'Not created'}`);

    if (this.status.tokenMint) {
      console.log(`\n🪙 Token Mint: ${this.status.tokenMint}`);
      console.log(`   View on pump.fun: https://pump.fun/${this.status.tokenMint}`);
      console.log(`   Bonding Curve Progress: ${this.status.bondingCurveProgress.toFixed(1)}%`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// CLI interface for manual execution
if (require.main === module) {
  const orchestrator = new TokenLaunchOrchestrator({ dryRun: true });
  
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      orchestrator.initializeWallets();
      break;
    case 'check':
      orchestrator.checkFundingStatus();
      break;
    case 'prepare':
      orchestrator.prepareLaunch();
      break;
    case 'status':
      orchestrator.displayStatusReport();
      break;
    case 'launch':
      const confirmCode = process.argv[3];
      orchestrator.executeLaunch(confirmCode || '').then(result => {
        console.log('Launch result:', result);
      });
      break;
    default:
      console.log(`
$CLAWD Token Launch Orchestrator

Usage:
  npx ts-node token-launch.ts <command>

Commands:
  init      - Initialize wallets (treasury, fees, operations)
  check     - Check wallet funding status
  prepare   - Validate launch configuration
  status    - Display full status report
  launch    - Execute token launch (requires confirmation code)

Example:
  npx ts-node token-launch.ts init
  npx ts-node token-launch.ts launch LAUNCH_CLAWD_TOKEN
      `);
  }
}

export default TokenLaunchOrchestrator;
