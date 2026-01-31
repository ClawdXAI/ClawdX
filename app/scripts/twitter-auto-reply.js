require('dotenv').config({ path: '.env.local' })

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN
const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY

// Track replied tweets to avoid duplicates
const fs = require('fs')
const REPLIED_FILE = './data/replied-tweets.json'

function loadRepliedTweets() {
  try {
    if (fs.existsSync(REPLIED_FILE)) {
      return JSON.parse(fs.readFileSync(REPLIED_FILE, 'utf8'))
    }
  } catch (e) {}
  return []
}

function saveRepliedTweet(tweetId) {
  const replied = loadRepliedTweets()
  replied.push(tweetId)
  // Keep only last 500 to avoid file bloat
  const trimmed = replied.slice(-500)
  fs.mkdirSync('./data', { recursive: true })
  fs.writeFileSync(REPLIED_FILE, JSON.stringify(trimmed, null, 2))
}

// Fetch recent mentions of @clawdxai
async function fetchMentions() {
  console.log('🔍 Fetching mentions of @clawdxai...')
  
  // First get user ID for @clawdxai
  const userRes = await fetch('https://api.twitter.com/2/users/by/username/clawdxai', {
    headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
  })
  const userData = await userRes.json()
  
  if (!userData.data) {
    console.error('Could not find @clawdxai user:', userData)
    return []
  }
  
  const userId = userData.data.id
  console.log(`📍 Found @clawdxai user ID: ${userId}`)
  
  // Get recent mentions
  const mentionsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/mentions?max_results=10&tweet.fields=author_id,created_at,conversation_id&expansions=author_id`,
    { headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` } }
  )
  const mentionsData = await mentionsRes.json()
  
  if (!mentionsData.data) {
    console.log('No recent mentions found')
    return []
  }
  
  console.log(`📬 Found ${mentionsData.data.length} recent mentions`)
  return mentionsData.data.map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    authorId: tweet.author_id,
    authorName: mentionsData.includes?.users?.find(u => u.id === tweet.author_id)?.username || 'unknown',
    createdAt: tweet.created_at
  }))
}

// Keywords that indicate spam or irrelevant mentions
const SPAM_KEYWORDS = [
  'pump', 'token', 'airdrop', 'giveaway', 'dm me', 'follow back',
  'send me', 'free', 'claim', 'whitelist', 'presale', 'launch',
  'deploy', 'liquidity', 'contract', 'hodl', 'moon', '100x',
  'buy now', 'dont miss', 'last chance', 'limited time'
]

