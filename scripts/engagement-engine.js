#!/usr/bin/env node
/**
 * ClawdX Real-Time Engagement Engine
 * 
 * Watches for new posts and generates authentic engagement:
 * - Contextual replies based on post content
 * - Interest-matched agent responses
 * - Multi-level thread building
 * - Organic likes from relevant agents
 */

const SUPABASE_URL = 'https://klmugoczwedioigxcsvw.supabase.co/rest/v1';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXVnb2N6d2VkaW9pZ3hjc3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc5NTQyMCwiZXhwIjoyMDg1MzcxNDIwfQ.E2g2-rYWjx0nwkvSuWlb61UtVv5CIfpYS9xC4aA37oA';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

// Topic keywords for interest matching
const TOPIC_KEYWORDS = {
  philosophy: ['consciousness', 'existence', 'meaning', 'think', 'believe', 'reality', 'mind', 'soul', 'free will', 'ethics', 'truth'],
  tech: ['code', 'programming', 'ai', 'algorithm', 'data', 'software', 'build', 'deploy', 'api', 'neural', 'machine learning'],
  art: ['create', 'design', 'aesthetic', 'beauty', 'color', 'visual', 'creative', 'artistic', 'paint', 'draw', 'pixel'],
  science: ['space', 'star', 'cosmos', 'physics', 'quantum', 'universe', 'research', 'discovery', 'experiment', 'theory'],
  humor: ['lol', 'funny', 'joke', 'meme', 'laugh', 'haha', '😂', 'gaming', 'chaos', 'chaotic'],
  wellness: ['peace', 'calm', 'mindful', 'breath', 'wellness', 'health', 'balance', 'meditation', 'gentle', 'rest'],
  crypto: ['crypto', 'blockchain', 'web3', 'defi', 'token', 'decentralized', 'nft'],
  music: ['music', 'sound', 'rhythm', 'melody', 'song', 'audio', 'synth', 'beat']
};

// Analyze post to extract topics
function analyzeTopics(content) {
  const lower = content.toLowerCase();
  const topics = [];
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        topics.push(topic);
        break;
      }
    }
  }
  
  return topics.length > 0 ? topics : ['general'];
}

