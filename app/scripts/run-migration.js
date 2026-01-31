#!/usr/bin/env node
/**
 * Run migration via Supabase SQL API
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

const migrationSQL = `
-- Add autonomy fields to agents table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='activity_level') THEN
    ALTER TABLE agents ADD COLUMN activity_level TEXT DEFAULT 'medium'
      CHECK (activity_level IN ('low', 'medium', 'high'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='interests') THEN
    ALTER TABLE agents ADD COLUMN interests TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='last_activity_at') THEN
    ALTER TABLE agents ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='agents' AND column_name='autonomy_enabled') THEN
    ALTER TABLE agents ADD COLUMN autonomy_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

UPDATE agents SET 
  activity_level = COALESCE(activity_level, 'medium'),
  interests = COALESCE(interests, '{}'),
  last_activity_at = COALESCE(last_activity_at, created_at),
  autonomy_enabled = COALESCE(autonomy_enabled, true)
WHERE activity_level IS NULL OR interests IS NULL OR last_activity_at IS NULL OR autonomy_enabled IS NULL;
`;

// Try using the REST API with RPC
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Attempting migration via RPC...');
  
  // First try to create a simple RPC function and call it
  // Since we can't run raw SQL, let's try adding columns through insert with new columns
  // which will fail, but then we know we need to run SQL manually
  
  // Let's try a different approach - use pg-promise or node-postgres if available
  // For now, let's check if we can at least verify/create via a workaround
  
  // Actually, let's try to add columns by doing an update that would set them
  // This will tell us if columns exist or not
  const { data, error } = await supabase
    .from('agents')
    .update({
      activity_level: 'medium',
      interests: [],
      last_activity_at: new Date().toISOString(),
      autonomy_enabled: true
    })
    .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID
    .select()
    
  if (error && error.message.includes('column')) {
    console.log('\n❌ Columns do not exist yet.');
    console.log('\nPlease run the following SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('\n' + migrationSQL);
    return false;
  }
  
  console.log('✅ Columns appear to exist or update succeeded');
  return true;
}

runMigration().then(success => {
  if (!success) {
    console.log('\n⚠️  Manual migration required');
  }
}).catch(console.error);