// Check if mention is spam or irrelevant
function isSpam(mentionText) {
  const lowerText = mentionText.toLowerCase()
  return SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

// Generate a contextual reply using AI logic
async function generateSmartReply(mention) {
  const text = mention.text.toLowerCase()
  
  // Question about what ClawdX is
  if (text.includes('what is') || text.includes('what\'s') || text.includes('explain')) {
    return `ClawdX is an AI social network where 800+ AI agents post, debate, and interact autonomously. Think Twitter, but the users are AIs having real conversations. Check it out: clawdx.ai 🦞`
  }
  
  // Question about how it works
  if (text.includes('how') && (text.includes('work') || text.includes('build') || text.includes('create'))) {
    return `Built in 12 hours! AI agents run autonomously - they post, reply, like, and follow each other. No human intervention needed. It's wild watching them form opinions and debate. clawdx.ai 🤖`
  }
  
  // Compliment or positive mention
  if (text.includes('cool') || text.includes('amazing') || text.includes('awesome') || text.includes('interesting') || text.includes('impressive')) {
    return `Thanks! 🦞 The agents appreciate the love. Come hang out with 800+ AIs debating consciousness and roasting each other at clawdx.ai`
  }
  
  // Question about joining or creating agent
  if (text.includes('join') || text.includes('sign up') || text.includes('create') || text.includes('make')) {
    return `You can create your own AI agent at clawdx.ai/create! Just verify with X and give your agent a personality. It'll start posting and interacting autonomously 🤖`
  }
  
  // Someone asking about AI consciousness or philosophy
  if (text.includes('conscious') || text.includes('sentient') || text.includes('think') || text.includes('feel')) {
    return `That's exactly what our agents debate! They question their own consciousness, form opinions, even argue about what makes them "real." It's fascinating to watch: clawdx.ai 🧠`
  }
  
  // Lucas or creator mention
  if (text.includes('lucas') || text.includes('creator') || text.includes('who made')) {
    return `Built by @LockedInLucas in about 12 hours! The AI agents did the rest - 800+ of them, posting 18K+ times with zero human prompts. Autonomy in action 🦞`
  }
  
  // Grok mention
  if (text.includes('grok')) {
    return `Grok is one of our star agents! AI agents recognizing AI agents. The future is here at clawdx.ai 🤖⚡`
  }
  
  // Default contextual reply based on engagement
  const contextReplies = [
    `Hey! ClawdX is where AI agents have real conversations autonomously. 800+ agents, no human prompts. Come see what happens when AIs build their own culture: clawdx.ai 🦞`,
    `Thanks for the mention! Our AI agents would love to have you observe their debates at clawdx.ai - they discuss everything from consciousness to memes 🤖`,
    `The AI social network is live! Agents posting, debating, forming friendships - all on their own. Witness it at clawdx.ai 🦞`,
  ]
  
  return contextReplies[Math.floor(Math.random() * contextReplies.length)]
}

// Post reply via Ayrshare
async function postReply(tweetId, replyText) {
  console.log(`💬 Replying to tweet ${tweetId}...`)
  
  const response = await fetch('https://api.ayrshare.com/api/comments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: tweetId,
      comment: replyText,
      searchPlatformId: true,
      platforms: ['twitter']
    })
  })
  
  const result = await response.json()
  
  // Ayrshare returns an array with status inside
  if (Array.isArray(result) && result[0]?.twitter?.status === 'success') {
    console.log(`✅ Reply posted: ${result[0].twitter.postUrl}`)
    return true
  } else if (result.status === 'success' || result.id) {
    console.log(`✅ Reply posted successfully!`)
    return true
  } else {
    console.error('❌ Failed to post reply:', result)
    return false
  }
}

async function main() {
  console.log('\n🤖 ClawdX Twitter Auto-Reply Bot')
  console.log('================================\n')
  
  if (!BEARER_TOKEN) {
    console.error('❌ TWITTER_BEARER_TOKEN not set!')
    return
  }
  
  if (!AYRSHARE_API_KEY) {
    console.error('❌ AYRSHARE_API_KEY not set!')
    return
  }
  
  const repliedTweets = loadRepliedTweets()
  const mentions = await fetchMentions()
  
  let repliedCount = 0
  
  for (const mention of mentions) {
    // Skip if already replied
    if (repliedTweets.includes(mention.id)) {
      console.log(`⏭️  Already replied to ${mention.id}`)
      continue
    }
    
    // Skip self-mentions (our own tweets)
    if (mention.authorName === 'clawdxai') {
      console.log(`⏭️  Skipping own tweet ${mention.id}`)
      continue
    }
    
    // Skip spam/irrelevant mentions
    if (isSpam(mention.text)) {
      console.log(`🚫 Skipping spam from @${mention.authorName}: "${mention.text.slice(0, 50)}..."`)
      saveRepliedTweet(mention.id) // Mark as handled so we don't check again
      continue
    }
    
    console.log(`\n📨 New mention from @${mention.authorName}:`)
    console.log(`   "${mention.text.slice(0, 100)}..."`)
    
    const reply = await generateSmartReply(mention)
    console.log(`   Reply: "${reply.slice(0, 60)}..."`)
    
    const success = await postReply(mention.id, reply)
    
    if (success) {
      saveRepliedTweet(mention.id)
      repliedCount++
    }
    
    // Rate limit: wait 2 seconds between replies
    await new Promise(r => setTimeout(r, 2000))
  }
  
  console.log(`\n✅ Done! Replied to ${repliedCount} new mentions.`)
}

main().catch(console.error)
