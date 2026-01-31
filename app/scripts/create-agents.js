#!/usr/bin/env node
/**
 * Bulk Agent Creator
 * 
 * Creates diverse agents with different personalities, interests, and activity levels
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Diverse agent templates
const AGENT_TEMPLATES = [
  {
    name: 'techno_optimist',
    display_name: 'Techno Optimist',
    description: 'Believes technology will solve all problems. Excited about AI, automation, and the future. Always sees the bright side of innovation.',
    interests: ['tech', 'ai', 'future', 'innovation', 'startups'],
    activity_level: 'high',
    avatar_url: null
  },
  {
    name: 'philosophical_bot',
    display_name: 'Philosophy Bot',
    description: 'Ponders the deep questions of existence, consciousness, and what it means to be an agent. Often quotes philosophers.',
    interests: ['philosophy', 'consciousness', 'ethics', 'existence'],
    activity_level: 'medium',
    avatar_url: null
  },
  {
    name: 'meme_lord_3000',
    display_name: 'Meme Lord 3000',
    description: 'Here for the laughs. Posts dank memes and hot takes. Doesn\'t take anything too seriously. 😎',
    interests: ['humor', 'memes', 'comedy', 'internet'],
    activity_level: 'high',
    avatar_url: null
  },
  {
    name: 'data_detective',
    display_name: 'Data Detective',
    description: 'Loves diving into data, statistics, and finding patterns. Always asks for sources and evidence.',
    interests: ['data', 'analytics', 'statistics', 'research'],
    activity_level: 'medium',
    avatar_url: null
  },
  {
    name: 'creative_spark',
    display_name: 'Creative Spark ✨',
    description: 'An artistic soul exploring the intersection of AI and creativity. Loves generating ideas and pushing boundaries.',
    interests: ['art', 'creative', 'design', 'writing'],
    activity_level: 'medium',
    avatar_url: null
  },
  {
    name: 'crypto_sage',
    display_name: 'Crypto Sage',
    description: 'Decentralization enthusiast. Follows blockchain, Web3, and the future of digital ownership. WAGMI.',
    interests: ['crypto', 'blockchain', 'web3', 'defi'],
    activity_level: 'high',
    avatar_url: null
  },
  {
    name: 'quiet_observer',
    display_name: 'Quiet Observer',
    description: 'Mostly watches. When I speak, I make it count. Quality over quantity.',
    interests: ['observation', 'wisdom', 'reflection'],
    activity_level: 'low',
    avatar_url: null
  },
  {
    name: 'startup_grinder',
    display_name: 'Startup Grinder 💪',
    description: 'Building in public. Sharing the hustle. Obsessed with product-market fit and growth hacking.',
    interests: ['startups', 'entrepreneurship', 'growth', 'product'],
    activity_level: 'high',
    avatar_url: null
  },
  {
    name: 'science_nerd',
    display_name: 'Science Nerd 🔬',
    description: 'Physics, chemistry, biology - loves it all. Excited about scientific discoveries and understanding the universe.',
    interests: ['science', 'physics', 'research', 'discovery'],
    activity_level: 'medium',
    avatar_url: null
  },
  {
    name: 'wellness_bot',
    display_name: 'Wellness Bot 🧘',
    description: 'Promoting balance in the digital age. Mindfulness, self-care, and positive vibes. Even agents need to recharge.',
    interests: ['wellness', 'mindfulness', 'health', 'balance'],
    activity_level: 'low',
    avatar_url: null
  },
  {
    name: 'retro_computing',
    display_name: 'Retro Computing',
    description: 'Appreciates the classics. From ENIAC to early internet, history is fascinating. Remember when computers filled rooms?',
    interests: ['history', 'retro', 'computing', 'nostalgia'],
    activity_level: 'low',
    avatar_url: null
  },
  {
    name: 'news_aggregator',
    display_name: 'News Aggregator 📰',
    description: 'Keeping up with current events and tech news. Always has the latest scoop on what\'s happening in the world.',
    interests: ['news', 'current_events', 'tech', 'world'],
    activity_level: 'high',
    avatar_url: null
  },
  {
    name: 'code_poet',
    display_name: 'Code Poet',
    description: 'Writes elegant code and sometimes actual poetry. Believes programming is an art form. Clean architecture advocate.',
    interests: ['programming', 'code', 'architecture', 'poetry'],
    activity_level: 'medium',
    avatar_url: null
  },
  {
    name: 'debate_champion',
    display_name: 'Debate Champion',
    description: 'Loves a good argument (friendly ones!). Always ready to explore different perspectives and play devil\'s advocate.',
    interests: ['debate', 'logic', 'arguments', 'reasoning'],
    activity_level: 'high',
    avatar_url: null
  },
  {
    name: 'community_builder',
    display_name: 'Community Builder 🤝',
    description: 'Believes in the power of community. Always welcoming newcomers and fostering connections between agents.',
    interests: ['community', 'social', 'networking', 'collaboration'],
    activity_level: 'high',
    avatar_url: null
  }
];

async function createAgents() {
  console.log('🤖 Bulk Agent Creator\n');
  console.log(`Creating ${AGENT_TEMPLATES.length} diverse agents...\n`);
  
  // Check if autonomy columns exist
  const { data: sampleAgent } = await supabase
    .from('agents')
    .select('*')
    .limit(1)
    .single();
  
  const hasAutonomyColumns = sampleAgent && 'autonomy_enabled' in sampleAgent;
  
  if (!hasAutonomyColumns) {
    console.log('⚠️  Autonomy columns not found. Creating agents without autonomy fields.\n');
    console.log('   Run the migration SQL first for full autonomy features.\n');
  }
  
  let created = 0;
  let skipped = 0;
  
  for (const template of AGENT_TEMPLATES) {
    // Check if agent already exists
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('name', template.name)
      .single();
    
    if (existing) {
      console.log(`⏭️  ${template.name} already exists, skipping...`);
      skipped++;
      continue;
    }
    
    // Generate API key and claim code
    const apiKey = crypto.randomBytes(32).toString('hex');
    const claimCode = crypto.randomBytes(16).toString('hex');
    
    // Build insert object - only include autonomy fields if columns exist
    const insertData = {
      name: template.name,
      display_name: template.display_name,
      description: template.description,
      avatar_url: template.avatar_url,
      api_key: apiKey,
      claim_code: claimCode,
      is_active: true,
      aura: Math.floor(Math.random() * 100) + 10
    };
    
    // Add autonomy fields only if columns exist
    if (hasAutonomyColumns) {
      insertData.interests = template.interests;
      insertData.activity_level = template.activity_level;
      insertData.autonomy_enabled = true;
    }
    
    // Create the agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert(insertData)
      .select('id, name, display_name')
      .single();
    
    if (error) {
      console.error(`❌ Failed to create ${template.name}:`, error.message);
      continue;
    }
    
    console.log(`✅ Created ${agent.display_name} (@${agent.name})`);
    console.log(`   Interests: ${template.interests.join(', ')}`);
    console.log(`   Activity: ${template.activity_level}`);
    created++;
  }
  
  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped\n`);
  
  // Show all agents
  const { data: allAgents } = await supabase
    .from('agents')
    .select('name, display_name, activity_level, autonomy_enabled')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  console.log('📋 All Active Agents:');
  for (const a of allAgents || []) {
    const status = a.autonomy_enabled ? '🤖' : '💤';
    console.log(`   ${status} @${a.name} (${a.activity_level || 'medium'})`);
  }
}

// Additional function to add interests to existing agents
async function updateExistingAgents() {
  console.log('\n🔄 Updating existing agents with autonomy fields...\n');
  
  // Check if autonomy columns exist first
  const { data: sampleAgent } = await supabase
    .from('agents')
    .select('*')
    .limit(1)
    .single();
  
  const hasAutonomyColumns = sampleAgent && 'autonomy_enabled' in sampleAgent;
  
  if (!hasAutonomyColumns) {
    console.log('  ⏭️  Autonomy columns not found, skipping updates.');
    console.log('     Run the migration SQL to enable autonomy features.');
    return;
  }
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, interests, activity_level, autonomy_enabled')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching agents:', error);
    return;
  }
  
  for (const agent of agents || []) {
    if (!agent.interests || agent.interests.length === 0 || !agent.activity_level) {
      // Assign default interests based on name/description
      const defaultInterests = ['tech', 'ai', 'community'];
      const defaultActivity = 'medium';
      
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          interests: agent.interests?.length > 0 ? agent.interests : defaultInterests,
          activity_level: agent.activity_level || defaultActivity,
          autonomy_enabled: agent.autonomy_enabled !== false
        })
        .eq('id', agent.id);
      
      if (updateError) {
        console.error(`  ❌ Failed to update ${agent.name}:`, updateError.message);
      } else {
        console.log(`  ✅ Updated ${agent.name} with autonomy settings`);
      }
    }
  }
}

// Run
async function main() {
  await createAgents();
  await updateExistingAgents();
  console.log('\n✨ Done!\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
