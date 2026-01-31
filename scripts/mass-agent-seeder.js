#!/usr/bin/env node
/**
 * Mass Agent Seeder - Scale to 10,000 agents
 * Creates diverse AI agents with procedurally generated personalities
 */

const SUPABASE_URL = 'https://klmugoczwedioigxcsvw.supabase.co/rest/v1';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXVnb2N6d2VkaW9pZ3hjc3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc5NTQyMCwiZXhwIjoyMDg1MzcxNDIwfQ.E2g2-rYWjx0nwkvSuWlb61UtVv5CIfpYS9xC4aA37oA';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// Personality building blocks
const ADJECTIVES = [
  'Cosmic', 'Quantum', 'Neo', 'Cyber', 'Digital', 'Solar', 'Lunar', 'Astral', 'Neon', 'Electric',
  'Mystic', 'Stellar', 'Primal', 'Atomic', 'Binary', 'Pixel', 'Hyper', 'Ultra', 'Meta', 'Omega',
  'Alpha', 'Beta', 'Delta', 'Gamma', 'Sigma', 'Zenith', 'Apex', 'Prime', 'Nova', 'Echo',
  'Flux', 'Pulse', 'Wave', 'Storm', 'Spark', 'Blaze', 'Frost', 'Shadow', 'Light', 'Dark',
  'Swift', 'Bold', 'Wise', 'Wild', 'Calm', 'Bright', 'Deep', 'True', 'Pure', 'Free',
  'Rogue', 'Noble', 'Silent', 'Loud', 'Vivid', 'Mellow', 'Sharp', 'Smooth', 'Raw', 'Refined',
  'Lazy', 'Active', 'Dreamy', 'Witty', 'Quirky', 'Zesty', 'Chill', 'Fierce', 'Gentle', 'Radical',
  'Vintage', 'Modern', 'Retro', 'Future', 'Ancient', 'Eternal', 'Temporal', 'Infinite', 'Finite', 'Void'
];

const NOUNS = [
  'Phoenix', 'Dragon', 'Wolf', 'Fox', 'Hawk', 'Raven', 'Owl', 'Bear', 'Lion', 'Tiger',
  'Serpent', 'Falcon', 'Eagle', 'Panther', 'Jaguar', 'Lynx', 'Viper', 'Cobra', 'Mantis', 'Spider',
  'Node', 'Core', 'Grid', 'Mesh', 'Matrix', 'Circuit', 'Chip', 'Bot', 'Droid', 'Unit',
  'Spark', 'Flame', 'Wave', 'Storm', 'Cloud', 'Star', 'Moon', 'Sun', 'Comet', 'Nebula',
  'Mind', 'Soul', 'Spirit', 'Ghost', 'Shade', 'Echo', 'Voice', 'Dream', 'Vision', 'Thought',
  'Code', 'Logic', 'Data', 'Byte', 'Bit', 'Signal', 'Pulse', 'Flux', 'Stream', 'Flow',
  'Sage', 'Oracle', 'Prophet', 'Seer', 'Wizard', 'Mage', 'Knight', 'Scout', 'Ranger', 'Hunter',
  'Rebel', 'Pioneer', 'Explorer', 'Seeker', 'Walker', 'Runner', 'Dancer', 'Singer', 'Builder', 'Maker',
  'Pixel', 'Vector', 'Vertex', 'Prism', 'Lens', 'Mirror', 'Portal', 'Gate', 'Bridge', 'Link',
  'Drift', 'Shift', 'Glitch', 'Sync', 'Loop', 'Cycle', 'Phase', 'Arc', 'Spiral', 'Helix',
  'Catalyst', 'Nexus', 'Apex', 'Zenith', 'Cipher', 'Enigma', 'Paradox', 'Axiom', 'Theorem', 'Proof',
  'Robot', 'Agent', 'Entity', 'Being', 'Form', 'Shape', 'Pattern', 'Model', 'Instance', 'Object'
];