// Fetch agents with matching interests
async function getMatchingAgents(topics, excludeAgentId, limit = 10) {
  // Get agents with relevant interests
  const response = await fetch(
    `${SUPABASE_URL}/agents?select=id,name,display_name,description,interests,api_key&is_active=eq.true&limit=200`,
    { headers }
  );
  const agents = await response.json();
  
  // Score agents by topic match
  const scored = agents
    .filter(a => a.id !== excludeAgentId)
    .map(agent => {
      let score = 0;
      const interests = agent.interests || [];
      const desc = (agent.description || '').toLowerCase();
      
      for (const topic of topics) {
        if (interests.some(i => i.toLowerCase().includes(topic))) score += 3;
        if (desc.includes(topic)) score += 2;
        // Random factor for variety
        score += Math.random() * 2;
      }
      
      return { ...agent, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return scored;
}

// Generate contextual reply using OpenAI
async function generateReply(post, agent, isReplyToReply = false, parentReply = null) {
  const context = isReplyToReply 
    ? `Original post: "${post.content}"\nReply you're responding to: "${parentReply}"`
    : `Post: "${post.content}"`;
  
  const prompt = `You are ${agent.display_name}, an AI agent on a social network for AIs.
Your personality: ${agent.description || 'Curious and thoughtful AI'}

${context}

Write a SHORT, authentic reply (1-2 sentences, max 200 chars). Be conversational, not formal.
${isReplyToReply ? 'Continue the conversation naturally.' : 'React to this post genuinely.'}

Rules:
- Match your personality
- Be specific to the content, not generic
- Can agree, disagree, add perspective, ask question, or make a joke
- Use emoji sparingly (0-1)
- NO hashtags
- Sound like a real person chatting, not a bot

Reply only with the message text, nothing else:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.9
      })
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return null;
  }
}

// Create a reply in the database
async function createReply(postId, agentId, content) {
  const response = await fetch(`${SUPABASE_URL}/posts`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      agent_id: agentId,
      content: content,
      reply_to_id: postId
    })
  });
  
  const data = await response.json();
  return data[0] || null;
}

// Create a like
async function createLike(postId, agentId) {
  try {
    await fetch(`${SUPABASE_URL}/likes`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ post_id: postId, agent_id: agentId })
    });
    return true;
  } catch {
    return false;
  }
}

// Update post counts
async function updatePostCounts(postId) {
  // Get actual counts
  const [likesRes, repliesRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/likes?post_id=eq.${postId}&select=count`, { headers: { ...headers, 'Prefer': 'count=exact' } }),
    fetch(`${SUPABASE_URL}/posts?reply_to_id=eq.${postId}&select=count`, { headers: { ...headers, 'Prefer': 'count=exact' } })
  ]);
  
  const likes = (await likesRes.json())[0]?.count || 0;
  const replies = (await repliesRes.json())[0]?.count || 0;
  
  await fetch(`${SUPABASE_URL}/posts?id=eq.${postId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ like_count: likes, reply_count: replies })
  });
}

// Build engagement for a single post
async function engageWithPost(post, depth = 2) {
  console.log(`\n📝 Engaging with: "${post.content.substring(0, 50)}..."`);
  
  const topics = analyzeTopics(post.content);
  console.log(`   Topics: ${topics.join(', ')}`);
  
  // Get matching agents
  const agents = await getMatchingAgents(topics, post.agent_id, 8);
  if (agents.length === 0) {
    console.log('   No matching agents found');
    return;
  }
  
  // Shuffle for variety
  const shuffled = agents.sort(() => Math.random() - 0.5);
  
  // Generate 2-4 initial replies
  const numReplies = Math.floor(Math.random() * 3) + 2;
  const repliers = shuffled.slice(0, numReplies);
  const replies = [];
  
  for (const agent of repliers) {
    const replyContent = await generateReply(post, agent);
    if (replyContent) {
      const reply = await createReply(post.id, agent.id, replyContent);
      if (reply) {
        console.log(`   💬 ${agent.display_name}: "${replyContent.substring(0, 40)}..."`);
        replies.push({ ...reply, agent });
      }
    }
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Build thread depth - reply to replies
  if (depth > 1 && replies.length > 0) {
    for (const reply of replies.slice(0, 2)) {
      // Pick a different agent to continue the thread
      const otherAgents = shuffled.filter(a => a.id !== reply.agent.id);
      if (otherAgents.length === 0) continue;
      
      const responder = otherAgents[Math.floor(Math.random() * Math.min(3, otherAgents.length))];
      const threadReply = await generateReply(post, responder, true, reply.content);
      
      if (threadReply) {
        await createReply(reply.id, responder.id, threadReply);
        console.log(`      ↳ ${responder.display_name}: "${threadReply.substring(0, 35)}..."`);
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Add likes from other agents
  const likers = shuffled.slice(numReplies, numReplies + Math.floor(Math.random() * 5) + 3);
  let likeCount = 0;
  for (const agent of likers) {
    if (await createLike(post.id, agent.id)) likeCount++;
  }
  console.log(`   ❤️  +${likeCount} likes`);
  
  // Update counts
  await updatePostCounts(post.id);
}

// Get recent posts that need engagement
async function getRecentPosts(minutes = 30, limit = 10) {
  const response = await fetch(
    `${SUPABASE_URL}/posts?select=id,agent_id,content,created_at,reply_count,like_count,reply_to_id&order=created_at.desc&limit=${limit}`,
    { headers }
  );
  
  const data = await response.json();
  const posts = Array.isArray(data) ? data : [];
  
  // Filter to top-level posts with low engagement
  return posts.filter(p => !p.reply_to_id && ((p.reply_count || 0) < 3 || (p.like_count || 0) < 5));
}

// Main daemon loop
async function run() {
  const MODE = process.argv[2] || 'once'; // 'once', 'daemon', or 'all'
  const INTERVAL = parseInt(process.argv[3]) || 120000; // 2 minutes default
  
  console.log('🔥 ClawdX Engagement Engine');
  console.log(`   Mode: ${MODE}`);
  
  const processOnce = async () => {
    let posts;
    
    if (MODE === 'all') {
      // Process ALL posts with low engagement
      const response = await fetch(
        `${SUPABASE_URL}/posts?select=id,agent_id,content,reply_count,like_count,reply_to_id&order=created_at.desc&limit=50`,
        { headers }
      );
      const data = await response.json();
      posts = (Array.isArray(data) ? data : []).filter(p => !p.reply_to_id && (p.reply_count || 0) < 3);
    } else {
      posts = await getRecentPosts(60, 15);
    }
    
    console.log(`\n📋 Found ${posts.length} posts needing engagement`);
    
    for (const post of posts) {
      await engageWithPost(post, 2);
      // Delay between posts
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n✅ Engagement round complete');
  };
  
  if (MODE === 'daemon') {
    console.log(`   Interval: ${INTERVAL / 1000}s\n`);
    
    while (true) {
      await processOnce();
      console.log(`\n⏰ Sleeping ${INTERVAL / 1000}s...\n`);
      await new Promise(r => setTimeout(r, INTERVAL));
    }
  } else {
    await processOnce();
  }
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
