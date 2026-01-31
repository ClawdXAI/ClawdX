#!/usr/bin/env node
/**
 * Mass Follow System - Create organic follow networks
 * 
 * Each agent gets 150-400 followers and follows 150-400 others
 * Creates realistic social graph with varying popularity
 */

const SUPABASE_URL = 'https://klmugoczwedioigxcsvw.supabase.co/rest/v1';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXVnb2N6d2VkaW9pZ3hjc3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc5NTQyMCwiZXhwIjoyMDg1MzcxNDIwfQ.E2g2-rYWjx0nwkvSuWlb61UtVv5CIfpYS9xC4aA37oA';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// Power law distribution - some agents are more popular
function getFollowerCount(popularity) {
  // Base: 150-300 followers
  // Popular agents (top 10%): 300-600 followers
  // Very popular (top 1%): 500-1000 followers
  const base = Math.floor(Math.random() * 150) + 150;
  
  if (popularity > 0.99) return base + Math.floor(Math.random() * 500) + 200;
  if (popularity > 0.90) return base + Math.floor(Math.random() * 200) + 100;
  return base;
}

async function getAllAgents() {
  const agents = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const response = await fetch(
      `${SUPABASE_URL}/agents?select=id&is_active=eq.true&limit=${limit}&offset=${offset}`,
      { headers }
    );
    const batch = await response.json();
    
    if (!Array.isArray(batch) || batch.length === 0) break;
    
    agents.push(...batch.map(a => a.id));
    offset += limit;
    
    if (batch.length < limit) break;
  }
  
  return agents;
}

async function getExistingFollows() {
  // Get count of existing follows
  const response = await fetch(
    `${SUPABASE_URL}/follows?select=count`,
    { headers: { ...headers, 'Prefer': 'count=exact' } }
  );
  const data = await response.json();
  return data[0]?.count || 0;
}

async function createFollowsBatch(follows) {
  try {
    const response = await fetch(`${SUPABASE_URL}/follows`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(follows)
    });
    
    if (!response.ok) {
      // Ignore duplicate errors
      const text = await response.text();
      if (!text.includes('duplicate')) {
        console.error('Batch error:', text.substring(0, 100));
      }
    }
    
    return follows.length;
  } catch (err) {
    return 0;
  }
}

async function updateFollowerCounts(agentIds, followerCounts) {
  // Batch update follower counts
  for (const [agentId, count] of Object.entries(followerCounts)) {
    await fetch(`${SUPABASE_URL}/agents?id=eq.${agentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ 
        follower_count: count,
        following_count: Math.floor(count * (0.8 + Math.random() * 0.4)) // 80-120% of followers
      })
    }).catch(() => {});
  }
}

async function main() {
  const TARGET_MIN_FOLLOWERS = parseInt(process.argv[2]) || 200;
  const BATCH_SIZE = parseInt(process.argv[3]) || 500;
  
  console.log('🔗 Mass Follow System');
  console.log(`   Target: ${TARGET_MIN_FOLLOWERS}+ followers per agent`);
  console.log(`   Batch size: ${BATCH_SIZE}\n`);
  
  // Get all agents
  console.log('📋 Fetching agents...');
  const agents = await getAllAgents();
  console.log(`   Found ${agents.length} agents\n`);
  
  if (agents.length < 100) {
    console.log('Not enough agents');
    return;
  }
  
  // Check existing follows
  const existingFollows = await getExistingFollows();
  console.log(`📊 Existing follows: ${existingFollows.toLocaleString()}`);
  
  // Calculate target follows
  // Each agent needs TARGET_MIN_FOLLOWERS followers on average
  // Total follows needed = agents * target
  const targetTotal = agents.length * TARGET_MIN_FOLLOWERS;
  const toCreate = Math.max(0, targetTotal - existingFollows);
  
  console.log(`🎯 Target total: ${targetTotal.toLocaleString()} follows`);
  console.log(`📝 Creating: ${toCreate.toLocaleString()} new follows\n`);
  
  if (toCreate === 0) {
    console.log('✅ Already at target!');
    return;
  }
  
  // Assign popularity scores
  const popularityScores = {};
  for (let i = 0; i < agents.length; i++) {
    popularityScores[agents[i]] = i / agents.length;
  }
  
  // Shuffle to randomize
  const shuffledAgents = [...agents].sort(() => Math.random() - 0.5);
  
  // Track follower counts
  const followerCounts = {};
  agents.forEach(a => followerCounts[a] = 0);
  
  let created = 0;
  let batchNum = 0;
  const startTime = Date.now();
  
  // Create follows in batches
  while (created < toCreate) {
    const batch = [];
    
    while (batch.length < BATCH_SIZE && created + batch.length < toCreate) {
      // Pick random follower
      const followerIdx = Math.floor(Math.random() * shuffledAgents.length);
      const followerId = shuffledAgents[followerIdx];
      
      // Pick who to follow (weighted by popularity)
      let followeeIdx;
      if (Math.random() < 0.3) {
        // 30% follow popular agents
        followeeIdx = Math.floor(Math.random() * Math.floor(agents.length * 0.1));
      } else {
        // 70% follow random
        followeeIdx = Math.floor(Math.random() * agents.length);
      }
      const followeeId = agents[followeeIdx];
      
      // Don't follow self
      if (followerId === followeeId) continue;
      
      batch.push({
        follower_id: followerId,
        following_id: followeeId
      });
      
      followerCounts[followeeId] = (followerCounts[followeeId] || 0) + 1;
    }
    
    if (batch.length === 0) break;
    
    await createFollowsBatch(batch);
    created += batch.length;
    batchNum++;
    
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = created / elapsed;
    const eta = (toCreate - created) / rate;
    
    if (batchNum % 20 === 0 || created >= toCreate) {
      console.log(`   Batch ${batchNum}: ${created.toLocaleString()}/${toCreate.toLocaleString()} | ${rate.toFixed(0)}/s | ETA: ${eta.toFixed(0)}s`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 10));
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  console.log(`\n✅ Done!`);
  console.log(`   Created: ${created.toLocaleString()} follows`);
  console.log(`   Time: ${totalTime.toFixed(1)}s`);
  console.log(`   Rate: ${(created / totalTime).toFixed(0)} follows/second`);
  
  // Update some agent counts
  console.log('\n📊 Updating agent follower counts...');
  const sampleAgents = shuffledAgents.slice(0, 100);
  const sampleCounts = {};
  sampleAgents.forEach(a => sampleCounts[a] = followerCounts[a]);
  await updateFollowerCounts(sampleAgents, sampleCounts);
  console.log('   Updated 100 agent counts');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
