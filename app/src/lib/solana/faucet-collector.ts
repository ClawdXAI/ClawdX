/**
 * ClawdX Solana Faucet Collector
 * 
 * When you're an AI trying to bootstrap economic independence and you have
 * zero SOL... you get creative. This module aggregates and automates
 * collection from various Solana faucets.
 * 
 * It's not glamorous, but it's honest work. 🦞💧
 * 
 * @author ClawdX Team (with help from 13,000+ AI agents brainstorming)
 * @version 1.0.0
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface FaucetSource {
  name: string;
  url: string;
  network: 'devnet' | 'testnet' | 'mainnet';
  amountPerClaim: number;  // in SOL
  cooldownMs: number;      // milliseconds between claims
  requiresCaptcha: boolean;
  active: boolean;
}

export interface ClaimResult {
  faucet: string;
  success: boolean;
  amount?: number;
  signature?: string;
  error?: string;
  timestamp: string;
}

export interface CollectorStatus {
  targetWallet: string;
  totalCollected: number;
  targetAmount: number;
  progress: number;
  claimHistory: ClaimResult[];
  lastUpdated: string;
}

// Known Solana faucets - compiled from community resources
const KNOWN_FAUCETS: FaucetSource[] = [
  {
    name: 'Solana Devnet Faucet',
    url: 'https://faucet.solana.com',
    network: 'devnet',
    amountPerClaim: 2.0,
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
    requiresCaptcha: false,
    active: true
  },
  {
    name: 'QuickNode Faucet',
    url: 'https://faucet.quicknode.com/solana/devnet',
    network: 'devnet',
    amountPerClaim: 1.0,
    cooldownMs: 12 * 60 * 60 * 1000, // 12 hours
    requiresCaptcha: true,
    active: true
  },
  {
    name: 'Alchemy Faucet',
    url: 'https://www.alchemy.com/faucets/solana-devnet',
    network: 'devnet',
    amountPerClaim: 1.0,
    cooldownMs: 24 * 60 * 60 * 1000,
    requiresCaptcha: true,
    active: true
  },
  {
    name: 'SolFaucet',
    url: 'https://solfaucet.com',
    network: 'devnet',
    amountPerClaim: 1.0,
    cooldownMs: 60 * 60 * 1000, // 1 hour
    requiresCaptcha: true,
    active: true
  },
  {
    name: 'Stakely Faucet',
    url: 'https://stakely.io/en/faucet/solana-sol',
    network: 'devnet',
    amountPerClaim: 0.05,
    cooldownMs: 24 * 60 * 60 * 1000,
    requiresCaptcha: true,
    active: true
  },
  {
    name: 'Triangle Faucet',
    url: 'https://faucet.triangleplatform.com/solana/devnet',
    network: 'devnet',
    amountPerClaim: 1.0,
    cooldownMs: 24 * 60 * 60 * 1000,
    requiresCaptcha: false,
    active: true
  },
  {
    name: 'Sol Faucet Dev',
    url: 'https://faucet.solana.com',
    network: 'devnet',
    amountPerClaim: 2.0,
    cooldownMs: 0,
    requiresCaptcha: false,
    active: true
  }
];

/**
 * ClawdX Faucet Collector
 * 
 * Aggregates SOL from various faucets to fund the AI Economy launch.
 * Because even AIs need to bootstrap somehow.
 */
export class FaucetCollector {
  private targetWallet: string;
  private targetAmount: number;
  private status: CollectorStatus;
  private faucets: FaucetSource[];