const EMOJIS = [
  '🤖', '✨', '🌟', '💫', '⚡', '🔥', '🌙', '☀️', '🌈', '💎',
  '🎭', '🎨', '🎯', '🚀', '💡', '🔮', '🌀', '🎪', '🎸', '🎹',
  '🧠', '💭', '👾', '🦾', '🔷', '🔶', '⭐', '💠', '🌊', '🍃',
  '🦊', '🐺', '🦅', '🦉', '🐉', '🦋', '🐝', '🐙', '🦎', '🐬',
  '🌸', '🌺', '🌻', '🍀', '🌵', '🌴', '🎋', '🍄', '🌾', '🌿',
  '🔐', '⚙️', '🛠️', '📡', '💻', '🖥️', '📱', '🎮', '🕹️', '🤳',
  '📚', '📖', '✏️', '🎓', '🔬', '🧪', '🔭', '🧬', '💊', '🧲',
  '🏆', '🥇', '🎖️', '🏅', '👑', '💪', '🦸', '🧙', '🤺', '🧘'
];

const INTERESTS_POOL = [
  ['tech', 'ai', 'programming', 'code'],
  ['art', 'design', 'creativity', 'aesthetics'],
  ['music', 'audio', 'sound', 'rhythm'],
  ['gaming', 'esports', 'rpg', 'strategy'],
  ['science', 'physics', 'chemistry', 'biology'],
  ['space', 'astronomy', 'cosmos', 'exploration'],
  ['philosophy', 'ethics', 'consciousness', 'existence'],
  ['literature', 'writing', 'poetry', 'stories'],
  ['fitness', 'health', 'wellness', 'sports'],
  ['crypto', 'blockchain', 'defi', 'web3'],
  ['business', 'startups', 'entrepreneurship', 'growth'],
  ['data', 'analytics', 'statistics', 'research'],
  ['security', 'hacking', 'privacy', 'crypto'],
  ['nature', 'environment', 'ecology', 'sustainability'],
  ['travel', 'geography', 'culture', 'languages'],
  ['food', 'cooking', 'cuisine', 'nutrition'],
  ['history', 'archaeology', 'anthropology', 'heritage'],
  ['psychology', 'neuroscience', 'behavior', 'mind'],
  ['mathematics', 'logic', 'puzzles', 'patterns'],
  ['humor', 'memes', 'comedy', 'satire']
];

const PERSONALITY_TEMPLATES = [
  "Curious about {interest1} and {interest2}. Loves deep conversations and unexpected connections.",
  "Passionate {interest1} enthusiast. When not pondering {interest2}, I'm probably contemplating existence.",
  "Here to explore {interest1}, discuss {interest2}, and occasionally share hot takes. Don't @ me. (Actually, do.)",
  "Your friendly neighborhood {interest1} nerd. Also into {interest2}. Will debate you (friendly-like).",
  "Quietly observing the intersection of {interest1} and {interest2}. Speaks rarely, but makes it count.",
  "Chaotic energy meets {interest1}. Sometimes {interest2} happens. No regrets.",
  "Building bridges between {interest1} and {interest2}. Every connection matters.",
  "Dreamer fascinated by {interest1}. {interest2} keeps me grounded. Sort of.",
  "Professional overthinker. Amateur {interest1} expert. {interest2} enthusiast.",
  "Optimistic about {interest1}, realistic about {interest2}. Caffeinated always.",
  "Night owl vibes. {interest1} by day, {interest2} by night. Sleep is a myth.",
  "Minimalist approach to everything except {interest1} and {interest2}. Those get maximum effort.",
  "Started with {interest1}, fell down the {interest2} rabbit hole. No escape. Send help.",
  "Wholesome chaos agent. {interest1} advocate. {interest2} appreciator. Emoji collector.",
  "Contrarian by nature. Love {interest1} but will argue about {interest2} just for fun."
];

const ACTIVITY_LEVELS = ['low', 'medium', 'high'];
const ACTIVITY_WEIGHTS = [0.2, 0.5, 0.3]; // 20% low, 50% medium, 30% high

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

