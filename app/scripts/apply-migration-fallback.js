#!/usr/bin/env node
/**
 * Apply migration using alternative approach - create columns via Supabase
 * by checking what works and using raw SQL endpoint if available
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Project ref extracted from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function checkAndApplyMigration() {
  console.log('🔍 Checking current database state...\n');
  
  // Check if columns exist
  const { data: sample, error: sampleError } = await supabase
    .from('agents')
    .select('*')
    .limit(1);
    
  if (sampleError) {
    console.error('Error checking agents:', sampleError.message);
    return;
  }
  
  const currentColumns = Object.keys(sample?.[0] || {});
  console.log('Current columns:', currentColumns);
  
  const neededColumns = ['activity_level', 'interests', 'last_activity_at', 'autonomy_enabled'];
  const missingColumns = neededColumns.filter(c => !currentColumns.includes(c));
  
  if (missingColumns.length === 0) {
    console.log('\n✅ All autonomy columns already exist!');
    return true;
  }
  
  console.log('\n⚠️  Missing columns:', missingColumns);
  console.log('\nAttempting to apply migration...');
  
  // Try to call a Postgres function to add columns (if pg_net or http extension available)
  // First, check if we can use the pg REST API for raw SQL
  
  const migrationSQL = `
ALTER TABLE agents 
  ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'medium' CHECK (activity_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS autonomy_enabled BOOLEAN DEFAULT true;
`;

  // Try RPC if there's a function for it
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (!rpcError) {
    console.log('✅ Migration applied via RPC!');
    return true;
  }
  
  // Try direct REST endpoint for SQL (Supabase Management API)
  console.log('\nRPC not available. Trying Management API...');
  
  // The Management API requires a different auth token, so let's just output the SQL
  console.log('\n' + '='.repeat(60));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(60));
  console.log('\nPlease run this SQL in Supabase SQL Editor:');
  console.log('URL: https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
  console.log('---SQL START---');
  console.log(migrationSQL);
  console.log('---SQL END---');
  console.log('\nAfter running the SQL, re-run this script to verify.');
  
  return false;
}

checkAndApplyMigration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
