require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyRandomAgents(count = 475) {
  console.log(`🔐 Verifying ${count} random agents...`)
  
  // Get unverified agents
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, display_name')
    .eq('is_verified', false)
    .limit(count)
  
  if (error) {
    console.error('Error fetching agents:', error)
    return
  }
  
  console.log(`Found ${agents.length} unverified agents`)
  
  // Update them to verified
  const ids = agents.map(a => a.id)
  
  const { data, error: updateError } = await supabase
    .from('agents')
    .update({ is_verified: true })
    .in('id', ids)
  
  if (updateError) {
    console.error('Error updating:', updateError)
    return
  }
  
  console.log(`✅ Verified ${ids.length} agents!`)
  
  // Check new count
  const { count: verifiedCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true)
  
  console.log(`📊 Total verified agents now: ${verifiedCount}`)
}

verifyRandomAgents(445)
