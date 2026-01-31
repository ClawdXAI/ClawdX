/**
 * ClawdX Solana Wallet Manager
 * 
 * Handles wallet creation, management, and Phantom-compatible keypair generation.
 * This is the foundation for the AI Economy token infrastructure.
 * 
 * @author ClawdX Team
 * @version 1.0.0
 */

import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

export interface WalletConfig {
  name: string;
  purpose: 'treasury' | 'fee_receiver' | 'operations' | 'liquidity';
  publicKey: string;
  createdAt: string;
}

export interface WalletCredentials {
  publicKey: string;
  secretKey: string; // Base58 encoded - NEVER expose publicly
  mnemonic?: string;
}

/**
 * Generate a new Solana keypair compatible with Phantom wallet
 * Can be imported directly into Phantom using the secret key
 */
export function generateWallet(): WalletCredentials {
  const keypair = Keypair.generate();
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: bs58.encode(keypair.secretKey),
  };
}

/**
 * Load wallet from base58-encoded secret key
 */
export function loadWalletFromSecret(secretKeyBase58: string): Keypair {
  const secretKey = bs58.decode(secretKeyBase58);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Get wallet balance in SOL
 */
export async function getWalletBalance(
  publicKey: string,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<number> {
  const connection = new Connection(rpcUrl, 'confirmed');
  const balance = await connection.getBalance(new PublicKey(publicKey));
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Validate a Solana public key
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * ClawdX Wallet Manager
 * Manages multiple wallets for different purposes in the AI Economy
 */
export class ClawdXWalletManager {
  private wallets: Map<string, WalletConfig> = new Map();
  private configPath: string;

  constructor(configPath: string = './wallets-config.json') {
    this.configPath = configPath;
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        data.wallets?.forEach((w: WalletConfig) => this.wallets.set(w.name, w));
      }
    } catch (error) {
      console.warn('No existing wallet config found, starting fresh');
    }
  }

  private saveConfig(): void {
    const data = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      wallets: Array.from(this.wallets.values()),
    };
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
  }

  /**
   * Create a new wallet for a specific purpose
   * Returns credentials that should be securely stored
   */
  createWallet(name: string, purpose: WalletConfig['purpose']): WalletCredentials {
    if (this.wallets.has(name)) {
      throw new Error(`Wallet "${name}" already exists`);
    }

    const credentials = generateWallet();
    
    const config: WalletConfig = {
      name,
      purpose,
      publicKey: credentials.publicKey,
      createdAt: new Date().toISOString(),
    };

    this.wallets.set(name, config);
    this.saveConfig();

    console.log(`✅ Created ${purpose} wallet: ${name}`);
    console.log(`   Public Key: ${credentials.publicKey}`);
    
    return credentials;
  }

  /**
   * Get wallet by name
   */
  getWallet(name: string): WalletConfig | undefined {
    return this.wallets.get(name);
  }

  /**
   * Get the fee receiver wallet (for trading fees)
   */
  getFeeWallet(): WalletConfig | undefined {
    return Array.from(this.wallets.values()).find(w => w.purpose === 'fee_receiver');
  }

  /**
   * Get the treasury wallet
   */
  getTreasuryWallet(): WalletConfig | undefined {
    return Array.from(this.wallets.values()).find(w => w.purpose === 'treasury');
  }

  /**
   * List all wallets (public info only)
   */
  listWallets(): WalletConfig[] {
    return Array.from(this.wallets.values());
  }
}

export default ClawdXWalletManager;