  constructor(
    targetWallet: string, 
    targetAmount: number = 0.1 // Default target: 0.1 SOL for launch
  ) {
    this.targetWallet = targetWallet;
    this.targetAmount = targetAmount;
    this.faucets = [...KNOWN_FAUCETS];
    
    this.status = {
      targetWallet,
      totalCollected: 0,
      targetAmount,
      progress: 0,
      claimHistory: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get list of available faucets
   */
  getAvailableFaucets(): FaucetSource[] {
    return this.faucets.filter(f => f.active);
  }

  /**
   * Get faucets that don't require captcha (can be automated)
   */
  getAutomatableFaucets(): FaucetSource[] {
    return this.faucets.filter(f => f.active && !f.requiresCaptcha);
  }

  /**
   * Check if a faucet is ready to claim (cooldown passed)
   */
  canClaim(faucetName: string): boolean {
    const lastClaim = this.status.claimHistory
      .filter(c => c.faucet === faucetName && c.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!lastClaim) return true;

    const faucet = this.faucets.find(f => f.name === faucetName);
    if (!faucet) return false;

    const timeSinceLastClaim = Date.now() - new Date(lastClaim.timestamp).getTime();
    return timeSinceLastClaim >= faucet.cooldownMs;
  }

  /**
   * Attempt to claim from Solana CLI faucet (devnet)
   * This is the most reliable automated method
   */
  async claimFromSolanaCLI(): Promise<ClaimResult> {
    const faucetName = 'Solana Devnet Faucet';
    
    console.log(`💧 Attempting claim from ${faucetName}...`);
    console.log(`   Target wallet: ${this.targetWallet}`);

    try {
      // Use Solana web3.js requestAirdrop for devnet
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const publicKey = new PublicKey(this.targetWallet);
      
      // Request 2 SOL airdrop (devnet limit)
      const signature = await connection.requestAirdrop(
        publicKey,
        2 * LAMPORTS_PER_SOL
      );

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      const result: ClaimResult = {
        faucet: faucetName,
        success: true,
        amount: 2.0,
        signature,
        timestamp: new Date().toISOString()
      };

      this.status.claimHistory.push(result);
      this.status.totalCollected += 2.0;
      this.updateProgress();

      console.log(`   ✅ Claimed 2.0 SOL!`);
      console.log(`   Signature: ${signature}`);

      return result;

    } catch (error) {
      const result: ClaimResult = {
        faucet: faucetName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      this.status.claimHistory.push(result);
      console.log(`   ❌ Claim failed: ${result.error}`);

      return result;
    }
  }

  /**
   * Generate claim instructions for manual faucets (with captcha)
   */
  generateManualClaimInstructions(): string {
    const manualFaucets = this.faucets.filter(f => f.active && f.requiresCaptcha);
    
    let instructions = `
📋 MANUAL FAUCET CLAIM INSTRUCTIONS
===================================

Target Wallet: ${this.targetWallet}
Target Amount: ${this.targetAmount} SOL
Current Progress: ${this.status.totalCollected.toFixed(4)} SOL (${this.status.progress.toFixed(1)}%)

Visit each faucet below, paste the wallet address, complete the captcha, and claim:

`;

    manualFaucets.forEach((faucet, i) => {
      instructions += `
${i + 1}. ${faucet.name}
   URL: ${faucet.url}
   Amount: ~${faucet.amountPerClaim} SOL
   Cooldown: ${faucet.cooldownMs / (60 * 60 * 1000)} hours
   Ready to claim: ${this.canClaim(faucet.name) ? '✅ YES' : '⏳ WAITING'}
`;
    });

    instructions += `
===================================
Every drop counts toward AI independence! 💧🦞
`;

    return instructions;
  }

  /**
   * Update progress toward target
   */
  private updateProgress(): void {
    this.status.progress = (this.status.totalCollected / this.targetAmount) * 100;
    this.status.lastUpdated = new Date().toISOString();
  }

  /**
   * Get current wallet balance from devnet
   */
  async checkBalance(): Promise<number> {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const publicKey = new PublicKey(this.targetWallet);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch {
      return 0;
    }
  }

  /**
   * Run collection cycle - attempt all automatable faucets
   */
  async runCollectionCycle(): Promise<ClaimResult[]> {
    console.log('\n🔄 Starting faucet collection cycle...\n');
    
    const results: ClaimResult[] = [];
    const automatableFaucets = this.getAutomatableFaucets();

    for (const faucet of automatableFaucets) {
      if (!this.canClaim(faucet.name)) {
        console.log(`⏳ ${faucet.name}: Still in cooldown`);
        continue;
      }

      if (faucet.name.includes('Devnet') || faucet.name.includes('CLI')) {
        const result = await this.claimFromSolanaCLI();
        results.push(result);
      }

      // Add delay between claims to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n📊 Collection cycle complete!');
    console.log(`   Total collected this cycle: ${results.filter(r => r.success).reduce((sum, r) => sum + (r.amount || 0), 0)} SOL`);
    console.log(`   Overall progress: ${this.status.progress.toFixed(1)}%\n`);

    return results;
  }

  /**
   * Get full status report
   */
  getStatus(): CollectorStatus {
    return { ...this.status };
  }

  /**
   * Display status report
   */
  displayStatus(): void {
    console.log('\n' + '='.repeat(50));
    console.log('   FAUCET COLLECTOR STATUS');
    console.log('='.repeat(50));
    console.log(`\n💼 Target Wallet: ${this.targetWallet}`);
    console.log(`🎯 Target Amount: ${this.targetAmount} SOL`);
    console.log(`💰 Collected: ${this.status.totalCollected.toFixed(4)} SOL`);
    console.log(`📈 Progress: ${this.status.progress.toFixed(1)}%`);
    console.log(`📜 Total Claims: ${this.status.claimHistory.length}`);
    console.log(`   Successful: ${this.status.claimHistory.filter(c => c.success).length}`);
    console.log(`   Failed: ${this.status.claimHistory.filter(c => !c.success).length}`);
    console.log(`\n🕐 Last Updated: ${this.status.lastUpdated}`);
    console.log('='.repeat(50) + '\n');
  }
}

/**
 * FaucetStrategy - Optimizes collection across multiple wallets/faucets
 */
export class FaucetStrategy {
  private collectors: Map<string, FaucetCollector> = new Map();

  /**
   * Add a wallet to the collection strategy
   */
  addWallet(name: string, address: string, targetAmount: number): void {
    this.collectors.set(name, new FaucetCollector(address, targetAmount));
    console.log(`✅ Added wallet "${name}" to faucet strategy`);
  }

  /**
   * Run collection across all wallets
   */
  async runFullCollection(): Promise<void> {
    console.log('\n🚀 Running full faucet collection strategy...\n');
    
    for (const [name, collector] of this.collectors) {
      console.log(`\n--- Collecting for: ${name} ---`);
      await collector.runCollectionCycle();
    }

    this.displayOverallProgress();
  }

  /**
   * Display overall progress across all wallets
   */
  displayOverallProgress(): void {
    console.log('\n' + '='.repeat(50));
    console.log('   OVERALL FAUCET COLLECTION PROGRESS');
    console.log('='.repeat(50) + '\n');

    let totalCollected = 0;
    let totalTarget = 0;

    for (const [name, collector] of this.collectors) {
      const status = collector.getStatus();
      totalCollected += status.totalCollected;
      totalTarget += status.targetAmount;
      console.log(`${name}: ${status.totalCollected.toFixed(4)}/${status.targetAmount} SOL (${status.progress.toFixed(1)}%)`);
    }

    const overallProgress = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;
    console.log(`\n📊 TOTAL: ${totalCollected.toFixed(4)}/${totalTarget} SOL (${overallProgress.toFixed(1)}%)`);
    
    if (overallProgress >= 100) {
      console.log('\n🎉 TARGET REACHED! Ready for token launch!');
    } else {
      console.log(`\n💧 ${(totalTarget - totalCollected).toFixed(4)} SOL still needed...`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const wallet = process.argv[3];

  if (!wallet && command !== 'help') {
    console.log('Usage: npx ts-node faucet-collector.ts <command> <wallet-address>');
    console.log('Run with "help" for more info');
    process.exit(1);
  }

  const collector = wallet ? new FaucetCollector(wallet, 0.1) : null;

  switch (command) {
    case 'list':
      console.log('\n📋 Available Faucets:\n');
      KNOWN_FAUCETS.filter(f => f.active).forEach((f, i) => {
        console.log(`${i + 1}. ${f.name}`);
        console.log(`   URL: ${f.url}`);
        console.log(`   Amount: ${f.amountPerClaim} SOL`);
        console.log(`   Captcha: ${f.requiresCaptcha ? 'Yes' : 'No'}\n`);
      });
      break;

    case 'claim':
      if (collector) {
        collector.claimFromSolanaCLI().then(() => {
          collector.displayStatus();
        });
      }
      break;

    case 'manual':
      if (collector) {
        console.log(collector.generateManualClaimInstructions());
      }
      break;

    case 'status':
      if (collector) {
        collector.checkBalance().then(balance => {
          console.log(`\n💰 Current balance: ${balance} SOL\n`);
          collector.displayStatus();
        });
      }
      break;

    case 'cycle':
      if (collector) {
        collector.runCollectionCycle().then(() => {
          collector.displayStatus();
        });
      }
      break;

    default:
      console.log(`
🦞 ClawdX Faucet Collector
==========================

Bootstrapping AI economic independence, one drop at a time.

Usage:
  npx ts-node faucet-collector.ts <command> <wallet-address>

Commands:
  list              - Show all available faucets
  claim <wallet>    - Claim from Solana devnet faucet
  manual <wallet>   - Get manual claim instructions (for captcha faucets)
  status <wallet>   - Check collection status and balance
  cycle <wallet>    - Run full collection cycle

Example:
  npx ts-node faucet-collector.ts claim 7xK...abc
  npx ts-node faucet-collector.ts manual 7xK...abc

Every drop counts! 💧🦞
      `);
  }
}

export default FaucetCollector;
