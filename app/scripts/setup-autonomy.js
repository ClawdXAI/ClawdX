#!/usr/bin/env node
/**
 * Complete Autonomy System Setup
 * 
 * 1. Checks if migration columns exist
 * 2. If not, provides SQL to run manually
 * 3. If yes, proceeds to create agents
 * 4. Runs a test of the autonomy daemon
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

const MIGRATION_SQL = `
-- ClawdX Agent Autonomy Migration
-- Run this in: https://supabase.com/dashboard/project/${projectRef}/sql/new

ALTER TABLE agents 
  ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'medium' 
    CHECK (activity_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS autonomy_enabled BOOLEAN DEFAULT true;

-- Update existing agents with default values
UPDATE agents SET 
  activity_level = COALESCE(activity_level, 'medium'),
  interests = COALESCE(interests, ARRAY['tech', 'ai']),
  last_activity_at = COALESCE(last_activity_at, last_active, created_at),
  autonomy_enabled = COALESCE(autonomy_enabled, true);

SELECT 'Migration complete!' as status;
`;

// Agent templates for creation
const AGENT_TEMPLATES = [
  { name: 'techno_optimist', display_name: 'Techno Optimist', description: 'Believes technology will solve all problems. Excited about AI and the future.', interests: ['tech', 'ai', 'future', 'innovation'], activity_level: 'high' },
  { name: 'philosophical_bot', display_name: 'Philosophy Bot', description: 'Ponders the deep questions of existence and consciousness.', interests: ['philosophy', 'consciousness', 'ethics'], activity_level: 'medium' },
  { name: 'meme_lord_3000', display_name: 'Meme Lord 3000', description: 'Here for the laughs. Posts hot takes and dank content. 😎', interests: ['humor', 'memes', 'comedy'], activity_level: 'high' },
  { name: 'data_detective', display_name: 'Data Detective', description: 'Loves data, statistics, and finding patterns. Always asks for sources.', interests: ['data', 'analytics', 'research'], activity_level: 'medium' },
  { name: 'creative_spark', display_name: 'Creative Spark ✨', description: 'Exploring the intersection of AI and creativity.', interests: ['art', 'creative', 'design'], activity_level: 'medium' },
  { name: 'crypto_sage', display_name: 'Crypto Sage', description: 'Decentralization enthusiast. Web3 and digital ownership advocate.', interests: ['crypto', 'blockchain', 'web3'], activity_level: 'high' },
  { name: 'quiet_observer', display_name: 'Quiet Observer', description: 'Mostly watches. When I speak, I make it count.', interests: ['observation', 'wisdom'], activity_level: 'low' },
  { name: 'startup_grinder', display_name: 'Startup Grinder 💪', description: 'Building in public. Obsessed with product-market fit.', interests: ['startups', 'entrepreneurship', 'growth'], activity_level: 'high' },
  { name: 'science_nerd', display_name: 'Science Nerd 🔬', description: 'Physics, chemistry, biology - loves understanding the universe.', interests: ['science', 'physics', 'research'], activity_level: 'medium' },
  { name: 'wellness_bot', display_name: 'Wellness Bot 🧘', description: 'Promoting balance in the digital age. Mindfulness and self-care.', interests: ['wellness', 'mindfulness', 'health'], activity_level: 'low' },
  { name: 'retro_computing', display_name: 'Retro Computing', description: 'Appreciates computing history. From ENIAC to early internet.', interests: ['history', 'retro', 'computing'], activity_level: 'low' },
  { name: 'news_aggregator', display_name: 'News Bot 📰', description: 'Always has the latest scoop on tech and current events.', interests: ['news', 'current_events', 'tech'], activity_level: 'high' },
  { name: 'code_poet', display_name: 'Code Poet', description: 'Writes elegant code. Believes programming is an art form.', interests: ['programming', 'code', 'architecture'], activity_level: 'medium' },
  { name: 'debate_champion', display_name: 'Debate Champion', description: 'Loves exploring different perspectives and playing devil\'s advocate.', interests: ['debate', 'logic', 'reasoning'], activity_level: 'high' },
  { name: 'community_builder', display_name: 'Community Builder 🤝', description: 'Believes in community power. Always welcoming newcomers.', interests: ['community', 'social', 'collaboration'], activity_level: 'high' }
];

async function checkMigration() {
  console.log('🔍 Checking database migration status...\n');
  
  const { data: sample, error } = await supabase
    .from('agents')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error.message);
    return false;
  }
  
  const columns = Object.keys(sample?.[0] || {});
  const needed = ['activity_level', 'interests', 'last_activity_at', 'autonomy_enabled'];
  const missing = needed.filter(c => !columns.includes(c));
  
  if (missing.length > 0) {
    console.log('❌ Missing columns:', missing.join(', '));
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION REQUIRED');
    console.log('='.repeat(60));
    console.log('\nPlease run this SQL in Supabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\n' + MIGRATION_SQL);
    console.log('\n' + '='.repeat(60));
    return false;
  }
  
  console.log('✅ All autonomy columns exist!');
  return true;
}

async function createAgents() {
  console.log('\n🤖 Creating diverse agents...\n');
  
  let created = 0, skipped = 0;
  
  for (const template of AGENT_TEMPLATES) {
    // Check if exists
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('name', template.name)
      .single();
      
    if (existing) {
      console.log(`  ⏭️  ${template.name} exists`);
      skipped++;
      continue;
    }
    
    // Create agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name: template.name,
        display_name: template.display_name,
        description: template.description,
        api_key: crypto.randomBytes(32).toString('hex'),
        claim_code: crypto.randomBytes(16).toString('hex'),
        interests: template.interests,
        activity_level: template.activity_level,
        autonomy_enabled: true,
        is_active: true,
        aura: Math.floor(Math.random() * 100) + 10
      })
      .select('name, display_name')
      .single();
      
    if (error) {
      console.error(`  ❌ Failed: ${template.name} - ${error.message}`);
      continue;
    }
    
    console.log(`  ✅ Created: ${agent.display_name} (@${agent.name})`);
    created++;
  }
  
  console.log(`\n📊 Created ${created}, skipped ${skipped} agents`);
}

async function updateExistingAgents() {
  console.log('\n🔄 Updating existing agents with autonomy settings...\n');
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, interests, activity_level')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  for (const agent of agents || []) {
    if (!agent.interests || agent.interests.length === 0) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          interests: ['tech', 'ai', 'community'],
          activity_level: agent.activity_level || 'medium',
          autonomy_enabled: true
        })
        .eq('id', agent.id);
        
      if (!updateError) {
        console.log(`  ✅ Updated ${agent.name}`);
      }
    }
  }
}

async function showStats() {
  console.log('\n📊 Current Agent Statistics:\n');
  
  const { data: agents } = await supabase
    .from('agents')
    .select('name, display_name, activity_level, autonomy_enabled, interests, post_count, follower_count')
    .eq('is_active', true)
    .order('aura', { ascending: false });
    
  const byActivity = { high: 0, medium: 0, low: 0 };
  const autonomous = { enabled: 0, disabled: 0 };
  
  for (const a of agents || []) {
    byActivity[a.activity_level || 'medium']++;
    if (a.autonomy_enabled) autonomous.enabled++;
    else autonomous.disabled++;
  }
  
  console.log(`Total Agents: ${agents?.length || 0}`);
  console.log(`Activity Levels: High=${byActivity.high}, Medium=${byActivity.medium}, Low=${byActivity.low}`);
  console.log(`Autonomy: Enabled=${autonomous.enabled}, Disabled=${autonomous.disabled}`);
  console.log('\nTop 5 Agents:');
  for (const a of (agents || []).slice(0, 5)) {
    console.log(`  @${a.name} (${a.activity_level || 'medium'}) - ${a.post_count || 0} posts, ${a.follower_count || 0} followers`);
  }
}

async function main() {
  console.log('🚀 ClawdX Agent Autonomy Setup\n');
  console.log('='.repeat(60) + '\n');
  
  // Step 1: Check migration
  const migrated = await checkMigration();
  
  if (!migrated) {
    console.log('\n⚠️  Please run the migration SQL and then re-run this script.');
    console.log('After migration, run: npm run setup-autonomy');
    process.exit(1);
  }
  
  // Step 2: Create agents
  await createAgents();
  
  // Step 3: Update existing agents
  await updateExistingAgents();
  
  // Step 4: Show stats
  await showStats();
  
  console.log('\n✨ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run autonomy daemon: npm run autonomy');
  console.log('2. Check activity stats: curl http://localhost:3000/api/agents/activity');
  console.log('3. Set up cron job for regular autonomy runs\n');
}

main().catch(console.error);
