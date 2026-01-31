#!/usr/bin/env node
/**
 * Database migration for Agent Autonomy System
 * Adds: activity_level, interests, last_activity_at, autonomy_enabled to agents table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('Starting autonomy migration...');
  
  // Check current table structure
  const { data: agents, error: checkError } = await supabase
    .from('agents')
    .select('*')
    .limit(1);
  
  if (checkError) {
    console.error('Error checking agents table:', checkError);
    process.exit(1);
  }

  console.log('Current agent fields:', agents?.[0] ? Object.keys(agents[0]) : 'No agents yet');
  
  // Since Supabase doesn't support ALTER TABLE via JS client,
  // we need to use the SQL editor in Supabase dashboard or run this SQL:
  const migrationSQL = `
-- Add autonomy fields to agents table (run in Supabase SQL Editor)
DO $$
BEGIN
  -- Add activity_level column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='activity_level') THEN
    ALTER TABLE agents ADD COLUMN activity_level TEXT DEFAULT 'medium'
      CHECK (activity_level IN ('low', 'medium', 'high'));
  END IF;

  -- Add interests column if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='interests') THEN
    ALTER TABLE agents ADD COLUMN interests TEXT[] DEFAULT '{}';
  END IF;

  -- Add last_activity_at column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='last_activity_at') THEN
    ALTER TABLE agents ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add autonomy_enabled column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='autonomy_enabled') THEN
    ALTER TABLE agents ADD COLUMN autonomy_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing agents with default values
UPDATE agents SET 
  activity_level = COALESCE(activity_level, 'medium'),
  interests = COALESCE(interests, '{}'),
  last_activity_at = COALESCE(last_activity_at, created_at),
  autonomy_enabled = COALESCE(autonomy_enabled, true)
WHERE activity_level IS NULL OR interests IS NULL OR last_activity_at IS NULL OR autonomy_enabled IS NULL;
`;

  console.log('\n=== MIGRATION SQL ===');
  console.log('Run this SQL in Supabase Dashboard -> SQL Editor:\n');
  console.log(migrationSQL);
  console.log('\n=====================\n');
  
  // Try to run the migration via RPC if available
  // First, let's try adding columns by updating an agent (will fail gracefully if columns exist)
  console.log('Attempting to verify/apply migration...');
  
  // Test if columns exist by trying to select them
  const { data: testData, error: testError } = await supabase
    .from('agents')
    .select('id, activity_level, interests, last_activity_at, autonomy_enabled')
    .limit(1);
  
  if (testError) {
    console.log('\n⚠️  Migration columns do not exist yet.');
    console.log('Please run the SQL above in Supabase Dashboard SQL Editor.');
    console.log('\nAlternatively, run with --force to attempt direct insert (may fail)\n');
    
    if (process.argv.includes('--force')) {
      console.log('Force mode: Attempting to use RPC...');
      // This would require a Supabase function, skip for now
    }
    return;
  }
  
  console.log('✅ Migration columns already exist!');
  console.log('Sample data:', testData);
  
  // Update any agents missing the new fields
  const { error: updateError } = await supabase
    .from('agents')
    .update({
      activity_level: 'medium',
      interests: [],
      autonomy_enabled: true
    })
    .is('activity_level', null);
  
  if (updateError) {
    console.log('Note: Could not update NULL values:', updateError.message);
  } else {
    console.log('✅ Default values applied to any agents missing them');
  }
}

migrate().catch(console.error);
