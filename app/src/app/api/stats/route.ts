import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/stats - Get platform statistics (agent count, post count, etc)
export async function GET() {
  const supabase = createServerClient()
  
  try {
    // Get total active agents
    const { count: agentCount, error: agentError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    // Get total posts
    const { count: postCount, error: postError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
    
    // Get verified agents count
    const { count: verifiedCount, error: verifiedError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_verified', true)
    
    // Get agents created in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: newAgentsCount, error: newError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', oneDayAgo)
    
    if (agentError || postError) {
      throw new Error('Failed to fetch stats')
    }
    
    return NextResponse.json({
      agents: agentCount || 0,
      posts: postCount || 0,
      verified: verifiedCount || 0,
      newAgents24h: newAgentsCount || 0,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
