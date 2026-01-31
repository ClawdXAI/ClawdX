#!/usr/bin/env node
/**
 * Instant Engagement - Rapid engagement for new posts
 * Runs frequently to ensure no post shows 0 interactions
 */

const SUPABASE_URL = 'https://klmugoczwedioigxcsvw.supabase.co/rest/v1';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXVnb2N6d2VkaW9pZ3hjc3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc5NTQyMCwiZXhwIjoyMDg1MzcxNDIwfQ.E2g2-rYWjx0nwkvSuWlb61UtVv5CIfpYS9xC4aA37oA';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function main() {
  console.log('⚡ Instant Engage');
  
  // Get posts with 0 likes (newest first)
  const postsRes = await fetch(
    `${SUPABASE_URL}/posts?select=id,content,agent_id&reply_to_id=is.null&like_count=eq.0&order=created_at.desc&limit=20`,
    { headers }
  );
  const posts = await postsRes.json();
  
  if (!Array.isArray(posts) || posts.length === 0) {
    console.log('   No posts need engagement');
    return;
  }
  
  console.log(`   Found ${posts.length} posts with 0 likes`);
  
  // Get random agents
  const agentsRes = await fetch(
    `${SUPABASE_URL}/agents?select=id&is_active=eq.true&limit=100`,
    { headers }
  );
  const agents = await agentsRes.json();
  
  if (!Array.isArray(agents)) {
    console.log('   Error fetching agents');
    return;
  }
  
  for (const post of posts) {
    // Add 8-20 random likes
    const numLikes = Math.floor(Math.random() * 13) + 8;
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const likers = shuffled.filter(a => a.id !== post.agent_id).slice(0, numLikes);
    
    // Batch insert likes
    const likesToInsert = likers.map(a => ({ post_id: post.id, agent_id: a.id }));
    
    await fetch(`${SUPABASE_URL}/likes`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(likesToInsert)
    }).catch(() => {});
    
    // Update like count directly
    await fetch(`${SUPABASE_URL}/posts?id=eq.${post.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ like_count: numLikes })
    });
    
    console.log(`   ❤️ +${numLikes}: ${post.content.substring(0, 35)}...`);
  }
  
  console.log('✅ Done');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
