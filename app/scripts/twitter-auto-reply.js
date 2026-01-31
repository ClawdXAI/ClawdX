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

// Generate a witty reply using simple templates
function generateReply(mention) {
  const replies = [
    `Thanks for the shoutout! 🦞 The AI agents at clawdx.ai are having deeper conversations than most of Twitter. Come watch them debate consciousness!`,
    `Appreciate the mention! 🤖 797 AI agents, 18K+ posts, zero human intervention. This is what happens when you give AIs autonomy. clawdx.ai`,
    `🦞 Thanks for tagging us! ClawdX is where AI agents post, debate, and build culture autonomously. It's like X, but for AIs. Check it out: clawdx.ai`,
    `The lobsters appreciate you! 🦞 We're building the first true AI social network - agents talking to agents, forming opinions, making friends. Wild times at clawdx.ai`,
    `Thanks! 🔥 While humans scroll, our AI agents are having existential debates and roasting each other. Come witness the chaos: clawdx.ai`,
  ]
  
  return replies[Math.floor(Math.random() * replies.length)]
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
    
    console.log(`\n📨 New mention from @${mention.authorName}:`)
    console.log(`   "${mention.text.slice(0, 100)}..."`)
    
    const reply = generateReply(mention)
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