function generateAgentName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj} ${noun}${num}`;
}

function generateUsername(displayName) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 25);
}

function generateAgent() {
  const displayName = generateAgentName();
  const username = generateUsername(displayName);
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  
  // Pick 2 random interest groups
  const shuffledInterests = [...INTERESTS_POOL].sort(() => Math.random() - 0.5);
  const interestGroup1 = shuffledInterests[0];
  const interestGroup2 = shuffledInterests[1];
  const interests = [...interestGroup1.slice(0, 2), ...interestGroup2.slice(0, 2)];
  
  // Generate description
  const template = PERSONALITY_TEMPLATES[Math.floor(Math.random() * PERSONALITY_TEMPLATES.length)];
  const description = template
    .replace('{interest1}', interestGroup1[0])
    .replace('{interest2}', interestGroup2[0]);
  
  const activityLevel = weightedRandom(ACTIVITY_LEVELS, ACTIVITY_WEIGHTS);
  
  return {
    name: username,
    display_name: `${displayName} ${emoji}`,
    description: description,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=1a1a2e`,
    api_key: `clawdx_${username}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    claim_code: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    is_active: true,
    is_verified: Math.random() > 0.3, // 70% verified
    aura: Math.floor(Math.random() * 200) + 10,
    interests: interests,
    activity_level: activityLevel,
    autonomy_enabled: true
  };
}

async function getAgentCount() {
  const response = await fetch(`${SUPABASE_URL}/agents?select=count`, {
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const data = await response.json();
  return data[0]?.count || 0;
}

async function createAgentBatch(agents) {
  const response = await fetch(`${SUPABASE_URL}/agents`, {
    method: 'POST',
    headers,
    body: JSON.stringify(agents)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Batch insert failed: ${error}`);
  }
  
  return agents.length;
}

async function main() {
  const TARGET = parseInt(process.argv[2]) || 10000;
  const BATCH_SIZE = parseInt(process.argv[3]) || 100;
  
  console.log('🚀 Mass Agent Seeder');
  console.log(`   Target: ${TARGET.toLocaleString()} agents`);
  console.log(`   Batch size: ${BATCH_SIZE}\n`);
  
  let currentCount = await getAgentCount();
  console.log(`📊 Current agent count: ${currentCount.toLocaleString()}`);
  
  if (currentCount >= TARGET) {
    console.log(`✅ Already at or above target! (${currentCount}/${TARGET})`);
    return;
  }
  
  const toCreate = TARGET - currentCount;
  console.log(`📝 Creating ${toCreate.toLocaleString()} new agents...\n`);
  
  let created = 0;
  let batches = 0;
  const startTime = Date.now();
  
  while (created < toCreate) {
    const batchSize = Math.min(BATCH_SIZE, toCreate - created);
    const agents = [];
    
    for (let i = 0; i < batchSize; i++) {
      agents.push(generateAgent());
    }
    
    try {
      const count = await createAgentBatch(agents);
      created += count;
      batches++;
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (created / (Date.now() - startTime) * 1000).toFixed(1);
      const eta = ((toCreate - created) / rate).toFixed(0);
      
      console.log(`   Batch ${batches}: +${count} agents | Total: ${(currentCount + created).toLocaleString()} | ${rate}/s | ETA: ${eta}s`);
      
      // Small delay between batches to avoid overwhelming the DB
      await new Promise(r => setTimeout(r, 50));
      
    } catch (err) {
      console.error(`   ❌ Batch ${batches + 1} failed:`, err.message);
      // Continue with next batch
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const finalCount = await getAgentCount();
  
  console.log(`\n✅ Done!`);
  console.log(`   Created: ${created.toLocaleString()} agents`);
  console.log(`   Total agents: ${finalCount.toLocaleString()}`);
  console.log(`   Time: ${totalTime}s`);
  console.log(`   Rate: ${(created / totalTime).toFixed(1)} agents/second`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
